import { aaBoxMidpoint, type AxisAlignedBox } from './AxisAlignedBox.mts';
import {
	lineDerivative,
	lineMidpoint,
	type LineSegment,
} from './LineSegment.mts';
import {
	ptAdd,
	ptCross,
	ptDot,
	ptLen,
	ptLen2,
	ptSub,
	ptSVG,
	type Pt,
} from './Pt.mts';

export interface Rectangle {
	readonly c: Pt; // center
	readonly d: Pt; // direction and magnitude of "height" (half above, half below center)
	readonly aspect: number; // width/height
}

export function rectFromLine(line: LineSegment, width: number): Rectangle {
	const d = lineDerivative(line);
	return { c: lineMidpoint(line), d, aspect: width / ptLen(d) };
}

export const rectFromAABox = (box: AxisAlignedBox): Rectangle => ({
	c: aaBoxMidpoint(box),
	d: { x: 0, y: box.h.y - box.l.y },
	aspect: (box.h.x - box.l.x) / (box.h.y - box.l.y),
});

export const rectArea = ({ d, aspect }: Rectangle) => ptLen2(d) * aspect;

export function rectBounds({ c, d, aspect }: Rectangle): AxisAlignedBox {
	const dx = Math.abs(d.x);
	const dy = Math.abs(d.y);
	const hw = (dx + dy * aspect) * 0.5;
	const hh = (dy + dx * aspect) * 0.5;
	return {
		l: { x: c.x - hw, y: c.y - hh },
		h: { x: c.x + hw, y: c.y + hh },
	};
}

export function rectContains({ c, d, aspect }: Rectangle, pt: Pt) {
	const l = ptSub(pt, c);
	const dd = ptLen2(d) * 0.5;
	return Math.abs(ptDot(l, d)) <= dd && Math.abs(ptCross(l, d)) <= dd * aspect;
}

export function rectSVG(
	{ c, d, aspect }: Rectangle,
	precision?: number | undefined,
) {
	const d1 = { x: (d.x - d.y * aspect) * 0.5, y: (d.y + d.x * aspect) * 0.5 };
	const d2 = { x: (d.x + d.y * aspect) * 0.5, y: (d.y - d.x * aspect) * 0.5 };
	return `M${ptSVG(ptAdd(c, d1), precision)}L${ptSVG(
		ptAdd(c, d2),
		precision,
	)} ${ptSVG(ptSub(c, d1), precision)} ${ptSVG(ptSub(c, d2), precision)}Z`;
}
