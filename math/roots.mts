/*@__PURE__*/ export function solveLinear(f1: number, f0: number) {
	return f1 ? [-f0 / f1] : [];
}

/*@__PURE__*/ export function solveQuadratic(
	f2: number,
	f1: number,
	f0: number,
) {
	if (!f2) {
		return solveLinear(f1, f0);
	}
	const disc = f1 * f1 - 4 * f2 * f0;
	const m = 0.5 / f2;
	if (disc > 0) {
		const root = Math.sqrt(disc);
		return [(-f1 + root) * m, (-f1 - root) * m];
	}
	if (!disc) {
		return [-f1 * m];
	}
	return [];
}

/*@__PURE__*/ export function solveCubic(
	f3: number,
	f2: number,
	f1: number,
	f0: number,
) {
	if (!f3) {
		return solveQuadratic(f2, f1, f0);
	}

	// thanks, https://pomax.github.io/bezierinfo/#extremities
	// a->f2	b->f1	c->f0	d->f3

	const m = 1 / f3;
	const s = f2 * m * (1 / 3);
	const p = f1 * m * (1 / 3) - s * s;
	const p3 = p * p * p;
	const q = (s * (2 * s * s - f1 * m) + f0 * m) * 0.5;
	const disc = q * q + p3;
	if (disc < 0) {
		const r = Math.sqrt(-p3);
		const phi = Math.acos(Math.max(-1, Math.min(1, -q / r))) * (1 / 3);
		const t1 = 2 * Math.cbrt(r);
		return [
			t1 * Math.cos(phi - Math.PI * (2 / 3)) - s,
			t1 * Math.cos(phi) - s,
			t1 * Math.cos(phi + Math.PI * (2 / 3)) - s,
		];
	}

	if (!disc) {
		const u1 = Math.cbrt(q);
		return [-2 * u1 - s, u1 - s];
	}

	const root = Math.sqrt(disc);
	return [Math.cbrt(root - q) - Math.cbrt(root + q) - s];
}

/*@__PURE__*/ export function solveO6(
	f6: number,
	f5: number,
	f4: number,
	f3: number,
	f2: number,
	f1: number,
	f0: number,
	{ min = 0, max = 1, maxError = 1e-4 } = {},
) {
	// returns 0 points and sign of derivative
	// does not include double roots
	// (i.e. sign of derivative is always +1 or -1, not 0)

	// equation is order >4, so cannot be directly solved;
	// solve its third derivative instead, then use binary search to
	// find all turning points and crossings.
	// (technically the second derivative is already analytically
	// solvable, but it is a complex algorithm)

	// derivative
	const df5 = f6 * 6;
	const df4 = f5 * 5;
	const df3 = f4 * 4;
	const df2 = f3 * 3;
	const df1 = f2 * 2;
	const df0 = f1;

	// d^2
	const ddf4 = df5 * 5;
	const ddf3 = df4 * 4;
	const ddf2 = df3 * 3;
	const ddf1 = df2 * 2;
	const ddf0 = df1;

	// solve third derivative = 0 analytically
	const starts = solveCubic(ddf4 * 4, ddf3 * 3, ddf2 * 2, ddf1)
		.filter((x) => x > min && x < max)
		.sort();
	starts.push(max);

	interface Values {
		y: number;
		d: number;
		dd: number;
	}

	function at(x1: number): Values {
		const x2 = x1 * x1;
		const x3 = x2 * x1;
		const x4 = x2 * x2;
		const x5 = x3 * x2;
		const x6 = x3 * x3;
		return {
			y: f0 + f1 * x1 + f2 * x2 + f3 * x3 + f4 * x4 + f5 * x5 + f6 * x6,
			d: df0 + df1 * x1 + df2 * x2 + df3 * x3 + df4 * x4 + df5 * x5,
			dd: ddf0 + ddf1 * x1 + ddf2 * x2 + ddf3 * x3 + ddf4 * x4,
		};
	}

	function maybeSolutionBetween(lv: Values, hv: Values) {
		// check if our points straddle the axis, or the derivative or
		// second derivative changes in a way that could suggest a
		// crossing. (no need to check third+ derivative, since we
		// already use its roots as our starting points, so it will
		// never cross 0 within a segment)
		const yl0 = lv.y < 0;
		const dl0 = lv.d < 0;
		return (
			yl0 !== hv.y < 0 ||
			(dl0 !== yl0 && yl0 === hv.d < 0) ||
			(lv.dd < 0 !== dl0 && dl0 === hv.dd < 0)
		);
	}

	const solutions: [number, -1 | 1][] = [];

	function recur(l: number, h: number, lv: Values, hv: Values) {
		if (h - l > maxError) {
			const mid = (l + h) * 0.5;
			const midv = at(mid);
			if (maybeSolutionBetween(lv, midv)) {
				recur(l, mid, lv, midv);
			}
			if (maybeSolutionBetween(midv, hv)) {
				recur(mid, h, midv, hv);
			}
		} else if (lv.y < 0 !== hv.y < 0) {
			solutions.push([l + ((h - l) * lv.y) / (lv.y - hv.y), lv.y < 0 ? 1 : -1]);
		}
	}

	let l = min;
	let lv = at(min);
	for (const h of starts) {
		const hv = at(h);
		if (maybeSolutionBetween(lv, hv)) {
			recur(l, h, lv, hv);
		}
		l = h;
		lv = hv;
	}

	return solutions;
}
