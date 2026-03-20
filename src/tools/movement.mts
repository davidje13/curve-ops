import { ptDist2, type Pt } from '../index.mts';

export function movementThrottle(
	onBegin: ((pt: Pt) => void) | null | undefined,
	onMove: (from: Pt, to: Pt, done: boolean) => void,
	onCancel: (() => void) | null | undefined,
	movementThreshold: number,
	throttleTime = -1,
) {
	const tDD = movementThreshold * movementThreshold;
	const allowThrottle = throttleTime >= 0;
	return (pt0: Pt) => {
		if (onBegin) {
			onBegin(pt0);
		} else {
			onMove(pt0, pt0, false);
		}
		let prev = pt0;
		let latest = pt0;
		let tm: number | undefined;
		const send = () => {
			tm = undefined;
			onMove(prev, latest, false);
			prev = latest;
		};
		return {
			move: (pt: Pt, done = false) => {
				const dd = ptDist2(prev, pt);
				if (dd > tDD || done) {
					if (tm) {
						clearTimeout(tm);
						tm = undefined;
					}
					onMove(prev, pt, done);
					prev = pt;
				} else if (allowThrottle) {
					latest = pt;
					if (dd && !tm) {
						tm = setTimeout(send, throttleTime);
					}
				}
			},
			cancel: () => {
				clearTimeout(tm);
				onCancel?.();
			},
		};
	};
}
