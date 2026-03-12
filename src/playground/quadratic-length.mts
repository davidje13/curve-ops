import {
	type Matrix,
	type QuadraticBezier,
	bezier2LengthEstimate,
	bezier2SVG,
	matFrom,
} from '../index.mts';
import { grabbable, makeNumericInput, mk, mkSVG } from './dom.mts';
import { TaskManager } from './TaskManager.mts';

const scale = new Uint32Array(1024);
const scaleRGBA = new Uint8ClampedArray(
	scale.buffer,
	scale.byteOffset,
	scale.byteLength,
);
for (let i = 0; i < scale.length; ++i) {
	const p = i / (scale.length - 1);
	scaleRGBA[i * 4 + 0] = 255 * (1 - Math.cos(p * Math.PI * 1)) * 0.5;
	scaleRGBA[i * 4 + 1] = 255 * (1 - Math.cos(p * Math.PI * 2)) * 0.5;
	scaleRGBA[i * 4 + 2] = 255 * (1 - Math.cos(p * Math.PI * 3)) * 0.5;
	scaleRGBA[i * 4 + 3] = 255;
}

const taskManager = new TaskManager<TaskData>(
	'/dev-build/playground/quadratic-length-worker.mjs',
);

const DITHER = [
	[0x00, 0x10, 0x04, 0x14, 0x01, 0x11, 0x06, 0x16],
	[0x1e, 0x08, 0x18, 0x0c, 0x1c, 0x09, 0x19, 0x0e],
	[0x05, 0x15, 0x02, 0x12, 0x07, 0x17, 0x03, 0x13],
	[0x1b, 0x0d, 0x1d, 0x0a, 0x1a, 0x0f, 0x1f, 0x0b],
	[0x01, 0x11, 0x06, 0x16, 0x00, 0x10, 0x04, 0x14],
	[0x1c, 0x09, 0x19, 0x0e, 0x1e, 0x08, 0x18, 0x0c],
	[0x07, 0x17, 0x03, 0x13, 0x05, 0x15, 0x02, 0x12],
	[0x1a, 0x0f, 0x1f, 0x0b, 0x1b, 0x0d, 0x1d, 0x0a],
];
const DITHER_W = DITHER[0]!.length;
const DITHER_H = DITHER.length;
const DITHER_XYL: { x: number; y: number }[][] = [];
for (let y = 0; y < DITHER_H; ++y) {
	for (let x = 0; x < DITHER_W; ++x) {
		const p = DITHER[y]![x]!;
		DITHER_XYL[p] ??= [];
		DITHER_XYL[p]!.push({ x: x, y: y });
	}
}
const DITHER_XY = DITHER_XYL.flat();

function makeDitherPattern(w: number, h: number) {
	const results: DitherData[] = [];
	const yBand = DITHER_H * 8;
	for (const { x, y } of DITHER_XY) {
		for (let yy = 0; yy < h; yy += yBand) {
			if (x < w && yy + y < h) {
				results.push({
					xL: x,
					xS: DITHER_W,
					xH: w,
					yL: yy + y,
					yS: DITHER_H,
					yH: Math.min(yy + yBand, h),
				});
			}
		}
	}
	return results;
}

const views = [
	{
		name: 'Normalised Overview (0-2)',
		p0x: -1,
		p0y: 0,
		p2x: 1,
		p2y: 0,
		cx: 1,
		cy: 1,
		z: 1,
	},
	{
		name: 'Loop Overview (0-2)',
		p0x: 0,
		p0y: 0,
		p2x: 0,
		p2y: 0,
		cx: 1,
		cy: 1,
		z: 1,
	},
	{ name: '0,0', p0x: -1, p0y: 0, p2x: 1, p2y: 0, cx: 0, cy: 0, z: 0.1 },
	{
		name: '0,0 (large curve)',
		p0x: -5,
		p0y: 0,
		p2x: 5,
		p2y: 0,
		cx: 0,
		cy: 0,
		z: 0.5,
	},
	{
		name: 'Zoomed 0,0',
		p0x: -1,
		p0y: 0,
		p2x: 1,
		p2y: 0,
		cx: 0,
		cy: 0,
		z: 0.02,
	},
	{
		name: 'Super zoomed 0,0',
		p0x: -1,
		p0y: 0,
		p2x: 1,
		p2y: 0,
		cx: 0,
		cy: 0,
		z: 0.0001,
	},
	{ name: '-1,0', p0x: -1, p0y: 0, p2x: 1, p2y: 0, cx: -1, cy: 0, z: 0.02 },
	{ name: '1,0', p0x: -1, p0y: 0, p2x: 1, p2y: 0, cx: 1, cy: 0, z: 0.02 },
	{ name: '2,0', p0x: -1, p0y: 0, p2x: 1, p2y: 0, cx: 2, cy: 0, z: 0.02 },
];

function makeGraph(w: number, h: number, zoom: number) {
	const rangeMin = makeNumericInput(-15, 0, 1, -15, markDirty);
	const rangeMax = makeNumericInput(-15, 0, 1, -13, markDirty);
	const p0x = makeNumericInput(-100, 100, 'any', -1, redraw);
	const p0y = makeNumericInput(-100, 100, 'any', 0, redraw);
	const p2x = makeNumericInput(-100, 100, 'any', 1, redraw);
	const p2y = makeNumericInput(-100, 100, 'any', 0, redraw);
	const cx = makeNumericInput(-100, 100, 'any', 1, redraw);
	const cy = makeNumericInput(-100, 100, 'any', 1, redraw);
	const z = makeNumericInput(0, 100, 'any', 1, redraw);

	const errorCanvas = mk('canvas', {
		class: 'graph',
		width: w,
		height: h,
	}) as HTMLCanvasElement;
	const scaleCanvas = mk('canvas', {
		class: 'scale',
		width: 1,
		height: h,
	}) as HTMLCanvasElement;
	errorCanvas.style.width = `${w * zoom}px`;
	errorCanvas.style.height = `${h * zoom}px`;
	errorCanvas.style.imageRendering = 'pixelated';
	scaleCanvas.style.width = '10px';
	scaleCanvas.style.height = `${h * zoom}px`;
	const viewSelect = mk(
		'select',
		{},
		views.map((view, i) => mk('option', { value: i }, [view.name])),
	) as HTMLSelectElement;
	viewSelect.selectedIndex = 0;
	viewSelect.addEventListener('change', () => {
		const view = views[viewSelect.selectedIndex];
		if (!view) {
			return;
		}
		p0x.set(view.p0x);
		p0y.set(view.p0y);
		p2x.set(view.p2x);
		p2y.set(view.p2y);
		cx.set(view.cx);
		cy.set(view.cy);
		z.set(view.z);
		redraw();
	});

	const errorBuffer = new SharedArrayBuffer(
		w * h * Float64Array.BYTES_PER_ELEMENT,
	);
	const errorValues = new Float64Array(errorBuffer, 0, w * h);
	const ctx = errorCanvas.getContext('2d');
	let renderTm: number | null = null;
	function render() {
		if (renderTm) {
			clearTimeout(renderTm);
			renderTm = null;
		}
		const dat = new ImageData(w, h);
		const dat32 = new Uint32Array(dat.data.buffer, dat.data.byteOffset, w * h);
		const minLn = rangeMin.current();
		const maxLn = rangeMax.current();
		for (let i = 0; i < w * h; ++i) {
			const err = errorValues[i]!;
			if (Number.isNaN(err)) {
				dat32[i] = 0;
			} else {
				const lnErr = Math.log10(err);
				const v = (scale.length * (lnErr - minLn)) / (maxLn - minLn);
				dat32[i] = scale[Math.max(0, Math.min(scale.length - 1, v)) | 0] ?? 0;
			}
		}
		ctx?.putImageData(dat, 0, 0);
		if (taskManager.running) {
			renderTm = setTimeout(render, 100);
		}
	}
	function markDirty() {
		if (!renderTm) {
			renderTm = setTimeout(render, 0);
		}
	}
	taskManager.addEventListener('done', render);

	(() => {
		const scaleData = new ImageData(1, h);
		const scaleData32 = new Uint32Array(
			scaleData.data.buffer,
			scaleData.data.byteOffset,
			scaleData.data.byteLength / 4,
		);
		for (let i = 0; i < h; ++i) {
			scaleData32[i] =
				scale[rescale(i, h - 1, 0, 0, scale.length - 1) | 0] ?? 0;
		}
		scaleCanvas.getContext('2d')?.putImageData(scaleData, 0, 0);
	})();

	const id = Symbol();
	function redraw() {
		const curveMatrix = matFrom([
			// p0
			[p0x.current(), 0, 0],
			[p0y.current(), 0, 0],

			// c1
			[cx.current() - z.current(), z.current() * 2, 0],
			[cy.current() - z.current(), 0, z.current() * 2],

			// p2
			[p2x.current(), 0, 0],
			[p2y.current(), 0, 0],
		]);

		const config = { buffer: errorBuffer, curveMatrix, w, h };
		taskManager.clearTasks(id);
		for (const dither of makeDitherPattern(w, h)) {
			taskManager.addTask(id, { ...config, ...dither });
		}
		markDirty();
	}

	redraw();

	return mk('div', { class: 'item' }, [
		errorCanvas,
		scaleCanvas,
		mk('div', { class: 'options' }, [
			viewSelect,
			mk('br'),
			'p0: ',
			mk('label', {}, ['x ', p0x.input]),
			', ',
			mk('label', {}, ['y ', p0y.input]),
			mk('br'),
			'p2: ',
			mk('label', {}, ['x ', p2x.input]),
			', ',
			mk('label', {}, ['y ', p2y.input]),
			mk('br'),
			'center: ',
			mk('label', {}, ['x ', cx.input]),
			', ',
			mk('label', {}, ['y ', cy.input]),
			'; ',
			mk('label', {}, ['extent ', z.input]),
			mk('br'),
			'scale: 10^',
			rangeMin.input,
			' \u2013 10^',
			rangeMax.input,
		]),
	]);
}

document.body.append(
	makeGraph(
		500 * window.devicePixelRatio,
		500 * window.devicePixelRatio,
		1 / window.devicePixelRatio,
	),
);

(() => {
	const pathCtl = mkSVG('path', { class: 'ctl' });
	const pathCurve = mkSVG('path', { class: 'curve' });
	const svg = mkSVG(
		'svg',
		{
			version: '1.1',
			viewBox: '0 0 1 1',
			width: 500,
			height: 500,
		},
		[pathCtl, pathCurve],
	);
	const dc0 = mk('div', { class: 'ctl end' });
	const dc1 = mk('div', { class: 'ctl mid' });
	const dc2 = mk('div', { class: 'ctl end' });
	const out = mk('pre');

	document.body.append(
		mk('div', { class: 'item' }, [
			mk('div', { class: 'playground' }, [svg, dc0, dc1, dc2]),
			out,
		]),
	);

	function update() {
		const bezier = { p0, c1: p1, p2 };
		pathCtl.setAttribute('d', bezier2SVG(bezier, undefined, 'M', 'L'));
		pathCurve.setAttribute('d', bezier2SVG(bezier));

		const printLengthEstimate = (est: { best: number; maxError: number }) =>
			`${est.best.toFixed(16)} ±${est.maxError.toPrecision(1)}`;

		const samples = 1000;
		const begin1 = performance.now();
		for (let r = 0; r < samples; ++r) {
			bezier2LengthEstimate(bezier);
		}
		const end1 = performance.now();
		const beginT = performance.now();
		const trueLength = measureSegmented(bezier);
		const endT = performance.now();
		const estLength = bezier2LengthEstimate(bezier);
		out.innerText = [
			`True Length:      ${trueLength.toFixed(16)} (${(endT - beginT).toFixed(4)}ms)`,
			`Estimated Length: ${printLengthEstimate(
				estLength,
			)} (${((end1 - begin1) / samples).toFixed(4)}ms)`,
			`Difference:       ${Math.abs(trueLength - estLength.best).toFixed(16)} (${Math.abs(trueLength - estLength.best).toPrecision(1)})`,
		].join('\n');
	}

	const p0 = grabbable(dc0, update, { x: 0.1, y: 0.1 });
	const p1 = grabbable(dc1, update, { x: 0.9, y: 0.1 });
	const p2 = grabbable(dc2, update, { x: 0.1, y: 0.9 });
	update();
})();

function rescale(
	v: number,
	minV: number,
	maxV: number,
	minR: number,
	maxR: number,
) {
	return minR + ((v - minV) * (maxR - minR)) / (maxV - minV);
}

function measureSegmented({ p0, c1, p2 }: QuadraticBezier) {
	const x1 = (c1.x - p0.x) * 2;
	const y1 = (c1.y - p0.y) * 2;
	const x2 = p0.x - c1.x * 2 + p2.x;
	const y2 = p0.y - c1.y * 2 + p2.y;

	const steps = 0x1000000;

	const xe1 = (2 * x2) / steps;
	const ye1 = (2 * y2) / steps;
	const xe0 = x1 + 0.5 * xe1;
	const ye0 = y1 + 0.5 * ye1;
	let sum = 0;
	for (let i = 0; i < steps; ++i) {
		sum += Math.hypot(xe0 + xe1 * i, ye0 + ye1 * i);
	}
	return sum / steps;
}

interface DitherData {
	xL: number;
	xS: number;
	xH: number;
	yL: number;
	yS: number;
	yH: number;
}

interface TaskData extends DitherData {
	buffer: SharedArrayBuffer;
	curveMatrix: Matrix<6, 3>;
	w: number;
	h: number;
}
