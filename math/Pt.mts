export interface Pt {
	readonly x: number;
	readonly y: number;
}

export interface PtWithDist extends Pt {
	readonly d: number;
}

/*@__PURE__*/ export function ptPolyline(points: Pt[]): PtWithDist[] {
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

export const ptDot = /*@__PURE__*/ (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
export const ptCross = /*@__PURE__*/ (a: Pt, b: Pt) => a.x * b.y - a.y * b.x;

export const ptLen2 = /*@__PURE__*/ ({ x, y }: Pt) => x * x + y * y;
export const ptLen = /*@__PURE__*/ ({ x, y }: Pt) => Math.hypot(x, y);

export const ptDist2 = /*@__PURE__*/ (a: Pt, b: Pt) =>
	(a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
export const ptDist = /*@__PURE__*/ (a: Pt, b: Pt) =>
	Math.hypot(a.x - b.x, a.y - b.y);

export const ptNorm = /*@__PURE__*/ (pt: Pt) => ptMul(pt, 1 / ptLen(pt));
export const ptRot90 = /*@__PURE__*/ ({ x, y }: Pt) => ({ x: -y, y: x });

export const ptAdd = /*@__PURE__*/ (a: Pt, b: Pt) => ({
	x: a.x + b.x,
	y: a.y + b.y,
});
export const ptMul = /*@__PURE__*/ (pt: Pt, m: number) => ({
	x: pt.x * m,
	y: pt.y * m,
});
export const ptMad = /*@__PURE__*/ (a: Pt, m: number, b: Pt) => ({
	x: a.x * m + b.x,
	y: a.y * m + b.y,
});
export const ptSub = /*@__PURE__*/ (a: Pt, b: Pt) => ({
	x: a.x - b.x,
	y: a.y - b.y,
});

export const ptLerp = /*@__PURE__*/ (a: Pt, b: Pt, t: number) => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
});

export const ptMid = /*@__PURE__*/ (a: Pt, b: Pt) => ({
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
