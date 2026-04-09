import { PT000, pt3Mid, type Point3D } from './Point3D.mts';

export interface AxisAlignedBox3D {
	readonly l: Point3D;
	readonly h: Point3D;
}

export const aaBox3FromXYZ = (
	x: readonly number[],
	y: readonly number[],
	z: readonly number[],
): AxisAlignedBox3D => ({
	l: { x: Math.min(...x), y: Math.min(...y), z: Math.min(...z) },
	h: { x: Math.max(...x), y: Math.max(...y), z: Math.max(...z) },
});

export const aaBox3Grow = ({ l, h }: AxisAlignedBox3D, grow: number) => ({
	l: { x: l.x - grow, y: l.y - grow },
	h: { x: h.x + grow, y: h.y + grow },
});

export const aaBox3Midpoint = ({ l, h }: AxisAlignedBox3D) => pt3Mid(l, h);

export const aaBox3Volume = ({ l, h }: AxisAlignedBox3D) =>
	(h.x - l.x) * (h.y - l.y) * (h.z - l.z);

export const aaBox3Contains = (
	{ l, h }: AxisAlignedBox3D,
	{ x, y, z }: Point3D,
) => x >= l.x && x <= h.x && y >= l.y && y <= h.y && z >= l.z && z <= h.z;

export const AABOX000: {
	readonly l: { readonly x: 0; readonly y: 0; readonly z: 0 };
	readonly h: { readonly x: 0; readonly y: 0; readonly z: 0 };
} = { l: PT000, h: PT000 };
