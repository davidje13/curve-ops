# Curve Ops

A collection of mathematical utilities for working with curves (primarily Bézier
curves). This is designed for vector drawing tools, but also exposes various
underlying abilities such as matrix operations which may be useful elsewhere.

This library is dependency free and designed to work with tree shaking (dead
code removal) for minimal deployed code size.

## Features

- Various shapes
  - Axis-Aligned Bounding Boxes
  - Rectangles
  - Circles
  - Lines (line segments)
  - Béziers
    - any degree, any dimension
    - optimisations and extra features for 2D quadratic and cubic Béziers
- Shape overlap detection
- Shape intersection
- Least squares curve fitting
  - optional fixed endpoints and direction
- n-D point / vector operations (with optimised versions for 2D)
- Type-safe matrix operations
  - multiplication
  - inversion (up to size 4x4)
  - optimised implementations for 1x1, 2x2, 3x3, and 4x4 matrices
- Quaternion rotation conversions
- Polynomial root finding (1st, 2nd, 3rd, and 6th order)

## Installing

```sh
npm install --save curve-ops
```

## Usage

TODO

## References

Many of the Bézier capabilities in this library are based on the following
sources:

- <https://pomax.github.io/bezierinfo/>
- <https://raphlinus.github.io/>
  - <https://raphlinus.github.io/curves/2018/12/28/bezier-arclength.html>
  - <https://raphlinus.github.io/curves/2021/03/11/bezier-fitting.html>
