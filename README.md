# Curve Ops

A collection of mathematical utilities for working with curves (primarily Bézier
curves). This is designed for vector drawing tools, but also exposes various
underlying abilities such as matrix operations which may be useful elsewhere.

This library is dependency free and designed to work with tree shaking (dead
code removal) for minimal deployed code size.

## Features

- Various shapes
  - `AxisAlignedBox` (`aaBox`): 2D Axis-Aligned Boxes (typically bounding boxes)
  - `Rectangle` (`rect`): 2D Rectangles with orientation
  - `Circle` (`circ`): 2D Circles
  - `LineSegment` (`line`): 2D Line Segments
  - `Polygon` (`polygon`): 2D closed shapes formed of straight line segments
  - `Polyline<Dim>`: Any dimension (`Dim`) open shapes formed of straight line
    segments
    - `Polyline2D`: Optimisations and extra features for 2D polylines
  - Béziers
    - `Bezier<N, Dim>` (`bezier`): Any degree (`N-1`), any dimension (`Dim`)
    - `QuadraticBezier` (`bezier2`) / `CubicBezier` (`bezier3`): Optimisations
      and extra features for 2D quadratic and cubic Béziers
- Shape overlap detection
- Shape intersection, subtraction (`cut*`)
- Least squares curve fitting
  - optional fixed endpoints and direction
- `Vector<N>` (`vec`): n-D point / vector operations
  - `Pt`: Optimisations and extra features for 2D vectors
- `Matrix<M, N>` (`mat`): Type-safe matrix operations
  - multiplication / addition / subtraction / etc.
  - inversion (up to size 4x4)
  - optimised implementations for 1x1, 2x2, 3x3, and 4x4 matrices
- `Quaternion` (`quat`): Quaternion operations
  - multiplication / addition / subtraction / etc.
  - linear (`lerp`) and spherical linear (`slerp`) interpolation
  - 3D rotation matrix conversions
- `Polynomial<N>` (`polynomial`): Polynomial operations of any order (`N-1`)
  - multiplication / addition / subtraction / etc.
  - integration / differentiation
  - root finding (1st, 2nd, 3rd, 4th, and 6th order)
- `ComplexNumber` (`z`): Complex numbers
  - multiplication / addition / subtraction / etc.
  - exponentiation
- Mathematical functions
  - `erf` / `erfc` (+ complex erfc)
  - Fresnel S and C integrals
  - binomial coefficients
- Typescript type helpers
  - Numerical
    - `Increment<N>` / `Decrement<N>`
    - `Multiply<A, B>` / `DivideWhole<N, D>`
    - `Max<A, B>`
    - `Sign`
  - Array / tuple
    - `SizedArray<T, N>`: a tuple containing `N` items of type `T`
    - `SizedArrayWithLength<T, N>`: same as `SizedArray` but with an explicit
      `length` property, which can be useful for some type inference (but
      detremental in other situations)
    - `SizeOf`: extract the size of a tuple or array

## Installing

```sh
npm install --save curve-ops
```

## Usage

All functions, types, and constants can be imported by name from `'curve-ops'`,
for example:

```js
import { aaBoxSVG, bezier3Bounds, bezier3FromPts, bezier3SVG } from 'curve-ops';

const curve = bezier3FromPts(
	{ x: 50, y: 50 },
	{ x: 500, y: 450 },
	{ x: 0, y: 400 },
	{ x: 300, y: 100 },
);
const bounds = bezier3Bounds(curve);

// Display as an SVG:

const SVGNS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(SVGNS, 'svg');
svg.setAttribute('version', '1.1');
svg.setAttribute('viewBox', '0 0 500 500');
svg.setAttribute('width', '500');
svg.setAttribute('height', '500');
document.body.append(svg);

const bbPath = document.createElementNS(SVGNS, 'path');
bbPath.setAttribute('stroke', 'green');
bbPath.setAttribute('fill', 'none');
bbPath.setAttribute('d', aaBoxSVG(bounds));
svg.append(bbPath);

const curvePath = document.createElementNS(SVGNS, 'path');
curvePath.setAttribute('stroke', 'black');
curvePath.setAttribute('fill', 'none');
curvePath.setAttribute('d', bezier3SVG(curve));
svg.append(curvePath);
```

### Functions

Functions are named accodring to the type of entity they work with. For example,
functions which work with `AxisAlignedBox` entities contain `aaBox` in their
name.

Unless otherwise noted, all functions leave their arguments unchanged, returning
a new entity for the result.

- `aaBoxArea(box)`
- `aaBoxContains(box, pt)`
- `aaBoxFromXY(xs, ys)`
- `aaBoxGrow(box, grow)`
- `aaBoxMidpoint(box)`
- `aaBoxSVG(box, precision = 6)`
- `addZ(a, b)`
- `addZR(a, b)`
- `bezier2At(curve, t)`
- `bezier2Bisect(curve, t = 0.5)`
- `bezier2Bounds(curve)`
- `bezier2Derivative(curve)`
- `bezier2FromBezier(curve)`
- `bezier2FromLine(line)`
- `bezier2FromPolylinePtsLeastSquares(pts)`
- `bezier2FromPolylinePtsLeastSquaresFixEnds(pts, previous?)`
- `bezier2FromPts(pts)`
- `bezier2LengthEstimate(curve)`
- `bezier2NormalAt(curve, t)`
- `bezier2OpenArea(curve)`
- `bezier2PolynomialX(curve)`
- `bezier2PolynomialY(curve)`
- `bezier2RMSDistance(curve, pts)`
- `bezier2Split(curve, ts)`
- `bezier2Subdivide(curve, maxError, maxDivisions = 1000)`
- `bezier2SVG(curve, precision = 6, prefix = 'M', controlLines = false)`
- `bezier2Scale(curve, scale)`
- `bezier2SignedArea(curve)`
- `bezier2TangentAt(curve, t)`
- `bezier2Transform(curve, transform)`
- `bezier2Translate(curve, delta)`
- `bezier2TsAtXEq(curve, x)`
- `bezier2TsAtYEq(curve, y)`
- `bezier2XAt(curve, t)`
- `bezier2XTurningPointTs(curve)`
- `bezier2YAt(curve, t)`
- `bezier2YTurningPointTs(curve)`
- `bezier3At(curve, t)`
- `bezier3Bisect(curve, t = 0.5)`
- `bezier3Bounds(curve)`
- `bezier3Derivative(curve)`
- `bezier3FromBezier(curve)`
- `bezier3FromBezier2(curve)`
- `bezier3FromLine(line)`
- `bezier3FromPolylinePtsLeastSquares(pts)`
- `bezier3FromPolylinePtsLeastSquaresFixEnds(pts, previous?)`
- `bezier3FromPts(pts)`
- `bezier3FromQuad(p0, c1, c2, p3)`
- `bezier3InflectionTs(curve)`
- `bezier3LengthEstimate(curve)`
- `bezier3NormalAt(curve, t)`
- `bezier3OpenArea(curve)`
- `bezier3Normalise(curve)`
- `bezier3PolynomialX(curve)`
- `bezier3PolynomialY(curve)`
- `bezier3RMSDistance(curve, pts)`
- `bezier3Split(curve, ts)`
- `bezier3Subdivide(curve, maxError, maxDivisions = 1000)`
- `bezier3SubdivideBezier2(curve, maxError, maxDivisions = 1000)`
- `bezier3SVG(curve, precision = 6, prefix = 'M', controlLines = false)`
- `bezier3Scale(curve, scale)`
- `bezier3SignedArea(curve)`
- `bezier3TangentAt(curve, t)`
- `bezier3Transform(curve, transform)`
- `bezier3Translate(curve, delta)`
- `bezier3TsAtXEq(curve, x)`
- `bezier3TsAtYEq(curve, y)`
- `bezier3XAt(curve, t)`
- `bezier3XTurningPointTs(curve)`
- `bezier3YAt(curve, t)`
- `bezier3YTurningPointTs(curve)`
- `bezierAt(curve, t)`
- `bezierAtMulti(curve, ts)`
- `bezierBisect(curve, t = 0.5)`
- `bezierDerivative(curve)`
- `bezierElevateOrder(curve)`
- `bezierElevateOrderTo(curve, target)`
- `bezierFrenetNormalAt(curve, t)`
- `bezierFromBezier2(curve)`
- `bezierFromBezier3(curve)`
- `bezierFromEndpoints(p0, p1)`
- `bezierFromLine(line)`
- `bezierFromPolylineVertsLeastSquares(polyline)`
- `bezierFromPolylineVertsLeastSquaresFixEnds(polyline)`
- `bezierFromQuad(p0, c1, c2, p3)`
- `bezierFromVecs([p0, c1, c2, p3])`
- `bezierLowerOrder(curve)`
- `bezierM(n)`
- `bezierMInv(n)`
- `bezierNormalAt(curve, t)`
- `bezierOrder(curve)`
- `bezierPolynomials(curve)`
- `bezierScale(curve, scale)`
- `bezierSplit(curve, ts)`
- `bezierSVG(curve, precision = 6, prefix = 'M', controlLines = false)`
- `bezierTangentAt(curve, t)`
- `bezierTransform(curve, transform)`
- `bezierTranslate(curve, delta)`
- `binomial(a, b)`
- `circleArea(circle)`
- `circleBounds(circle)`
- `circleCircumference(circle)`
- `circleContains(circle, pt)`
- `circleSVG(circle, precision = 6)`
- `complexCompanionMat(z)`
- `conjugateZ(z)`
- `cutBezier3Circle`
- `cutBezier3Rect`
- `divRZ(num, den)`
- `divZ(num, den)`
- `erf(x)`
- `erfc(x)`
- `erfcZ(z)`
- `erfZ(z)`
- `expZ(z)`
- `fresnelCIntegral(x)`
- `fresnelSIntegral(x)`
- `intersectBezier3Circle(curve, circle, maxError = 1e-4)`
- `intersectBezier3CircleFn(curve)`
- `intersectBezier3Line(curve, line)`
- `intersectBezier3Rect(curve, rect, maxError = 1e-4)`
- `intersectLineLine(line1, line2)`
- `intersectNBezier3Circle(normCurve, circle, maxError = 1e-4)`
- `intersectNBezier3CircleFn(normCurve)`
- `invZ(z)`
- `isOverlapAABox(box1, box2)`
- `isOverlapAABoxCircle(box, circle)`
- `isOverlapAABoxCircleR2(box, centre, radiusSquared)`
- `lineAt(line, t)`
- `lineBisect(line, t = 0.5)`
- `lineBounds(line)`
- `lineDerivative(line)`
- `lineFromBezier(bezier)`
- `lineFromPts(p0, p1)`
- `lineLength(line)`
- `lineMidpoint(line)`
- `lineNormal(line)`
- `lineOpenArea(line)`
- `linePolynomialX(line)`
- `linePolynomialY(line)`
- `lineScale(line, scale)`
- `lineSplit(line, ts)`
- `lineSVG(line, precision = 6, prefix = 'M')`
- `lineTangent(line)`
- `lineTransform(line, transform)`
- `lineTranslate(line, delta)`
- `lineTsAtXEq(line, x)`
- `lineTsAtYEq(line, y)`
- `lineXAt(line, t)`
- `lineYAt(line, t)`
- `mat1Determinant(matrix)`
- `mat1Eigenvalues(matrix)`
- `mat1Eigenvector(matrix, eigenvalue)`
- `mat1Inverse(matrix)`
- `mat1LeftInverse(matrix)`
- `mat1RightInverse(matrix)`
- `mat1Trace(matrix)`
- `mat2Determinant(matrix)`
- `mat2Eigenvalues(matrix)`
- `mat2Eigenvector(matrix, eigenvalue)`
- `mat2Inverse(matrix)`
- `mat2LeftInverse(matrix)`
- `mat2RightInverse(matrix)`
- `mat2Trace(matrix)`
- `mat3Determinant(matrix)`
- `mat3Eigenvalues(matrix)`
- `mat3Eigenvector(matrix, eigenvalue)`
- `mat3FromQuat(quaternion)`
- `mat3FromUnitQuat(quaternion)`
- `mat3Inverse(matrix)`
- `mat3LeftInverse(matrix)`
- `mat3RightInverse(matrix)`
- `mat3Trace(matrix)`
- `mat4Determinant(matrix)`
- `mat4Eigenvalues(matrix)`
- `mat4Eigenvector(matrix, eigenvalue)`
- `mat4Inverse(matrix)`
- `mat4LeftInverse(matrix)`
- `mat4RightInverse(matrix)`
- `mat4Trace(matrix)`
- `matAdd(matrix1, matrix2)`
- `matAddColumnwise(matrix, vector)`
- `matBinaryOp(matrix1, matrix2, fn, name = '+')`
- `matDeterminant(matrix)`
- `matEigenvalues(matrix)`
- `matEigenvector(matrix, eigenvalue)`
- `matElementNorm(matrix)`
- `matElementNorm2(matrix)`
- `matFrom(array2D)`
- `matFromArray(flatArray, n)`
- `matFromArrayFn(array, rowMapping)`
- `matFromDiag(array)`
- `matFromEyeTargetUp(eye, target, up)`
- `matFromPts(pointArray)`
- `matFromRotationBetween(norm1, norm2)`
- `matFromVecArray(vectorArray)`
- `matIdent(n)`
- `matInverse(matrix)`
- `matLeftInverse(matrix)`
- `matLerp(matrix1, matrix2, t)`
- `matMid(matrix1, matrix2)`
- `matMinor(matrix, row, column)`
- `matMul(matrix1, matrix2)`
- `matMulABTranspose(matrix1, matrix2)`
- `matMulATransposeB(matrix1, matrix2)`
- `matMulColumnwise(matrix, vector)`
- `matPadIdent(matrix, size)`
- `matPrint(matrix)`
- `matProjectVec3(matrix, vector)`
- `matReshape(matrix, n)`
- `matRightInverse(matrix)`
- `matScale(matrix, scale)`
- `matScaleAdd(matrix1, scale, matrix2)`
- `matSkewSymmetricCrossProduct(vector)`
- `matSub(matrix1, matrix2)`
- `matSumDiagDeterminant2(matrix)`
- `matSumDiagDeterminant3(matrix)`
- `matTrace(matrix)`
- `matTranspose(matrix)`
- `matUnaryOp(matrix, fn)`
- `matWindow(matrix, row0, column0, rows, columns)`
- `matZero(m, n)`
- `movementThrottle`
- `mulZ(z1, z2)`
- `mulZR(z, scale)`
- `nBezier3Area(normCurve)`
- `nBezier3At(normCurve, t)`
- `nBezier3Curvature(normCurve, t)`
- `nBezier3Derivative(normCurve, t)`
- `nBezier3InflectionTs(normCurve)`
- `nBezier3Moment(normCurve)`
- `nBezier3XAt(normCurve, t)`
- `nBezier3YAt(normCurve, t)`
- `negZ(z)`
- `penTool`
- `polygonContains`
- `polygonSignedArea`
- `polyline2DFromPolyline`
- `polyline2DFromPts`
- `polyline2DOpenArea`
- `polyline2DSVG`
- `polylineFromPolyline2D`
- `polylineFromVecs`
- `polynomial2Roots`
- `polynomial3Roots`
- `polynomial3SignedRoots`
- `polynomial4Roots`
- `polynomial4SignedRoots`
- `polynomial5Roots`
- `polynomial5SignedRoots`
- `polynomial7SignedRoots`
- `polynomialAdd`
- `polynomialAt`
- `polynomialCompanionMat`
- `polynomialDerivative`
- `polynomialFromBezier2Values`
- `polynomialFromBezier3Values`
- `polynomialFromBezierValues`
- `polynomialIntegral`
- `polynomialMul`
- `polynomialRoots`
- `polynomialScale`
- `polynomialShift`
- `polynomialSub`
- `polynomialWithSolutions`
- `ptAdd`
- `ptAngle`
- `ptCross`
- `ptDist`
- `ptDist2`
- `ptDot`
- `ptFromVec`
- `ptLen`
- `ptLen2`
- `ptLerp`
- `ptMad`
- `ptMid`
- `ptMul`
- `ptNorm`
- `ptReflect`
- `ptRot90`
- `ptsFromMat`
- `ptSignedAngle`
- `ptSub`
- `ptSVG`
- `ptTransform`
- `quatAdd`
- `quatConjugate`
- `quatDist`
- `quatDist2`
- `quatDiv`
- `quatDot`
- `quatExp`
- `quatFrom`
- `quatFromMat3BestFit`
- `quatFromMat3Exact`
- `quatFromRotationAround`
- `quatInv`
- `quatLerp`
- `quatLerpShortestPath`
- `quatLerpShortestPathUnit`
- `quatLerpUnit`
- `quatLog`
- `quatMad`
- `quatMul`
- `quatNearest`
- `quatNorm`
- `quatNorm2`
- `quatPrint`
- `quatScale`
- `quatSlerp`
- `quatSlerpShortestPath`
- `quatSquad`
- `quatSub`
- `quatUnit`
- `quatVectorNorm`
- `quatVectorNorm2`
- `rectArea`
- `rectBounds`
- `rectContains`
- `rectFromAABox`
- `rectFromLine`
- `rectSVG`
- `subRZ`
- `subZ`
- `unscaledFresnelCIntegral`
- `unscaledFresnelSIntegral`
- `vec2Cross`
- `vec3Cross`
- `vecAdd`
- `vecAngle`
- `vecArrayFromMat`
- `vecDist`
- `vecDist2`
- `vecDot`
- `vecFrom`
- `vecFromPt`
- `vecLen`
- `vecLen2`
- `vecLerp`
- `vecMad`
- `vecMid`
- `vecMul`
- `vecNorm`
- `vecPrint`
- `vecReflect`
- `vecSub`
- `zeros(count)`

### Classes

- `SingleLinkedList<T>`

### Constants

- `AABOX0`: Constant for `{ l: { x: 0, y: 0 }, h: { x: 0, y: 0 } }`.
- `bezier2M`: Constant for `bezierM(3)`.
- `bezier2MInv`: Constant for `matInverse(bezierM(3))`.
- `bezier3M`: Constant for `bezierM(4)`.
- `bezier3MInv`: Constant for `matInverse(bezierM(4))`.
- `MAT1IDENT`: Constant for `matIdent(1)`.
- `MAT2IDENT`: Constant for `matIdent(2)`.
- `MAT2ROT90`: Constant for `matFrom([[0, 1], [-1, 0]])`.
- `MAT3IDENT`: Constant for `matIdent(3)`.
- `MAT4IDENT`: Constant for `matIdent(4)`.
- `PT0`: Constant for `{ x: 0, y: 0 }`.

## References

Many of the Bézier capabilities in this library are based on the following
sources:

- <https://pomax.github.io/bezierinfo/>
- <https://raphlinus.github.io/>
  - <https://raphlinus.github.io/curves/2018/12/28/bezier-arclength.html>
  - <https://raphlinus.github.io/curves/2021/03/11/bezier-fitting.html>
