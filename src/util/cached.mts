export const cached = <Fn extends (arg: any) => any>(fn: Fn): Fn => {
	const cache = new Map<unknown, ReturnType<Fn>>();
	return ((arg) => {
		const cached = cache.get(arg);
		if (cached) {
			return cached;
		}
		const v = fn(arg);
		cache.set(arg, v);
		return v;
	}) as Fn;
};
