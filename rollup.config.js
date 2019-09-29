import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default [
  // UMD Development
  {
    input: 'src/index.js',
    output: {
      file: 'dist/webext-redux.js',
      format: 'umd',
      name: 'WebextRedux',
      indent: false
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      babel({
        exclude: 'node_modules/**'
      }),
    ],
  },

  // UMD Production
  {
    input: 'src/index.js',
    output: {
      file: 'dist/webext-redux.min.js',
      format: 'umd',
      name: 'WebextRedux',
      indent: false
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      babel({
        exclude: 'node_modules/**'
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        },
      }),
    ],
  },
];
