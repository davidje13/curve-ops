import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

export default [
	{
		input: 'src/index.mts',
		output: { dir: 'build', format: 'esm' },
		plugins: [
			typescript({
				compilerOptions: {
					noEmit: false,
					declaration: true,
					rewriteRelativeImportExtensions: true,
					rootDir: '.',
					declarationDir: './build/types',
				},
				include: ['src/**'],
				exclude: ['**/*.test.*', '**/test-helpers/*'],
				tslib: {},
			}),
			terser({
				ecma: 2015,
				module: true,
				compress: {
					passes: 2,
					unsafe_arrows: true,
					pure_getters: 'strict',
					pure_new: true,
				},
				format: { ascii_only: true, preserve_annotations: true },
				mangle: {
					properties: { regex: /^_/ },
				},
			}),
		],
	},
	{
		input: './build/types/src/index.d.mts',
		output: [{ file: 'build/index.d.ts', format: 'esm' }],
		plugins: [dts()],
	},
];
