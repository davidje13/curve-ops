import type { Pt } from './Pt.mts';

export type Polygon = readonly Pt[];

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

export function polygonContains(shape: Polygon, { x, y }: Pt) {
	let winding2 = 0;
	let prev = shape[shape.length - 1]!;
	for (const pt of shape) {
		const dy = pt.y - prev.y;
		if ((prev.y >= y || pt.y >= y) && (prev.y <= y || pt.y <= y) && dy) {
			const t = (prev.x - x) * dy - (prev.y - y) * (pt.x - prev.x);
			if (t && dy > 0 === t > 0) {
				if (prev.y === y || pt.y === y) {
					winding2 -= Math.sign(dy);
				} else {
					winding2 -= Math.sign(dy) * 2;
				}
			}
		}
		prev = pt;
	}
	return winding2 !== 0;
}
