const BINOMIAL_CACHE = [[1]];

export function binomial(a: number, b: number): number {
	if (a < 0 || b < 0 || b > a) {
		return 0;
	}
	while (BINOMIAL_CACHE.length <= a) {
		const n = BINOMIAL_CACHE.length;
		const prev = BINOMIAL_CACHE[n - 1]!;
		const rowEven: number[] = [];
		const rowOdd: number[] = [];
		let l = 0;
		let pEven = 0;
		for (let i = 0, e = (n + 1) >>> 1; i < e; ++i) {
			const r = prev[i]!;
			const v = l + r;
			rowEven.push(v);
			rowOdd.push(pEven + v);
			pEven = v;
			l = r;
		}
		rowOdd.push(pEven * 2);
		BINOMIAL_CACHE.push(rowEven, rowOdd);
	}
	return BINOMIAL_CACHE[a]![b * 2 > a ? a - b : b]!;
}
