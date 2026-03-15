import { PT0, type Pt } from '../index.mts';
import { DragHandler } from './DragHandler.mts';

export function grabbable(
	o: HTMLElement,
	update: () => void,
	initial: Pt = PT0,
): Pt {
	const r = { ...initial };
	const draw = () => {
		o.style.left = `${r.x * 100}%`;
		o.style.top = `${r.y * 100}%`;
	};
	const move = (p: Pt) => {
		r.x = p.x;
		r.y = p.y;
		draw();
		update();
	};
	const handler = new DragHandler(o.parentElement!, 1, 1, move, move, () => {});
	o.addEventListener('pointerdown', handler.begin);
	draw();
	return r;
}

export function makeNumericInput(
	min: number,
	max: number,
	step: number | 'any',
	initial: number,
	onChange: () => void,
) {
	let value = initial;
	const input = mk('input', {
		type: 'number',
		min,
		max,
		step,
		value,
	}) as HTMLInputElement;

	input.addEventListener('input', () => {
		let raw = Number.parseFloat(input.value);
		if (Number.isNaN(raw)) {
			return;
		}
		if (step !== 'any') {
			raw = Math.round(raw / step) * step;
		}
		const newValue = Math.max(min, Math.min(max, raw));
		if (newValue !== value) {
			value = newValue;
			onChange();
		}
	});

	return {
		input,
		current: () => value,
		set: (v: number) => {
			value = v;
			input.value = String(v);
		},
	};
}

interface InteractiveScope {
	addElement<T extends Element>(o: T): T;
	addPlaygroundElement<T extends Element>(o: T): T;
	addSVGElement<T extends SVGElement>(o: T): T;
	addText(text: string | null | (() => string | null)): HTMLPreElement;
	addSVGPath(
		className: string,
		d?: string | null | (() => string | null),
	): SVGPathElement;
	addHandle(className: string, initial: Pt): Pt;
	addDragHandler(
		begin: (pt: Pt) => void,
		move: (pt: Pt, end: boolean) => void,
		cancel: () => void,
	): void;
	addUpdateFn(fn: () => void): void;
	computed<T>(fn: () => T): { current: T };
}

export function makeInteractive(fn: (scope: InteractiveScope) => void) {
	const hold = mk('div', { class: 'item' });
	const playground = mk('div', { class: 'playground' });
	hold.append(playground);
	const updaters: (() => void)[] = [];
	let svg: SVGSVGElement | null = null;

	const update = () => {
		for (const u of updaters) {
			u();
		}
	};

	const scope: InteractiveScope = {
		addElement(o) {
			hold.append(o);
			return o;
		},
		addPlaygroundElement(o) {
			playground.append(o);
			return o;
		},
		addSVGElement(o) {
			if (!svg) {
				svg = mkSVG('svg', {
					version: '1.1',
					viewBox: '0 0 1 1',
					width: 500,
					height: 500,
				}) as SVGSVGElement;
				playground.prepend(svg);
			}
			svg.append(o);
			return o;
		},
		addText(text) {
			const pre = mk('pre') as HTMLPreElement;
			hold.append(pre);
			if (typeof text === 'function') {
				updaters.push(() => {
					pre.innerText = text() ?? '';
				});
			} else {
				pre.innerText = text ?? '';
			}
			return pre;
		},
		addSVGPath(className, d) {
			const path = scope.addSVGElement(
				mkSVG('path', { class: className }) as SVGPathElement,
			);
			if (typeof d === 'function') {
				updaters.push(() => path.setAttribute('d', d() ?? ''));
			} else {
				path.setAttribute('d', d ?? '');
			}
			return path;
		},
		addHandle(className, initial) {
			const handle = mk('div', { class: 'ctl ' + className });
			playground.append(handle);
			return grabbable(handle, update, initial);
		},
		addDragHandler(begin, move, cancel) {
			const handler = new DragHandler(hold, 1, 1, begin, move, cancel);
			hold.addEventListener('pointerdown', handler.begin);
		},
		addUpdateFn(fn) {
			updaters.push(fn);
		},
		computed(fn) {
			const r = { current: fn() };
			updaters.push(() => {
				r.current = fn();
			});
			return r;
		},
	};

	fn(scope);
	update();

	return hold;
}

export function mk(
	type: string,
	attrs: Record<string, string | number> = {},
	children: (string | Element)[] = [],
) {
	const o: HTMLElement = document.createElement(type);
	for (const k in attrs) {
		o.setAttribute(k, String(attrs[k]));
	}
	o.append(...children);
	return o;
}

export function mkSVG(
	type: string,
	attrs: Record<string, string | number> = {},
	children: (string | Element)[] = [],
) {
	const o: SVGElement = document.createElementNS(
		'http://www.w3.org/2000/svg',
		type,
	);
	for (const k in attrs) {
		o.setAttribute(k, String(attrs[k]));
	}
	o.append(...children);
	return o;
}
