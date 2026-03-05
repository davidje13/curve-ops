type NATURAL = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	...number[],
];

export type Increment<N extends number> = NATURAL[N];
export type Decrement<N extends number> = [never, 0, ...NATURAL][N];

export type Multiply<A extends number, B extends number> = [
	0[],
	B[],
	[0, 2, 4, 6, 8, 10, 12, 14, 16, ...number[]],
	[0, 3, 6, 9, 12, 15, ...number[]],
	[0, 4, 8, 12, 16, ...number[]],
	[0, 5, 10, 15, ...number[]],
	[0, 6, 12, ...number[]],
	[0, 7, 14, ...number[]],
	[0, 8, 16, ...number[]],
	...[0, A, ...number[]][],
][A][B];
