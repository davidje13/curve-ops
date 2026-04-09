import { vecAddScalar, vecMid, type Vector } from '../Vector.mts';

export interface AxisAlignedBox<Dim extends number> {
	readonly l: Vector<Dim>;
	readonly h: Vector<Dim>;
}

export const aaBoxGrow = <Dim extends number>(
	{ l, h }: AxisAlignedBox<Dim>,
	grow: number,
) => ({
	l: vecAddScalar(l, -grow),
	h: vecAddScalar(h, grow),
});

export const aaBoxMidpoint = <Dim extends number>({
	l,
	h,
}: AxisAlignedBox<Dim>) => vecMid(l, h);

export function aaBoxContains<Dim extends number>(
	{ l, h }: AxisAlignedBox<Dim>,
	pt: Vector<Dim>,
) {
	for (let d = 0; d < pt.n; ++d) {
		// inverted logic to avoid saying NaN is contained
		if (!(pt.v[d]! >= l.v[d]! && pt.v[d]! <= h.v[d]!)) {
			return false;
		}
	}
	return true;
}
