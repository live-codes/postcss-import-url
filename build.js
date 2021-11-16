var fs = require('fs');
var path = require('path');

const esbuild = require('esbuild');
const NodeModulesPolyfills = require('@esbuild-plugins/node-modules-polyfill').default;
const GlobalsPolyfills = require('@esbuild-plugins/node-globals-polyfill').default;

const nodePolyfills = [
  NodeModulesPolyfills(),
  GlobalsPolyfills({
    process: true,
    buffer: true,
    define: {
      global: 'window',
      'process.env.NODE_ENV': '"production"',
    },
  }),
];

var file_to_patch = path.resolve(__dirname + '/node_modules/postcss/lib/previous-map.js');
fs.readFile(file_to_patch, 'utf8', function (err, data) {
  if (err) return console.log(err);
  var result = data.replace(/require\('fs'\)/g, '{ existsSync: () => false, readFileSync: "" }');
  fs.writeFile(file_to_patch, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

esbuild.build({
  entryPoints: ['index.ts'],
  outfile: 'dist/postcss-import-url.js',
  format: 'iife',
  globalName: 'postcssImportUrl',
  bundle: true,
  minify: true,
  sourcemap: true,
  define: {
    global: 'window',
    'process.env.NODE_ENV': '"production"',
  },
  plugins: nodePolyfills,
});
