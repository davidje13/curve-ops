import {
	bezier2At,
	bezier3At,
	bezier3SVG,
	bezierAt,
	bezierFromVecs,
	CurveDrawer,
	fresnelCIntegral,
	fresnelSIntegral,
	polyline2DSVG,
	ptFromVec,
	vecFrom,
	type Pt,
} from '../../index.mts';
import {
	makeInteractive,
	makeNumericInput,
	makeSelect,
	mk,
	mkSVG,
} from '../dom.mts';

const pointsOptions: { name: string; points: Pt[] }[] = [
	{
		name: 'circle',
		points: ptFn((t) => ({
			x: Math.sin(t * Math.PI * 2) * 0.4 + 0.5,
			y: Math.cos(t * Math.PI * 2) * 0.4 + 0.5,
		})),
	},
	{
		name: 'square',
		points: ptFn((t) =>
			t < 0.25
				? { x: 0.1 + t * 4 * 0.8, y: 0.1 }
				: t < 0.5
					? { x: 0.9, y: 0.1 + (t * 4 - 1) * 0.8 }
					: t < 0.75
						? { x: 0.9 - (t * 4 - 2) * 0.8, y: 0.9 }
						: { x: 0.1, y: 0.9 - (t * 4 - 3) * 0.8 },
		),
	},
	{
		name: 'euler spiral',
		points: ptFn((t) => ({
			x: fresnelSIntegral(t * 5),
			y: fresnelCIntegral(t * 5),
		})),
	},
	{
		name: 'sine',
		points: ptFn((t) => ({
			x: t * 0.8 + 0.1,
			y: Math.sin(t * Math.PI * 6) * 0.4 + 0.5,
		})),
	},
	{
		name: 'horizontal line',
		points: ptFn((t) => ({
			x: t * 0.8 + 0.1,
			y: 0.5,
		})),
	},
	{
		name: 'obtuse corner',
		points: ptFn((t) =>
			t > 0.5
				? { x: 0.5 + (2 * t - 1) * 0.4, y: 0.5 }
				: {
						x: 0.5 - (1 - 2 * t) * 0.4 * Math.SQRT1_2,
						y: 0.5 - (1 - 2 * t) * 0.4 * Math.SQRT1_2,
					},
		),
	},
	{
		name: '90deg corner',
		points: ptFn((t) =>
			t > 0.5
				? { x: 0.5 + (2 * t - 1) * 0.4, y: 0.5 }
				: { x: 0.5, y: 0.5 - (1 - 2 * t) * 0.4 },
		),
	},
	{
		name: 'smooth corner',
		points: ptFn((t) => {
			const r = 0.03;
			const le = 0.4 - r;
			const lc = 0.5 * Math.PI * r;
			const p = t * (lc + le * 2);
			if (p < le) {
				return { x: 0.5, y: 0.5 - r - le + p };
			} else if (p < le + lc) {
				const a = (Math.PI * 0.5 * (p - le)) / lc;
				return {
					x: 0.5 + r * (1 - Math.cos(a)),
					y: 0.5 - r * (1 - Math.sin(a)),
				};
			} else {
				return { x: 0.5 + r + p - le - lc, y: 0.5 };
			}
		}),
	},
	{
		name: 'accute corner',
		points: ptFn((t) =>
			t > 0.5
				? { x: 0.5 + (2 * t - 1) * 0.4, y: 0.5 }
				: {
						x: 0.5 + (1 - 2 * t) * 0.4 * Math.SQRT1_2,
						y: 0.5 - (1 - 2 * t) * 0.4 * Math.SQRT1_2,
					},
		),
	},
	{
		name: 'zigzag',
		points: ptFn((t) => ({
			x: t * 0.8 + 0.1,
			y: Math.abs(((t * 10) % 2) - 1) * 0.2 + 0.4,
		})),
	},
	{
		name: 'sharp zigzag',
		points: ptFn((t) => ({
			x: t * 0.8 + 0.1,
			y: Math.abs(((t * 50) % 2) - 1) * 0.8 + 0.1,
		})),
	},
	{
		name: 'quadratic bezier',
		points: ptFn(
			bezier2At.bind(null, {
				p0: { x: 0.1, y: 0.1 },
				c1: { x: 0.5, y: 0.9 },
				p2: { x: 0.9, y: 0.1 },
			}),
		),
	},
	{
		name: 'cubic bezier s',
		points: ptFn(
			bezier3At.bind(null, {
				p0: { x: 0.9, y: 0.1 },
				c1: { x: 0.1, y: 0.1 },
				c2: { x: 0.9, y: 0.9 },
				p3: { x: 0.1, y: 0.9 },
			}),
		),
	},
	{
		name: 'cubic bezier u',
		points: ptFn(
			bezier3At.bind(null, {
				p0: { x: 0.1, y: 0.1 },
				c1: { x: 0.1, y: 0.9 },
				c2: { x: 0.9, y: 0.9 },
				p3: { x: 0.9, y: 0.1 },
			}),
		),
	},
	{
		name: 'cubic bezier v',
		points: ptFn(
			bezier3At.bind(null, {
				p0: { x: 0.1, y: 0.1 },
				c1: { x: 0.9, y: 0.9 },
				c2: { x: 0.1, y: 0.9 },
				p3: { x: 0.9, y: 0.1 },
			}),
		),
	},
	{
		name: 'cubic bezier \u03B3',
		points: ptFn(
			bezier3At.bind(null, {
				p0: { x: 0.3, y: 0.1 },
				c1: { x: 0.9, y: 0.9 },
				c2: { x: 0.1, y: 0.9 },
				p3: { x: 0.7, y: 0.1 },
			}),
		),
	},
	{
		name: 'O(5) bezier',
		points: ptFn(
			(() => {
				const curve = bezierFromVecs([
					vecFrom(0.1, 0.1),
					vecFrom(0.9, 0.1),
					vecFrom(0.9, 0.5),
					vecFrom(0.1, 0.5),
					vecFrom(0.1, 0.9),
					vecFrom(0.9, 0.9),
				]);
				return (t) => ptFromVec(bezierAt(curve, t));
			})(),
		),
	},
];

function ptFn(fn: (t: number) => Pt, n = 100000): Pt[] {
	const r: Pt[] = [];
	for (let i = 0; i < n; ++i) {
		r.push(fn(i / n));
	}
	return r;
}

document.body.append(
	makeInteractive(({ addSVGElement, addDragHandler }) => {
		const hold = addSVGElement(mkSVG('g'));
		const pathLive = mkSVG('path', { class: 'live' });

		const drawer = new CurveDrawer(
			() => hold.replaceChildren(pathLive),
			(seg, n) =>
				hold.append(mkSVG('path', { class: `done n${n}`, d: bezier3SVG(seg) })),
			(live) => pathLive.setAttribute('d', bezier3SVG(live)),
			() => {
				pathLive.setAttribute('d', '');
			},
			() => hold.replaceChildren(),
			0.005,
			50,
			0.0005,
			0.0008,
		);
		addDragHandler(drawer.begin, drawer.draw, drawer.cancel);
	}),

	makeInteractive(
		({ addElement, addSVGElement, addSVGPath, addUpdateFn, update }) => {
			const guide = addSVGPath('ctl');
			const hold = addSVGElement(mkSVG('g'));

			const minStep = makeNumericInput(0, 1, 'any', 0.005, update);
			const maxN = makeNumericInput(2, 1000, 1, 100, update);
			const minError = makeNumericInput(0, 1, 'any', 0.0002, update);
			const maxError = makeNumericInput(0, 1, 'any', 0.0003, update);
			const pointsSelect = makeSelect(pointsOptions, 0, update);
			addElement(
				mk('div', {}, [
					pointsSelect.input,
					mk('br'),
					mk('label', {}, ['min step ', minStep.input]),
					mk('br'),
					mk('label', {}, ['max points ', maxN.input]),
					mk('br'),
					mk('label', {}, ['min error ', minError.input]),
					mk('br'),
					mk('label', {}, ['max error ', maxError.input]),
				]),
			);

			addUpdateFn(() => {
				const points = pointsSelect.current().points;
				const drawer = new CurveDrawer(
					() => hold.replaceChildren(),
					(seg, n) =>
						hold.append(
							mkSVG('path', { class: `done n${n}`, d: bezier3SVG(seg) }),
						),
					() => {},
					() => {},
					() => {},
					minStep.current(),
					maxN.current(),
					minError.current(),
					maxError.current(),
				);
				guide.setAttribute('d', polyline2DSVG(points));
				drawer.begin(points[0]!);
				for (let i = 1; i < points.length - 1; ++i) {
					drawer.draw(points[i]!);
				}
				drawer.draw(points[points.length - 1]!, true);
			});
		},
	),
);
