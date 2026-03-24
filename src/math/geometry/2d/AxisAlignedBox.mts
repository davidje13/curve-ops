import { PT0, ptMid, ptSVG, type Pt } from './Pt.mts';

export interface AxisAlignedBox {
	readonly l: Pt;
	readonly h: Pt;
}

export function aaBoxFromXY(
	x: readonly number[],
	y: readonly number[],
): AxisAlignedBox {
	const minX = Math.min(...x);
	const maxX = Math.max(...x);
	const minY = Math.min(...y);
	const maxY = Math.max(...y);
	return { l: { x: minX, y: minY }, h: { x: maxX, y: maxY } };
}

export const aaBoxGrow = ({ l, h }: AxisAlignedBox, grow: number) => ({
	l: { x: l.x - grow, y: l.y - grow },
	h: { x: h.x + grow, y: h.y + grow },
});

export const aaBoxMidpoint = ({ l, h }: AxisAlignedBox) => ptMid(l, h);

export const aaBoxArea = ({ l, h }: AxisAlignedBox) =>
	(h.x - l.x) * (h.y - l.y);

export const aaBoxContains = ({ l, h }: AxisAlignedBox, { x, y }: Pt) =>
	x >= l.x && x <= h.x && y >= l.y && y <= h.y;

export const aaBoxSVG = (
	{ l, h }: AxisAlignedBox,
	precision?: number | undefined,
) => `M${ptSVG(l, precision)}H${h.x}V${h.y}H${l.x}Z`;

export const AABOX0: {
	readonly l: { readonly x: 0; readonly y: 0 };
	readonly h: { readonly x: 0; readonly y: 0 };
} = { l: PT0, h: PT0 };
