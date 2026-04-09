import {
	bezier2At,
	bezier3At,
	bezierAt,
	bezierFromVecs,
	fresnelCIntegral,
	fresnelSIntegral,
	ptFromVec,
	vecFrom,
	type Point2D,
} from '../../index.mts';

export const pointsOptions: { name: string; points: Point2D[] }[] = [
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

function ptFn(fn: (t: number) => Point2D, n = 100000): Point2D[] {
	const r: Point2D[] = [];
	for (let i = 0; i < n; ++i) {
		r.push(fn(i / n));
	}
	return r;
}
