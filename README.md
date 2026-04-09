# Curve Ops

A collection of mathematical utilities for working with curves (primarily Bézier
curves). This is designed for vector drawing tools, but also exposes various
underlying abilities such as matrix operations which may be useful elsewhere.

This library is dependency free and designed to work with tree shaking (dead
code removal) for minimal deployed code size.

## Features

- Various shapes
  - `AxisAlignedBox2D` (`aaBox2`): 2D Axis-Aligned Boxes (typically bounding
    boxes)
  - `Rectangle` (`rect`): 2D Rectangles with orientation
  - `Ball<Dim>` (`ball`): Any dimension (`Dim`) spheres
    - `Circle` (`circle`): 2D Circles
    - `Sphere` (`sphere`): 3D Spheres
  - `Line` (`line` / `lineSeg`): Any dimension (`Dim`) Lines and Line Segments
    - `Line2D` (`line2` / `lineSeg2`): 2D Lines and Line Segments
    - `Line3D` (`line3` / `lineSeg3`): 3D Lines and Line Segments
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
  - `Point2D`: Optimisations and extra features for 2D vectors
  - `Point3D`: Optimisations and extra features for 3D vectors
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
import {
	aaBox2SVG,
	bezier3Bounds,
	bezier3FromPts,
	bezier3SVG,
} from 'curve-ops';

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
bbPath.setAttribute('d', aaBox2SVG(bounds));
svg.append(bbPath);

const curvePath = document.createElementNS(SVGNS, 'path');
curvePath.setAttribute('stroke', 'black');
curvePath.setAttribute('fill', 'none');
curvePath.setAttribute('d', bezier3SVG(curve));
svg.append(curvePath);
```

### Functions

Functions are named accodring to the type of entity they work with. For example,
functions which work with `AxisAlignedBox2D` entities contain `aaBox2` in their
name.

All functions leave their arguments unchanged, returning a new entity for the
result.

The full list of available functions can be found in
[index.mts](./src/index.mts).

### Classes

- `SingleLinkedList<T>`

### Constants

- `AABOX00`: Constant for `{ l: { x: 0, y: 0 }, h: { x: 0, y: 0 } }`.
- `AABOX000`: Constant for
  `{ l: { x: 0, y: 0, z: 0 }, h: { x: 0, y: 0, z: 0 } }`.
- `bezier2M`: Constant for `bezierM(3)`.
- `bezier2MInv`: Constant for `matInverse(bezierM(3))`.
- `bezier3M`: Constant for `bezierM(4)`.
- `bezier3MInv`: Constant for `matInverse(bezierM(4))`.
- `MAT1IDENT`: Constant for `matIdent(1)`.
- `MAT2IDENT`: Constant for `matIdent(2)`.
- `MAT2ROT90`: Constant for `matFrom([[0, 1], [-1, 0]])`.
- `MAT3IDENT`: Constant for `matIdent(3)`.
- `MAT4IDENT`: Constant for `matIdent(4)`.
- `PT00`: Constant for `{ x: 0, y: 0 }`.
- `PT000`: Constant for `{ x: 0, y: 0, z: 0 }`.

## References

Many of the Bézier capabilities in this library are based on the following
sources:

- <https://pomax.github.io/bezierinfo/>
- <https://raphlinus.github.io/>
  - <https://raphlinus.github.io/curves/2018/12/28/bezier-arclength.html>
  - <https://raphlinus.github.io/curves/2021/03/11/bezier-fitting.html>
