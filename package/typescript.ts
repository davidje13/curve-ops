import {
	type Matrix,
	mat3Inv,
	matDiag,
	matFrom,
	matInv,
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

const matA = matFrom([1, 2], [3, 4], [5, 6]);
assertType(matA)<Matrix<3, 2>>();
// @ts-expect-error
matInv(matA);
// @ts-expect-error
mat2Inv(matA);
// @ts-expect-error
mat3Inv(matA);

const matB = matDiag(1, 2, 3);
assertType(matB)<Matrix<3, 3>>();
assertType(mat3Inv(matB))<Matrix<3, 3> | null>();

assertType(matMul(matB, matA))<Matrix<3, 2>>();

// @ts-expect-error
matMul(matA, matB);
