import {
	ptAdd,
	ptDist,
	ptLen,
	ptLen2,
	ptLerp,
	ptMid,
	ptMul,
	ptNorm,
	ptRot90,
	ptSub,
	ptSVG,
	ptTransform,
	type Pt,
} from './Pt.mts';

export interface Line {
	readonly p0: Pt;
	readonly p1: Pt;
}

export const lineFromPts = (p0: Pt, p1: Pt): Line => ({ p0, p1 });

export const lineAt = ({ p0, p1 }: Line, t: number) => ptLerp(p0, p1, t);

export const lineDerivative = ({ p0, p1 }: Line) => ptSub(p1, p0);

export const lineMidpoint = ({ p0, p1 }: Line) => ptMid(p0, p1);

export const lineNormal = ({ p0, p1 }: Line) => ptNorm(ptRot90(ptSub(p1, p0)));

export const lineTranslate = ({ p0, p1 }: Line, shift: Pt): Line => ({
	p0: ptAdd(p0, shift),
	p1: ptAdd(p1, shift),
});

export const lineLength = ({ p0, p1 }: Line) => ptDist(p1, p0);

export function internalLineScaledNormalisation({ p0, p1 }: Line) {
	const d = ptSub(p1, p0);
	const scale2 = ptLen2(d);
	if (!scale2) {
		return null;
	}
	const s = ptMul(d, 1 / scale2);
	const fn = ptTransform(
		s.x,
		s.y,
		-p0.x * s.x - p0.y * s.y,
		-s.y,
		s.x,
		p0.x * s.y - p0.y * s.x,
	);
	return { scale2, fn };
}

export function internalLineUnscaledNormalisation({ p0, p1 }: Line) {
	const d = ptSub(p1, p0);
	const l = ptLen(d);
	if (!l) {
		return { l: 0, fn: (pt: Pt) => ptSub(pt, p0) };
	}
	const s = ptMul(d, 1 / l);
	const fn = ptTransform(
		s.x,
		s.y,
		-p0.x * s.x - p0.y * s.y,
		-s.y,
		s.x,
		p0.x * s.y - p0.y * s.x,
	);
	return { l, fn };
}

export const lineSVG = (
	{ p0, p1 }: Line,
	precision?: number | undefined,
	prefix = 'M',
	mode = 'L',
) => `${prefix}${ptSVG(p0, precision)}${mode}${ptSVG(p1, precision)}`;
