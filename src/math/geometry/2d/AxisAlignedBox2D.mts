import { PT00, ptMid, ptSVG, type Point2D } from './Point2D.mts';

export interface AxisAlignedBox2D {
	readonly l: Point2D;
	readonly h: Point2D;
}

export const aaBox2FromXY = (
	x: readonly number[],
	y: readonly number[],
): AxisAlignedBox2D => ({
	l: { x: Math.min(...x), y: Math.min(...y) },
	h: { x: Math.max(...x), y: Math.max(...y) },
});

export const aaBox2Grow = ({ l, h }: AxisAlignedBox2D, grow: number) => ({
	l: { x: l.x - grow, y: l.y - grow },
	h: { x: h.x + grow, y: h.y + grow },
});

export const aaBox2Midpoint = ({ l, h }: AxisAlignedBox2D) => ptMid(l, h);

export const aaBox2Area = ({ l, h }: AxisAlignedBox2D) =>
	(h.x - l.x) * (h.y - l.y);

export const aaBox2Contains = ({ l, h }: AxisAlignedBox2D, { x, y }: Point2D) =>
	x >= l.x && x <= h.x && y >= l.y && y <= h.y;

export const aaBox2SVG = (
	{ l, h }: AxisAlignedBox2D,
	precision?: number | undefined,
) => `M${ptSVG(l, precision)}H${h.x}V${h.y}H${l.x}Z`;

export const AABOX00: {
	readonly l: { readonly x: 0; readonly y: 0 };
	readonly h: { readonly x: 0; readonly y: 0 };
} = { l: PT00, h: PT00 };
