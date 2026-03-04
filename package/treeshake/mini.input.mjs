import { CurveDrawer } from 'curve-ops';

// This is a minimal realistic user of curve-ops, so
// dead code analysis / tree shaking should be able to
// generate a very small bundle.

const draw = new CurveDrawer(
	console.log,
	console.log,
	console.log,
	() => console.log('done'),
	() => console.log('cancel'),
	5,
	100,
	0.01,
	0.02,
);
draw.begin({ x: 0, y: 0 });
draw.draw({ x: 10, y: 10 });
draw.draw({ x: 20, y: 20 }, true);
