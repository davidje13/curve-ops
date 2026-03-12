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
