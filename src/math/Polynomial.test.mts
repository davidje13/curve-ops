import {
	polynomial2Roots,
	polynomial3Roots,
	polynomial4Roots,
	polynomial5Roots,
	polynomial7SignedRoots,
	polynomialAdd,
	polynomialAt,
	polynomialDerivative,
	polynomialIntegral,
	polynomialMul,
	polynomialScale,
	polynomialShift,
	polynomialSub,
	polynomialWithSolutions,
} from './Polynomial.mts';
import 'lean-test';

describe('polynomialAt', () => {
	it('evaluates an n-th degree polynomial', () => {
		for (let x = -10; x < 10; ++x) {
			const y = polynomialAt([2, 3, 4, 5], x);
			expect(y).equals(2 + 3 * x + 4 * x * x + 5 * x * x * x);
		}
	});

	it('returns 0 for a polynomial without terms', () => {
		expect(polynomialAt([], 10)).equals(0);
	});
});

describe('polynomialMul', () => {
	it('multiplies two polynomials', () => {
		expect(polynomialMul([2, 3], [4, 5])).equals([2 * 4, 3 * 4 + 2 * 5, 3 * 5]);
	});

	it('multiplies polynomials of different degrees', () => {
		expect(polynomialMul([2, 3], [4])).equals([2 * 4, 3 * 4]);
		expect(polynomialMul([2], [4, 5])).equals([2 * 4, 2 * 5]);
		expect(polynomialMul([2, 3], [4, 5, 6])).equals([
			2 * 4,
			2 * 5 + 3 * 4,
			2 * 6 + 3 * 5,
			3 * 6,
		]);
	});

	it('multiplies more than two polynomials', () => {
		expect(polynomialMul([2, 3], [4, 5], [6, 7])).equals([
			2 * 4 * 6,
			3 * 4 * 6 + 2 * 5 * 6 + 2 * 4 * 7,
			2 * 5 * 7 + 3 * 4 * 7 + 3 * 5 * 6,
			3 * 5 * 7,
		]);
	});

	it('returns one polynomial unchanged', () => {
		expect(polynomialMul([2, 3])).equals([2, 3]);
	});
});

describe('polynomialDerivative', () => {
	it('differentiates a polynomial', () => {
		expect(polynomialDerivative([2, 3, 4, 5])).equals([3, 8, 15]);
	});
});

describe('polynomialIntegral', () => {
	it('integrates a polynomial', () => {
		expect(polynomialIntegral([3, 8, 15])).equals([0, 3, 4, 5]);
	});

	it('adds an optional constant term', () => {
		expect(polynomialIntegral([3, 8, 15], 2)).equals([2, 3, 4, 5]);
	});
});

describe('polynomialAdd', () => {
	it('sums two polynomials', () => {
		expect(polynomialAdd([1, 2, 3], [4, 5, 6])).equals([5, 7, 9]);
	});

	it('uses implicit 0s if the polynomials have different orders', () => {
		expect(polynomialAdd([1, 2, 3], [4, 5])).equals([5, 7, 3]);
		expect(polynomialAdd([1, 2], [4, 5, 6])).equals([5, 7, 6]);
	});
});

describe('polynomialSub', () => {
	it('subtracts two polynomials', () => {
		expect(polynomialSub([1, 2, 3], [1, 1, 2])).equals([0, 1, 1]);
	});

	it('uses implicit 0s if the polynomials have different orders', () => {
		expect(polynomialSub([1, 2, 3], [1, 1])).equals([0, 1, 3]);
		expect(polynomialSub([1, 2], [1, 1, 2])).equals([0, 1, -2]);
	});
});

describe('polynomialScale', () => {
	it('scales all terms', () => {
		expect(polynomialScale([2, 3, 5], 2)).equals([4, 6, 10]);
	});
});

describe('polynomialShift', () => {
	it('adds a value to the x^0 term', () => {
		expect(polynomialShift([2, 3, 5], 2)).equals([4, 3, 5]);
	});

	it('rejects polynomials without terms', () => {
		expect(() => polynomialShift([] as any, 2)).throws('empty polynomial');
	});
});

describe('polynomialWithSolutions', () => {
	it('returns a polynomial which is 0 at the requested values', () => {
		for (let i = -5; i <= 5; ++i) {
			const poly1 = polynomialWithSolutions(i);
			expect(poly1).hasLength(2);
			expect(polynomialAt(poly1, i)).equals(0);
			expect(polynomialAt(poly1, i + 1)).not(equals(0));

			for (let j = -5; j <= 5; ++j) {
				const poly2 = polynomialWithSolutions(i, j);
				expect(poly2).hasLength(3);
				expect(polynomialAt(poly2, i)).equals(0);
				expect(polynomialAt(poly2, j)).equals(0);
				expect(polynomialAt(poly2, 10)).not(equals(0));

				for (let k = -5; k <= 5; ++k) {
					const poly3 = polynomialWithSolutions(i, j, k);
					expect(poly3).hasLength(4);
					expect(polynomialAt(poly3, i)).equals(0);
					expect(polynomialAt(poly3, j)).equals(0);
					expect(polynomialAt(poly3, k)).equals(0);
					expect(polynomialAt(poly3, 10)).not(equals(0));
				}
			}
		}
	});

	it('returns a polynomial scaled to 1 for the highest order term', () => {
		const poly = polynomialWithSolutions(1, 2);
		expect(poly[poly.length - 1]).equals(1);
	});
});

describe('polynomial2Roots', () => {
	it('solves a+bx=0', () => {
		const roots = polynomial2Roots([-2, 4]);
		expect(roots).toContain(isNear(0.5, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('solves a+bx=y', () => {
		const roots = polynomial2Roots([-2, 4], 2);
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if x^1 term is 0', () => {
		expect(polynomial2Roots([-2, 0])).isEmpty();
		expect(polynomial2Roots([0, 0])).isEmpty();
		expect(polynomial2Roots([0, 0], 1)).isEmpty();
	});
});

describe('polynomial3Roots', () => {
	it('solves a+bx+cx^2=0', () => {
		const roots = polynomial3Roots(
			polynomialScale(polynomialWithSolutions(2, 4), 2),
		);
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(4, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('solves a+bx+cx^2=y', () => {
		const roots = polynomial3Roots(
			polynomialShift(polynomialWithSolutions(2, 4), 1),
			1,
		);
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(4, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns one solution if the equation has a repeated root (3,3)', () => {
		const roots = polynomial3Roots(polynomialWithSolutions(3, 3));
		expect(roots).toContain(isNear(3, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if the equation has no roots', () => {
		expect(polynomial3Roots([10, 1, 10])).isEmpty();
		expect(polynomial3Roots([-10, -1, -10])).isEmpty();
	});

	it('returns a linear solution if x^2 term is 0', () => {
		const roots = polynomial3Roots([-2, 4, 0]);
		expect(roots).toContain(isNear(0.5, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if x^1 and x^2 terms are 0', () => {
		expect(polynomial3Roots([10, 0, 0])).isEmpty();
		expect(polynomial3Roots([0, 0, 0])).isEmpty();
	});
});

describe('polynomial4Roots', () => {
	it('solves a+bx+cx^2+dx^3=0', () => {
		const roots = polynomial4Roots(
			polynomialScale(polynomialWithSolutions(1, 2, 3), 2),
		);
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(3, { tolerance }));
		expect(roots).hasLength(3);
	});

	it('solves a+bx+cx^2+dx^3=y', () => {
		const roots = polynomial4Roots(
			polynomialShift(polynomialWithSolutions(1, 2, 3), 1),
			1,
		);
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(3, { tolerance }));
		expect(roots).hasLength(3);
	});

	it('returns two solutions if the equation has a repeated root (1,1,2)', () => {
		const roots = polynomial4Roots(polynomialWithSolutions(1, 1, 2));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns two solutions if the equation has a repeated root (1,2,2)', () => {
		const roots = polynomial4Roots(polynomialWithSolutions(1, 2, 2));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns one solution if the equation has a triple repeated root (1,1,1)', () => {
		const roots = polynomial4Roots(polynomialWithSolutions(1, 1, 1));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns one solution if the equation has a turning point below y=0', () => {
		const roots = polynomial4Roots(
			polynomialShift(polynomialWithSolutions(1, 1, 2), 2),
		);
		expect(roots).toContain(isNear(0, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns one solution if the equation has a turning point above y=0', () => {
		const roots = polynomial4Roots(
			polynomialShift(polynomialWithSolutions(0, 0, 1), -4),
		);
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns a quadratic solution if x^3 term is 0', () => {
		const roots = polynomial4Roots([16, -12, 2, 0]);
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(4, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns a linear solution if x^2 and x^3 terms are 0', () => {
		const roots = polynomial4Roots([-2, 4, 0, 0]);
		expect(roots).toContain(isNear(0.5, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if x^1, x^2, and x^3 terms are 0', () => {
		expect(polynomial4Roots([10, 0, 0, 0])).isEmpty();
		expect(polynomial4Roots([0, 0, 0, 0])).isEmpty();
	});
});

describe('polynomial5Roots', () => {
	it('solves a+bx+cx^2+dx^3+ex^4=0', () => {
		const roots = polynomial5Roots(
			polynomialScale(polynomialWithSolutions(1, 2, 3, 4), 2),
		);
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(3, { tolerance }));
		expect(roots).toContain(isNear(4, { tolerance }));
		expect(roots).hasLength(4);
	});

	it('solves a+bx+cx^2+dx^3+ex^4=y', () => {
		const roots = polynomial5Roots(
			polynomialShift(polynomialWithSolutions(1, 2, 3, 4), 1),
			1,
		);
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(3, { tolerance }));
		expect(roots).toContain(isNear(4, { tolerance }));
		expect(roots).hasLength(4);
	});

	it('solves symmetric equations', () => {
		const roots = polynomial5Roots(
			polynomialScale(polynomialWithSolutions(-2, -1, 1, 2), 2),
		);
		expect(roots).toContain(isNear(-2, { tolerance }));
		expect(roots).toContain(isNear(-1, { tolerance }));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(4);
	});

	it('returns three solutions if the equation has a repeated root (-1,-1,0,2)', () => {
		const roots = polynomial5Roots(polynomialWithSolutions(-1, -1, 0, 2));
		expect(roots).toContain(isNear(-1, { tolerance }));
		expect(roots).toContain(isNear(0, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(3);
	});

	it('returns three solutions if the equation has a repeated root (-1,0,0,1)', () => {
		const roots = polynomial5Roots(polynomialWithSolutions(-1, 0, 0, 1));
		expect(roots).toContain(isNear(-1, { tolerance }));
		expect(roots).toContain(isNear(0, { tolerance }));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).hasLength(3);
	});

	it('returns three solutions if the equation has a repeated root (-2,0,1,1)', () => {
		const roots = polynomial5Roots(polynomialWithSolutions(-2, 0, 1, 1));
		expect(roots).toContain(isNear(-2, { tolerance }));
		expect(roots).toContain(isNear(0, { tolerance }));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).hasLength(3);
	});

	it('returns two solutions if the equation has a triple repeated root (1,1,1,2)', () => {
		const roots = polynomial5Roots(polynomialWithSolutions(1, 1, 1, 2));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns two solutions if the equation has a triple repeated root (1,2,2,2)', () => {
		const roots = polynomial5Roots(polynomialWithSolutions(1, 2, 2, 2));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns one solution if the equation has a quad repeated root (1,1,1,1)', () => {
		const roots = polynomial5Roots(polynomialWithSolutions(1, 1, 1, 1));
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns a simple solution if x^1, x^2, and x^3 terms are 0', () => {
		const roots1 = polynomial5Roots([0, 0, 0, 0, 1]);
		expect(roots1).toContain(isNear(0, { tolerance }));
		expect(roots1).hasLength(1);

		const roots2 = polynomial5Roots([-1, 0, 0, 0, 1]);
		expect(roots2).toContain(isNear(1, { tolerance }));
		expect(roots2).toContain(isNear(-1, { tolerance }));
		expect(roots2).hasLength(2);

		const roots2b = polynomial5Roots([0, 0, 0, 0, 1], 1);
		expect(roots2b).toContain(isNear(1, { tolerance }));
		expect(roots2b).toContain(isNear(-1, { tolerance }));
		expect(roots2b).hasLength(2);
	});

	it('returns a cubic solution if x^4 term is 0', () => {
		const roots = polynomial5Roots([-6, 11, -6, 1, 0]);
		expect(roots).toContain(isNear(1, { tolerance }));
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(3, { tolerance }));
		expect(roots).hasLength(3);
	});

	it('returns a quadratic solution if x^3 and x^4 terms are 0', () => {
		const roots = polynomial5Roots([16, -12, 2, 0, 0]);
		expect(roots).toContain(isNear(2, { tolerance }));
		expect(roots).toContain(isNear(4, { tolerance }));
		expect(roots).hasLength(2);
	});

	it('returns a linear solution if x^2, x^3, and x^4 terms are 0', () => {
		const roots = polynomial5Roots([-2, 4, 0, 0, 0]);
		expect(roots).toContain(isNear(0.5, { tolerance }));
		expect(roots).hasLength(1);
	});

	it('returns no solutions if x^1, x^2, x^3, and x^4 terms are 0', () => {
		expect(polynomial5Roots([10, 0, 0, 0, 0])).isEmpty();
		expect(polynomial5Roots([0, 0, 0, 0, 0])).isEmpty();
	});
});

describe('polynomial7SignedRoots', () => {
	it('solves ax^6+bx^5+cx^4+dx^3+ex^2+fx+g=0, returning ordered roots', () => {
		const roots = polynomial7SignedRoots(
			polynomialScale(polynomialWithSolutions(1, 2, 3, 4, 5, 6), 2),
			0,
			{ min: -1, max: 10, maxError: tolerance },
		);
		expect(roots).hasLength(6);
		expect(roots[0]![0]).isNear(1, { tolerance });
		expect(roots[1]![0]).isNear(2, { tolerance });
		expect(roots[2]![0]).isNear(3, { tolerance });
		expect(roots[3]![0]).isNear(4, { tolerance });
		expect(roots[4]![0]).isNear(5, { tolerance });
		expect(roots[5]![0]).isNear(6, { tolerance });
	});

	it('solves ax^6+bx^5+cx^4+dx^3+ex^2+fx+g=y, returning ordered roots', () => {
		const roots = polynomial7SignedRoots(
			polynomialShift(polynomialWithSolutions(1, 2, 3, 4, 5, 6), 1),
			1,
			{ min: -1, max: 10, maxError: tolerance },
		);
		expect(roots).hasLength(6);
		expect(roots[0]![0]).isNear(1, { tolerance });
		expect(roots[1]![0]).isNear(2, { tolerance });
		expect(roots[2]![0]).isNear(3, { tolerance });
		expect(roots[3]![0]).isNear(4, { tolerance });
		expect(roots[4]![0]).isNear(5, { tolerance });
		expect(roots[5]![0]).isNear(6, { tolerance });
	});

	it('returns fewer roots if equation has turning points at y<>0', () => {
		const roots = polynomial7SignedRoots(
			polynomialShift(polynomialWithSolutions(1, 2, 3, 4, 5, 6), 5),
			0,
			{ min: -1, max: 10, maxError: tolerance },
		);
		expect(roots).hasLength(4);
		expect(roots[0]![0]).isNear(1.04, { tolerance: 1e-2 });
		expect(roots[1]![0]).isNear(1.82, { tolerance: 1e-2 });
		expect(roots[2]![0]).isNear(5.18, { tolerance: 1e-2 });
		expect(roots[3]![0]).isNear(5.96, { tolerance: 1e-2 });
	});

	it('returns direction of each crossing', () => {
		const roots = polynomial7SignedRoots(
			polynomialScale(polynomialWithSolutions(1, 2, 3, 4, 5, 6), 2),
			0,
			{ min: -1, max: 10, maxError: tolerance },
		);
		expect(roots).hasLength(6);
		expect(roots[0]![1]).equals(-1);
		expect(roots[1]![1]).equals(1);
		expect(roots[2]![1]).equals(-1);
		expect(roots[3]![1]).equals(1);
		expect(roots[4]![1]).equals(-1);
		expect(roots[5]![1]).equals(1);
	});

	it('only includes crossings within the given range', () => {
		const roots = polynomial7SignedRoots(
			polynomialWithSolutions(1, 2, 3, 4, 5, 6),
			0,
			{
				min: 2.1,
				max: 5.1,
				maxError: tolerance,
			},
		);
		expect(roots).hasLength(3);
		expect(roots[0]![0]).isNear(3, { tolerance });
		expect(roots[0]![1]).equals(-1);
		expect(roots[1]![0]).isNear(4, { tolerance });
		expect(roots[1]![1]).equals(1);
		expect(roots[2]![0]).isNear(5, { tolerance });
		expect(roots[2]![1]).equals(-1);
	});
});

const tolerance = 1e-10;
