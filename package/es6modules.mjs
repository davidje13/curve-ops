#!/usr/bin/env -S node --disable-proto=throw --disallow-code-generation-from-strings --force-node-api-uncaught-exceptions-policy --no-addons --pending-deprecation --throw-deprecation --frozen-intrinsics --no-warnings=ExperimentalWarning
import { matFrom, matMul, matFromDiag, matPrint } from 'curve-ops';

const matA = matFrom([
	[1, 2],
	[3, 4],
]);
const matB = matFromDiag([1, 2]);
const matC = matMul(matA, matB);
if (
	matC.m !== 2 ||
	matC.n !== 2 ||
	matC.v[0] !== 1 ||
	matC.v[1] !== 4 ||
	matC.v[2] !== 3 ||
	matC.v[3] !== 8
) {
	throw new Error(
		'unexpected matrix multiplication result:\n' + matPrint(matC),
	);
}
