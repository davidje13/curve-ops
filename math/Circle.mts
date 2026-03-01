import type { AxisAlignedBox } from './AxisAlignedBox.mts';
import { ptSVG, type Pt } from './Pt.mts';

export interface Circle {
	readonly c: Pt;
	readonly r: number;
}

export const circleArea = /*@__PURE__*/ ({ r }: Circle) => Math.PI * r * r;
export const circleCircumference = /*@__PURE__*/ ({ r }: Circle) =>
	2 * Math.PI * r;

export const circleBounds = /*@__PURE__*/ ({
	c,
	r,
}: Circle): AxisAlignedBox => ({
	l: { x: c.x - r, y: c.y - r },
	h: { x: c.x + r, y: c.y + r },
});

export const circleSVG = /*@__PURE__*/ (
	{ c, r }: Circle,
	precision?: number | undefined,
) =>
	`M${ptSVG({ x: c.x, y: c.y - r }, precision)}a${r} ${r} 0 0 0 0 ${
		r * 2
	}a${r} ${r} 0 0 0 0 ${-r * 2}Z`;
