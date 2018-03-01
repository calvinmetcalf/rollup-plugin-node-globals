
var rollup = require( 'rollup' );
var nodeResolve = require( 'rollup-plugin-node-resolve' );
var globals = require( '../dist/rollup-plugin-node-globals.cjs' );
var path = require('path');
var vm = require('vm');
var files = [
  // 'imports.js',
  // 'isBuffer.js',
  // 'buffer.js',
  // 'process-generic.js',
  // 'process-nexttick.js',
  // 'dirname.js',
  'process-browser.js',
  // 'global.js',
  // 'sneaky.js'
];
describe( 'rollup-plugin-node-globals', function () {
  files.forEach(function (file) {
	it( 'works with ' + file, function () {
		return rollup.rollup({
			input: 'test/examples/' + file,
			plugins: [
        {
          resolveId: function (importee){
            if (importee === 'buffer') {
              return require.resolve('buffer-es6');
            }
          }
        },
				globals()
			]
		}).then( async function ( bundle ) {
			var generated = await bundle.generate({format: 'es'});
			var code = generated.code;
      console.log(code);
      var script = new vm.Script(code);
      var context = vm.createContext({
        dirname: path.join(__dirname, 'examples'),
        filename: path.join(__dirname, 'examples', 'dirname.js'),
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
      });
      context.self = context;
			script.runInContext(context);
		});
	});
});

  it( 'works with rollup-plugin-node-resolve', function () {
    return rollup.rollup({
      input: 'test/examples/dirname.js',
      plugins: [
        nodeResolve(),
        globals()
      ]
    }).then( async function ( bundle ) {
      var generated = await bundle.generate({format: "es"});
      var code = generated.code;
      var script = new vm.Script(code);
      var context = vm.createContext({
        dirname: path.join(__dirname, 'examples'),
        filename: path.join(__dirname, 'examples', 'dirname.js'),
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
      });
      context.self = context;
      script.runInContext(context);
    });
  });
});
