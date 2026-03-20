export class SingleLinkedList<T> {
	declare private _limits: {
		_next: SingleLinkedNode<T> | undefined;
		_last: SingleLinkedMetaNode<T>;
	};

	constructor() {
		this._limits = { _next: undefined } as any;
		this._limits._last = this._limits;
	}

	push(v: T) {
		const node = { _value: v, _next: undefined };
		this._limits._last._next = node;
		this._limits._last = node;
	}

	concat(l: SingleLinkedList<T>) {
		if (l._limits._next) {
			this._limits._last._next = l._limits._next;
			this._limits._last = l._limits._last;
		}
	}

	forEach(
		fn: (
			v: T,
			meta: {
				previous: T | undefined;
				next: T | undefined;
				replace: (...replacement: T[]) => void;
			},
		) => void,
	) {
		let prev: SingleLinkedMetaNode<T> = this._limits;
		while (true) {
			const cur = prev._next;
			if (!cur) {
				return;
			}
			let nextPrev: SingleLinkedMetaNode<T> = cur;
			fn(cur._value, {
				previous: prev._value,
				next: cur._next?._value,
				replace: (...replacement) => {
					let next = nextPrev._next;
					let last = prev;
					const n = replacement.length;
					if (n) {
						next = last = { _value: replacement[n - 1]!, _next: next };
						for (let i = n - 1; i-- > 0; ) {
							next = { _value: replacement[i]!, _next: next };
						}
					}
					if (this._limits._last === nextPrev) {
						this._limits._last = last;
					}
					prev._next = next;
					nextPrev = last;
				},
			});
			prev = nextPrev;
		}
	}
}

interface SingleLinkedNode<T> {
	_value: T;
	_next: SingleLinkedNode<T> | undefined;
}

interface SingleLinkedMetaNode<T> {
	_value?: T;
	_next: SingleLinkedNode<T> | undefined;
}
