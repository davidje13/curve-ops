import {
	aaBoxSVG,
	bezier3Bounds,
	bezier3FromPts,
	bezier3SVG,
} from '../../index.mts';

const curve = bezier3FromPts(
	{ x: 50, y: 50 },
	{ x: 500, y: 450 },
	{ x: 0, y: 400 },
	{ x: 300, y: 100 },
);
const bounds = bezier3Bounds(curve);

const SVGNS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(SVGNS, 'svg');
svg.setAttribute('version', '1.1');
svg.setAttribute('viewBox', '0 0 500 500');
svg.setAttribute('width', '500');
svg.setAttribute('height', '500');
document.body.append(svg);

const bbPath = document.createElementNS(SVGNS, 'path');
bbPath.setAttribute('stroke', 'green');
bbPath.setAttribute('fill', 'none');
bbPath.setAttribute('d', aaBoxSVG(bounds));
svg.append(bbPath);

const curvePath = document.createElementNS(SVGNS, 'path');
curvePath.setAttribute('stroke', 'black');
curvePath.setAttribute('fill', 'none');
curvePath.setAttribute('d', bezier3SVG(curve));
svg.append(curvePath);
