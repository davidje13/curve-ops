import {
	addZR,
	divRZ,
	divZ,
	expZ,
	mulZ,
	mulZR,
	subRZ,
	subZ,
	type ComplexNumber,
} from './complex.mts';

const rpi_2 = 1.2533141373155001; // sqrt(pi / 2)
const r2_pi = 0.7978845608028654; // sqrt(2 / pi)
const r4_pi = 1.1283791670955126; // sqrt(4 / pi)

export function erf(x: number) {
	const s = Math.sign(x);
	x = Math.abs(x);

	// thanks, https://en.wikipedia.org/wiki/Error_function#Approximation_with_elementary_functions

	const t = 1 / (1 + x * (ERR_P1 + x * ERR_P2));
	let tN = t;
	let sum = 0;
	for (const a of ERR_A) {
		sum += tN * a;
		tN *= t;
	}
	return s * (1 - sum * Math.exp(-x * x));
}

export const erfZ = (z: ComplexNumber): ComplexNumber => subRZ(1, erfcZ(z));

export function erfc(x: number): number {
	if (x < 2) {
		return 1 - erf(x);
	}
	if (!Number.isFinite(x)) {
		return 0;
	}
	const xx = x * x;
	const xx2 = xx * 2;
	//let v = 0;
	//for (let n = 7; n-- > 1; ) {
	//	v = (n * 2 * (n * 2 - 1)) / (xx2 + n * 4 + 1 - v);
	//}
	let v = 182 / (xx2 + 29);
	v = 132 / (xx2 + 25 - v);
	v = 90 / (xx2 + 21 - v);
	v = 56 / (xx2 + 17 - v);
	v = 30 / (xx2 + 13 - v);
	v = 12 / (xx2 + 9 - v);
	v = 2 / (xx2 + 5 - v);
	return (r4_pi * x) / ((xx2 + 1 - v) * Math.exp(xx)) + (1 - Math.sign(x));
}

export function erfcZ(z: ComplexNumber): ComplexNumber {
	const zz = mulZ(z, z);
	const zz2 = mulZR(zz, 2);
	let v = divRZ(182, addZR(zz2, 29));
	v = divRZ(132, subZ(addZR(zz2, 25), v));
	v = divRZ(90, subZ(addZR(zz2, 21), v));
	v = divRZ(56, subZ(addZR(zz2, 17), v));
	v = divRZ(30, subZ(addZR(zz2, 13), v));
	v = divRZ(12, subZ(addZR(zz2, 9), v));
	v = divRZ(2, subZ(addZR(zz2, 5), v));
	return addZR(
		divZ(
			mulZR(z, z[0] < 0 ? -r4_pi : r4_pi),
			mulZ(subZ(addZR(zz2, 1), v), expZ(zz)),
		),
		1 - Math.sign(z[0]),
	);
}

const ERR_A = [
	0.316879890481381, -0.138329314150635, 1.08680830347054, -1.11694155120396,
	1.20644903073232, -0.393127715207728, 0.0382613542530727,
];
const ERR_P1 = 0.406742016006509;
const ERR_P2 = 0.0072279182302319;

export function unscaledFresnelSIntegral(x: number): number {
	const s = Math.sign(x);
	x = Math.abs(x);

	if (x < 1.5 * rpi_2) {
		// thanks, https://en.wikipedia.org/wiki/Fresnel_integral#Definition
		const xx = x * x;
		const xxxx = xx * xx;
		let xN = xx * x;
		let sum = xN / 3;
		for (let n = 1; n < 8; ++n) {
			xN *= -xxxx / (2 * n * (2 * n + 1));
			sum += xN / (4 * n + 3);
		}
		return s * sum;
	} else {
		// thanks, https://iate.oac.uncor.edu/~mario/materia/nr/numrec/f6-9.pdf
		return (
			s *
			rpi_2 *
			mulZ([0.5, 0.5], erfZ([Math.SQRT1_2 * x, -Math.SQRT1_2 * x]))[1]
		);
	}
}

export function unscaledFresnelCIntegral(x: number): number {
	const s = Math.sign(x);
	x = Math.abs(x);

	if (x < 1.5 * rpi_2) {
		// thanks, https://en.wikipedia.org/wiki/Fresnel_integral#Definition
		const xx = x * x;
		const xxxx = xx * xx;
		let xN = x;
		let sum = x;
		for (let n = 1; n < 8; ++n) {
			xN *= -xxxx / (2 * n * (2 * n - 1));
			sum += xN / (4 * n + 1);
		}
		return s * sum;
	} else {
		// thanks, https://iate.oac.uncor.edu/~mario/materia/nr/numrec/f6-9.pdf
		return (
			s *
			rpi_2 *
			mulZ([0.5, 0.5], erfZ([Math.SQRT1_2 * x, -Math.SQRT1_2 * x]))[0]
		);
	}
}

export const fresnelSIntegral = (x: number) =>
	unscaledFresnelSIntegral(x * rpi_2) * r2_pi;

export const fresnelCIntegral = (x: number) =>
	unscaledFresnelCIntegral(x * rpi_2) * r2_pi;
