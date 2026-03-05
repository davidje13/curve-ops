export {
	type AxisAlignedBox,
	aaBoxArea,
	aaBoxFromXY,
	aaBoxMidpoint,
	aaBoxSVG,
} from './math/geometry/2d/AxisAlignedBox.mts';

export {
	bezier2FromBezier,
	bezier3FromBezier,
	bezierFromBezier2,
	bezierFromBezier3,
	bezierFromLine,
	lineFromBezier,
} from './math/geometry/2d/bezierConversion.mts';

export {
	type Circle,
	circleArea,
	circleBounds,
	circleCircumference,
	circleSVG,
} from './math/geometry/2d/Circle.mts';

export {
	type CubicBezier,
	bezier3At,
	bezier3Bisect,
	bezier3Bounds,
	bezier3Derivative,
	bezier3FromBezier2,
	bezier3FromLine,
	bezier3FromPts,
	bezier3LengthEstimate,
	bezier3NormalAt,
	bezier3SVG,
	bezier3Split,
	bezier3TangentAt,
	bezier3Translate,
	bezier3TsAtXEq,
	bezier3TsAtYEq,
	bezier3XAt,
	bezier3XTurningPointTs,
	bezier3YAt,
	bezier3YTurningPointTs,
} from './math/geometry/2d/CubicBezier.mts';

export {
	intersectBezier3Circle,
	intersectBezier3CircleFn,
	intersectBezier3Line,
	intersectBezier3Rect,
	intersectNBezier3Circle,
	intersectNBezier3CircleFn,
	isOverlapAABoxCircle,
} from './math/geometry/2d/intersection.mts';

export {
	leastSquaresFitCubic,
	leastSquaresFitCubicFixEnds,
	leastSquaresFitQuadratic,
} from './math/geometry/2d/leastSquaresBezier.mts';

export {
	type Line,
	lineAt,
	lineDerivative,
	lineFromPts,
	lineLength,
	lineMidpoint,
	lineNormal,
	lineSVG,
	lineTranslate,
} from './math/geometry/2d/Line.mts';

export {
	type NormalisedCubicBezier,
	bezier3Normalise,
	nBezier3Area,
	nBezier3At,
	nBezier3Curvature,
	nBezier3Derivative,
	nBezier3InflectionTs,
	nBezier3Moment,
	nBezier3XAt,
	nBezier3YAt,
} from './math/geometry/2d/NormalisedCubicBezier.mts';

export {
	type Polygon,
	polygonSignedArea,
} from './math/geometry/2d/Polygon.mts';

export {
	PT0,
	type Pt,
	type PtWithDist,
	matFromPts,
	ptAdd,
	ptAngle,
	ptCross,
	ptDist,
	ptDist2,
	ptDot,
	ptFromVec,
	ptLen,
	ptLen2,
	ptLerp,
	ptMad,
	ptMid,
	ptMul,
	ptNorm,
	ptPolyline,
	ptReflect,
	ptRot90,
	ptSVG,
	ptSignedAngle,
	ptSub,
	ptTransform,
	ptsFromMat,
	vecFromPt,
} from './math/geometry/2d/Pt.mts';

export {
	type QuadraticBezier,
	bezier2At,
	bezier2Bisect,
	bezier2Derivative,
	bezier2FromLine,
	bezier2FromPts,
	bezier2LengthEstimate,
	bezier2SVG,
	bezier2Split,
	bezier2Translate,
	bezier2XAt,
	bezier2YAt,
} from './math/geometry/2d/QuadraticBezier.mts';

export {
	type Rectangle,
	rectArea,
	rectBounds,
	rectFromAABox,
	rectFromLine,
	rectSVG,
} from './math/geometry/2d/Rectangle.mts';

export { matProjectVec3 } from './math/geometry/3d/projection.mts';

export {
	matFromEyeTargetUp,
	matFromRotationBetween,
	matSkewSymmetricCrossProduct,
	quatFromRotationAround,
} from './math/geometry/3d/rotation.mts';

export {
	type Bezier,
	bezierAt,
	bezierAtMulti,
	bezierBisect,
	bezierDerivative,
	bezierElevateOrder,
	bezierFrenetNormalAt,
	bezierLowerOrder,
	bezierM,
	bezierMInv,
	bezierNormalAt,
	bezierOrder,
	bezierSplit,
	bezierTangentAt,
} from './math/geometry/Bezier.mts';

export {
	type Vector,
	matFromVecArray,
	vec2Cross,
	vec3Cross,
	vecAdd,
	vecAngle,
	vecArrayFromMat,
	vecDist,
	vecDist2,
	vecDot,
	vecFrom,
	vecLen,
	vecLen2,
	vecLerp,
	vecMad,
	vecMid,
	vecMul,
	vecNorm,
	vecReflect,
	vecSub,
} from './math/geometry/Vector.mts';

export { binomial } from './math/binomial.mts';

export {
	MAT1IDENT,
	MAT2IDENT,
	MAT2ROT90,
	MAT3IDENT,
	MAT4IDENT,
	type Matrix,
	internalMatFromFlat,
	mat1Determinant,
	mat1Inverse,
	mat1LeftInverse,
	mat1RightInverse,
	mat2Determinant,
	mat2Inverse,
	mat2LeftInverse,
	mat2RightInverse,
	mat3Determinant,
	mat3Inverse,
	mat3LeftInverse,
	mat3RightInverse,
	mat4Determinant,
	mat4Inverse,
	mat4LeftInverse,
	mat4RightInverse,
	matAdd,
	matBinaryOp,
	matDeterminant,
	matFrom,
	matFromArray,
	matFromArrayFn,
	matFromDiag,
	matIdent,
	matInverse,
	matLeftInverse,
	matLerp,
	matMid,
	matMul,
	matMulABTranspose,
	matMulATransposeB,
	matPrint,
	matReshape,
	matRightInverse,
	matScale,
	matScaleAdd,
	matSub,
	matTranspose,
	matUnaryOp,
	matZero,
} from './math/Matrix.mts';

export {
	type Quaternion,
	mat3FromQuatNoNorm,
	mat3FromQuatNorm,
} from './math/Quaternion.mts';

export {
	solveLinear,
	solveQuadratic,
	solveCubic,
	solveO6,
} from './math/roots.mts';

export { CurveDrawer } from './tools/CurveDrawer.mts';

export {
	type SizedArray,
	type SizedArrayWithLength,
	zeros,
} from './util/SizedArray.mts';
