import { ptMid, ptSVG, type Pt } from './Pt.mts';

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

export const aaBoxMidpoint = ({ l, h }: AxisAlignedBox) => ptMid(l, h);

export const aaBoxArea = ({ l, h }: AxisAlignedBox) =>
	(h.x - l.x) * (h.y - l.y);

export const aaBoxSVG = (
	{ l, h }: AxisAlignedBox,
	precision?: number | undefined,
) => `M${ptSVG(l, precision)}H${h.x}V${h.y}H${l.x}Z`;
