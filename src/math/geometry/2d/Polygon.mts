import type { Pt } from './Pt.mts';

export type Polygon = Pt[];

export function polygonSignedArea(shape: Polygon): number {
	// Thanks, https://stackoverflow.com/a/1165943/1180785
	if (shape.length <= 1) {
		return 0;
	}

	let sum = 0;
	let prev = shape[0]!;
	for (let i = 1; i < shape.length; ++i) {
		const cur = shape[i]!;
		sum += (cur.x - prev.x) * (cur.y + prev.y);
		prev = cur;
	}
	const cur = shape[0]!;
	sum += (cur.x - prev.x) * (cur.y + prev.y);
	return sum * 0.5;
}
