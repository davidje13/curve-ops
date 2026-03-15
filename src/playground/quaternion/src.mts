import {
	mat3FromUnitQuat,
	matFromEyeTargetUp,
	matMul,
	matPadIdent,
	quatFromRotationAround,
	quatSlerp,
	quatSquad,
	vecFrom,
	vecNorm,
	type Matrix,
	type Quaternion,
	type Vector,
} from '../../index.mts';
import { makeInteractive } from '../dom.mts';

document.body.append(
	makeInteractive(({ addSVGPath, computed, update }) => {
		const q1 = quatFromRotationAround(vecNorm(vecFrom(1, 0, 0)), Math.PI * 0.5);
		const q2 = quatFromRotationAround(vecNorm(vecFrom(1, 0, 0)), Math.PI * 0.7);
		const q3 = quatFromRotationAround(
			vecNorm(vecFrom(1, -1, 1)),
			Math.PI * 0.9,
		);
		const q4 = quatFromRotationAround(
			vecNorm(vecFrom(1, -1, 1)),
			(Math.PI * 2) / 3,
		);
		const UNIT = vecFrom(0, 0, 1, 1);
		let r = 0;
		const view = computed(() =>
			matFromEyeTargetUp(
				vecFrom(Math.sin(r) * 4, Math.cos(r) * 4, 2),
				vecFrom(0, 0, 0),
				vecFrom(0, 0, 1),
			),
		);
		const guide: Vector<4>[] = [];
		const edges = 16;
		for (let i = 0; i <= edges / 4; ++i) {
			const a = (i * 2 * Math.PI) / edges;
			guide.push(vecFrom(Math.sin(a), Math.cos(a), 0, 1));
		}
		for (let i = 1; i <= edges; ++i) {
			const a = (i * 2 * Math.PI) / edges;
			guide.push(vecFrom(Math.cos(a), 0, Math.sin(a), 1));
		}
		for (let i = edges / 4; i <= edges; ++i) {
			const a = (i * 2 * Math.PI) / edges;
			guide.push(vecFrom(Math.sin(a), Math.cos(a), 0, 1));
		}
		for (let i = 1; i <= edges; ++i) {
			const a = (i * 2 * Math.PI) / edges;
			guide.push(vecFrom(0, Math.cos(a), Math.sin(a), 1));
		}
		addSVGPath('ctl', () => pathFromPoints(guide, view.current));

		const ctlLine = computed(() => [
			...pointsFromRotations(UNIT, (t) => quatSlerp(q1, q2, t)),
			...pointsFromRotations(UNIT, (t) => quatSlerp(q2, q3, t)),
			...pointsFromRotations(UNIT, (t) => quatSlerp(q3, q4, t)),
		]);
		addSVGPath('ctl', () => pathFromPoints(ctlLine.current, view.current));

		const slerpLine = computed(() =>
			pointsFromRotations(UNIT, (t) => quatSlerp(q1, q4, t)),
		);
		addSVGPath('red', () => pathFromPoints(slerpLine.current, view.current));

		const squadLine = computed(() =>
			pointsFromRotations(UNIT, (t) => quatSquad(q1, q2, q3, q4, t)),
		);
		addSVGPath('blue', () => pathFromPoints(squadLine.current, view.current));

		function step() {
			r = (Date.now() * Math.PI) / 5000;
			update();
			requestAnimationFrame(step);
		}
		requestAnimationFrame(step);
	}),
);

function pathFromPoints(pts: Vector<4>[], view: Matrix<4, 4>) {
	const r: string[] = [];
	for (const pt of pts) {
		const {
			v: [x, y],
		} = matMul(pt, view);
		r.push(`${x * 0.4 + 0.5} ${y * 0.4 + 0.5}`);
	}
	return 'M' + r.join('L');
}

function pointsFromRotations(unit: Vector<4>, fn: (t: number) => Quaternion) {
	const r: Vector<4>[] = [];
	const N = 30;
	for (let i = 0; i <= N; ++i) {
		const t = i / N;
		const rotation = matPadIdent(mat3FromUnitQuat(fn(t)), 4);
		r.push(matMul(unit, rotation));
	}
	return r;
}
