export {
	type AxisAlignedBox,
	aaBoxArea,
	aaBoxFromXY,
	aaBoxMidpoint,
	aaBoxSVG,
} from './math/AxisAlignedBox.mts';

export {
	type Circle,
	circleArea,
	circleBounds,
	circleCircumference,
	circleSVG,
} from './math/Circle.mts';

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
} from './math/CubicBezier.mts';

export {
	intersectBezier3Circle,
	intersectBezier3CircleFn,
	intersectBezier3Line,
	intersectBezier3Rect,
	intersectNBezier3Circle,
	intersectNBezier3CircleFn,
	isOverlapAABoxCircle,
} from './math/intersection.mts';

export {
	leastSquaresFitCubic,
	leastSquaresFitCubicFixEnds,
	leastSquaresFitQuadratic,
} from './math/leastSquaresBezier.mts';

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
} from './math/Line.mts';

export {
	type Matrix,
	array2DToMat,
	arrayToMat,
	fnToMat,
	mat1Inv,
	mat2Inv,
	mat3Inv,
	mat4Inv,
	matDiag,
	matFrom,
	matIdent,
	matInv,
	matMul,
	matMulATransposeB,
	matPrint,
	matReshape,
	matScale,
	matToPtArray,
	matZero,
	ptArrayToMat,
} from './math/Matrix.mts';

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
} from './math/NormalisedCubicBezier.mts';

export {
	PT0,
	type Pt,
	type PtWithDist,
	ptAdd,
	ptCross,
	ptDist,
	ptDist2,
	ptDot,
	ptLen,
	ptLen2,
	ptLerp,
	ptMad,
	ptMid,
	ptMul,
	ptNorm,
	ptPolyline,
	ptRot90,
	ptSVG,
	ptSub,
	ptTransform,
} from './math/Pt.mts';

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
} from './math/QuadraticBezier.mts';

export {
	type Rectangle,
	rectArea,
	rectBounds,
	rectFromAABox,
	rectFromLine,
	rectSVG,
} from './math/Rectangle.mts';

export {
	solveLinear,
	solveQuadratic,
	solveCubic,
	solveO6,
} from './math/roots.mts';

export { CurveDrawer } from './tools/CurveDrawer.mts';
