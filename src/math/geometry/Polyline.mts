import { vecDist, type Vector } from '../Vector.mts';

export interface VectorWithDist<Dim extends number> extends Vector<Dim> {
	readonly d: number;
}

export type Polyline<Dim extends number> = readonly VectorWithDist<Dim>[];

export function polylineFromVecs<Dim extends number>(
	vecs: readonly Vector<Dim>[],
): Polyline<Dim> {
	if (!vecs.length) {
		return [];
	}
	let distance = 0;
	let prev = vecs[0]!;
	const r: VectorWithDist<Dim>[] = [{ ...prev, d: 0 }];
	for (let i = 1; i < vecs.length; ++i) {
		const pt = vecs[i]!;
		distance += vecDist(prev, pt);
		r.push({ ...pt, d: distance });
		prev = pt;
	}
	return r;
}
