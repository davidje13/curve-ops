import {
	type Matrix,
	mat3Inverse,
	matFromDiag,
	matFrom,
	matInverse,
	matMul,
} from 'curve-ops';

// this file just checks types; the code is not executed

// assertion helper
type Equals<A, B> =
	(<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2
		? []
		: ['nope'];
const assertType =
	<Actual>(_: Actual) =>
	<Expected>(..._typesDoNotMatch: Equals<Actual, Expected>) => {};

// checks

const matA = matFrom([
	[1, 2],
	[3, 4],
	[5, 6],
]);
assertType(matA)<Matrix<3, 2>>();
// @ts-expect-error
matInverse(matA);
// @ts-expect-error
mat2Inverse(matA);
// @ts-expect-error
mat3Inverse(matA);

const matB = matFromDiag([1, 2, 3]);
assertType(matB)<Matrix<3, 3>>();
assertType(mat3Inverse(matB))<Matrix<3, 3> | null>();

assertType(matMul(matB, matA))<Matrix<3, 2>>();

// @ts-expect-error
matMul(matA, matB);
