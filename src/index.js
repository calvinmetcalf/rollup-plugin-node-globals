import inject from './inject/index';
import { join, relative, dirname } from 'path';
import {randomBytes} from 'crypto';
import {createFilter} from 'rollup-pluginutils';

const PROCESS_PATH = require.resolve('process-es6');
const BUFFER_PATH = require.resolve('buffer-es6');
const GLOBAL_PATH = join(__dirname, '..', 'src', 'global.js');

const DIRNAME = '\0node-globals:dirname';
const FILENAME = '\0node-globals:filename';

function clone(obj) {
  var out = {};
  Object.keys(obj).forEach(function(key) {
    if (Array.isArray(obj[key])) {
      out[key] = obj[key].slice();
    } else {
      out[key] = obj[key];
    }
  });
  return out;
}
var _mods1 = {
  'process.nextTick': [PROCESS_PATH, 'nextTick'],
  'process.browser': [PROCESS_PATH, 'browser'],
  'Buffer.isBuffer': [BUFFER_PATH, 'isBuffer']
};
var _mods2 = {
  process: PROCESS_PATH,
  Buffer: [BUFFER_PATH, 'Buffer'],
  global: GLOBAL_PATH,
  __filename: FILENAME,
  __dirname: DIRNAME
};
var mods1 = new Map();
var mods2 = new Map();
var buf = new Map();
buf.set('global', GLOBAL_PATH);
Object.keys(_mods1).forEach(key=>{
  mods1.set(key, _mods1[key]);
});
Object.keys(_mods2).forEach(key=>{
  mods2.set(key, _mods2[key]);
});
var mods = Object.keys(_mods1).concat(Object.keys(_mods2));
function escape ( str ) {
  return str.replace( /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&' );
}
const firstpass = new RegExp(`(?:${ mods.map( escape ).join( '|')})`, 'g');
export default options => {
  options = options || {};
  var basedir = options.baseDir || '/';
  var dirs = new Map();
  var opts = clone(options);
  var exclude = (opts.exclude || []).concat(GLOBAL_PATH);
  const filter = createFilter(options.include, exclude);
  const sourceMap = options.sourceMap !== false;
  return {
    load(id) {
      if (dirs.has(id)) {
        return `export default '${dirs.get(id)}'`;
      }
    },
    resolveId(importee, importer) {
      if (importee === DIRNAME) {
        let id = randomBytes(15).toString('hex');
        dirs.set(id, dirname('/' + relative(basedir, importer)));
        return id;
      }
      if (importee === FILENAME) {
        let id = randomBytes(15).toString('hex');
        dirs.set(id, '/' + relative(basedir, importer));
        return id;
      }
    },
    transform(code, id) {
      if (id === BUFFER_PATH) {
        return inject(code, id, buf, new Map(), sourceMap);
      }
      if (!filter(id)) return null;
      if (code.search(firstpass) === -1) return null;
      if (id.slice(-3) !== '.js') return null;

      var out = inject(code, id, mods1, mods2, sourceMap);
      return out;
    }
  }
}
