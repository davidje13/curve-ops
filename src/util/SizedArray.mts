export const zeros = <N extends number>(n: N) =>
	new Array(n).fill(0) as SizedArrayWithLength<number, N>;

export type SizedArrayWithLength<T, N extends number> = {
	readonly length: N;
} & SizedArray<T, N>;

export type SizeOf<T extends { readonly length: number }> = T extends {
	readonly length: infer V;
}
	? V
	: never;

export type SizedArray<T, N extends number> = number extends N
	? T[]
	: N extends 0
		? []
		: N extends 1
			? [T]
			: N extends 2
				? [T, T]
				: N extends 3
					? [T, T, T]
					: N extends 4
						? [T, T, T, T]
						: N extends 5
							? [T, T, T, T, T]
							: N extends 6
								? [T, T, T, T, T, T]
								: N extends 7
									? [T, T, T, T, T, T, T]
									: N extends 8
										? [T, T, T, T, T, T, T, T]
										: N extends 9
											? [T, T, T, T, T, T, T, T, T]
											: N extends 10
												? [T, T, T, T, T, T, T, T, T, T]
												: N extends 11
													? [T, T, T, T, T, T, T, T, T, T, T]
													: N extends 12
														? [T, T, T, T, T, T, T, T, T, T, T, T]
														: N extends 13
															? [T, T, T, T, T, T, T, T, T, T, T, T, T]
															: N extends 14
																? [T, T, T, T, T, T, T, T, T, T, T, T, T, T]
																: N extends 15
																	? [
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																			T,
																		]
																	: N extends 16
																		? [
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																				T,
																			]
																		: T[];
