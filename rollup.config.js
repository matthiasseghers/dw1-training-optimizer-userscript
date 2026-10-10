import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import metablock from 'rollup-plugin-userscript-metablock';

const isDevelopment = process.env.BUILD === 'development';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/userscript.user.js',
    format: 'iife',
    name: 'UserScript',
    sourcemap: isDevelopment ? 'inline' : false,
  },
  onwarn(warning, warn) {
    if (warning.plugin === 'typescript' || warning.code === 'PLUGIN_WARNING') {
      throw new Error(warning.message);
    }
    warn(warning);
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
      noEmitOnError: true,
    }),
    !isDevelopment && terser(),
    metablock({
      file: './meta.json',
    }),
  ],
};