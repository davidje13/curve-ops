import type { Sign } from '../../../types/numeric.mts';
import type { Ball } from '../Ball.mts';
import type { AxisAlignedBox3D } from './AxisAlignedBox3D.mts';
import { line3At, line3TNearestPt3, type Line3D } from './Line3D.mts';
import { pt3Dist2, pt3FromVec, vecFromPt3, type Point3D } from './Point3D.mts';

export interface Sphere {
	readonly c: Point3D;
	readonly r: number;
}

export const sphereFromBall = ({ c, r }: Ball<3>): Sphere => ({
	c: pt3FromVec(c),
	r,
});

export const ballFromSphere = ({ c, r }: Sphere): Ball<3> => ({
	c: vecFromPt3(c),
	r,
});

export const sphereBounds = ({ c, r }: Sphere): AxisAlignedBox3D => ({
	l: { x: c.x - r, y: c.y - r, z: c.z - r },
	h: { x: c.x + r, y: c.y + r, z: c.z + r },
});

export const sphereVolume = ({ r }: Sphere) => (4 / 3) * Math.PI * r * r * r;
export const sphereArea = ({ r }: Sphere) => 4 * Math.PI * r * r;

export const sphereContains = ({ c, r }: Sphere, pt: Point3D) =>
	pt3Dist2(c, pt) < r * r;

export function intersectLine3Sphere(
	line: Line3D,
	{ c, r }: Sphere,
): { t1: number; d1: Sign }[] {
	const t = line3TNearestPt3(line, c);
	const s = r * r - pt3Dist2(c, line3At(line, t));
	if (s < 0) {
		return [];
	}
	if (!s) {
		return [{ t1: t, d1: 0 }];
	}
	const dt = Math.sqrt(s / pt3Dist2(line.p0, line.p1));
	return [
		{ t1: t - dt, d1: -1 },
		{ t1: t + dt, d1: 1 },
	];
}

export const intersectLineSeg3Sphere = (line: Line3D, sphere: Sphere) =>
	intersectLine3Sphere(line, sphere).filter(({ t1 }) => t1 >= 0 && t1 <= 1);
