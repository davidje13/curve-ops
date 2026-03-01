import { aaBoxMidpoint, type AxisAlignedBox } from './AxisAlignedBox.mts';
import { lineDerivative, lineMidpoint, type Line } from './Line.mts';
import { ptAdd, ptLen, ptLen2, ptSub, ptSVG, type Pt } from './Pt.mts';

export interface Rectangle {
	readonly c: Pt; // center
	readonly d: Pt; // direction and magnitude of "height" (half above, half below center)
	readonly aspect: number; // width/height
}

/*@__PURE__*/ export function rectFromLine(
	line: Line,
	width: number,
): Rectangle {
	const d = lineDerivative(line);
	return { c: lineMidpoint(line), d, aspect: width / ptLen(d) };
}

export const rectFromAABox = /*@__PURE__*/ (
	box: AxisAlignedBox,
): Rectangle => ({
	c: aaBoxMidpoint(box),
	d: { x: 0, y: box.h.y - box.l.y },
	aspect: (box.h.x - box.l.x) / (box.h.y - box.l.y),
});

export const rectArea = /*@__PURE__*/ ({ d, aspect }: Rectangle) =>
	ptLen2(d) * aspect;

/*@__PURE__*/ export function rectBounds({
	c,
	d,
	aspect,
}: Rectangle): AxisAlignedBox {
	const dx = Math.abs(d.x);
	const dy = Math.abs(d.y);
	const hw = (dx + dy * aspect) * 0.5;
	const hh = (dy + dy * aspect) * 0.5;
	return {
		l: { x: c.x - hw, y: c.y - hh },
		h: { x: c.x + hw, y: c.y + hh },
	};
}

/*@__PURE__*/ export function rectSVG(
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
