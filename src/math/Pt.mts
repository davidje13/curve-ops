export interface Pt {
	readonly x: number;
	readonly y: number;
	z?: never;
}

export interface PtWithDist extends Pt {
	readonly d: number;
}

export function ptPolyline(points: Pt[]): PtWithDist[] {
	if (!points.length) {
		return [];
	}
	let distance = 0;
	let prev = points[0]!;
	const r: PtWithDist[] = [{ ...prev, d: 0 }];
	for (let i = 1; i < points.length; ++i) {
		const pt = points[i]!;
		distance += ptDist(prev, pt);
		r.push({ ...pt, d: distance });
		prev = pt;
	}
	return r;
}

export const PT0: { readonly x: 0; readonly y: 0 } = { x: 0, y: 0 };

export const ptDot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
export const ptCross = (a: Pt, b: Pt) => a.x * b.y - a.y * b.x;

export const ptLen2 = ({ x, y }: Pt) => x * x + y * y;
export const ptLen = ({ x, y }: Pt) => Math.hypot(x, y);

export const ptDist2 = (a: Pt, b: Pt) =>
	(a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
export const ptDist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export const ptNorm = (pt: Pt) => ptMul(pt, 1 / ptLen(pt));
export const ptRot90 = ({ x, y }: Pt) => ({ x: -y, y: x });

export const ptAdd = (a: Pt, b: Pt) => ({
	x: a.x + b.x,
	y: a.y + b.y,
});
export const ptMul = (pt: Pt, m: number) => ({
	x: pt.x * m,
	y: pt.y * m,
});
export const ptMad = (a: Pt, m: number, b: Pt) => ({
	x: a.x * m + b.x,
	y: a.y * m + b.y,
});
export const ptSub = (a: Pt, b: Pt) => ({
	x: a.x - b.x,
	y: a.y - b.y,
});

export const ptLerp = (a: Pt, b: Pt, t: number) => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
});

export const ptMid = (a: Pt, b: Pt) => ({
	x: (a.x + b.x) * 0.5,
	y: (a.y + b.y) * 0.5,
});

export const ptTransform =
	(
		mxx: number,
		mxy: number,
		dx: number,
		myx: number,
		myy: number,
		dy: number,
	) =>
	(pt: Pt) => ({
		x: pt.x * mxx + pt.y * mxy + dx,
		y: pt.x * myx + pt.y * myy + dy,
	});

export const ptSVG = (pt: Pt, precision = 6) =>
	`${pt.x.toFixed(precision)} ${pt.y.toFixed(precision)}`;
