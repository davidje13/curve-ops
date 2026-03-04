import type { Pt } from '../index.mts';

export class DragHandler {
	declare private _state: { id: number; target: HTMLElement } | undefined;

	constructor(
		private readonly pointRegion: HTMLElement | SVGElement,
		private readonly w: number,
		private readonly h: number,
		private readonly onBegin: (pt: Pt) => void,
		private readonly onMove: (pt: Pt, end: boolean) => void,
		private readonly onCancel: () => void,
	) {}

	detach() {
		if (!this._state) {
			return;
		}
		const o = this._state.target;
		o.releasePointerCapture(this._state.id);
		o.ownerDocument.documentElement.style.cursor = '';
		o.removeEventListener('pointerup', this.stop);
		o.removeEventListener('pointermove', this.move);
		o.removeEventListener('pointercancel', this.cancel);
		this._state = undefined;
	}

	toPt(e: PointerEvent) {
		const p = this.pointRegion;
		const b = p.getBoundingClientRect();
		return {
			x: ((e.clientX - b.left - p.clientLeft) * this.w) / p.clientWidth,
			y: ((e.clientY - b.top - p.clientTop) * this.h) / p.clientHeight,
		};
	}

	begin = (e: PointerEvent) => {
		if (this._state || !e.isPrimary || e.button !== 0) {
			return;
		}
		const id = e.pointerId;
		const o = e.currentTarget as HTMLElement;

		this._state = { id, target: o };

		o.addEventListener('pointerup', this.stop);
		o.addEventListener('pointermove', this.move);
		o.addEventListener('pointercancel', this.cancel);
		o.setPointerCapture(id);
		e.preventDefault();

		// work around Safari not locking cursor when using setPointerCapture
		o.ownerDocument.documentElement.style.cursor = o.style.cursor;

		this.onBegin(this.toPt(e));
	};

	move = (e: PointerEvent) => {
		if (e.pointerId === this._state?.id) {
			this.onMove(this.toPt(e), false);
		}
	};

	stop = (e: PointerEvent) => {
		if (e.pointerId === this._state?.id) {
			this.detach();
			this.onMove(this.toPt(e), true);
		}
	};

	cancel = (e: PointerEvent) => {
		if (e.pointerId === this._state?.id) {
			this.detach();
			this.onCancel();
		}
	};
}
