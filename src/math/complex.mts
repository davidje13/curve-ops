export type ComplexNumber = readonly [number, number];

export const addZ = (
	[a, ai]: ComplexNumber,
	[b, bi]: ComplexNumber,
): ComplexNumber => [a + b, ai + bi];

export const addZR = ([a, ai]: ComplexNumber, b: number): ComplexNumber => [
	a + b,
	ai,
];

export const subZ = (
	[a, ai]: ComplexNumber,
	[b, bi]: ComplexNumber,
): ComplexNumber => [a - b, ai - bi];

export const subRZ = (a: number, [b, bi]: ComplexNumber): ComplexNumber => [
	a - b,
	-bi,
];

export const negZ = ([a, ai]: ComplexNumber): ComplexNumber => [-a, -ai];

export const mulZ = (
	[a, ai]: ComplexNumber,
	[b, bi]: ComplexNumber,
): ComplexNumber => [a * b - ai * bi, a * bi + b * ai];

export const mulZR = ([a, ai]: ComplexNumber, b: number): ComplexNumber => [
	a * b,
	ai * b,
];

export function divZ(
	[a, ai]: ComplexNumber,
	[b, bi]: ComplexNumber,
): ComplexNumber {
	const d = b * b + bi * bi;
	return [(a * b + ai * bi) / d, (ai * b - a * bi) / d];
}

export function divRZ(a: number, [b, bi]: ComplexNumber): ComplexNumber {
	const d = b * b + bi * bi;
	return [(a * b) / d, -(a * bi) / d];
}

export function invZ([a, ai]: ComplexNumber): ComplexNumber {
	const d = a * a + ai * ai;
	return [a / d, -ai / d];
}

export function expZ([a, ai]: ComplexNumber): ComplexNumber {
	const exp = Math.exp(a);
	return [exp * Math.cos(ai), exp * Math.sin(ai)];
}
