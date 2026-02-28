import type { ReactElement } from "react";

const SIDE_COLORS = ["#E53935", "#1565C0", "#2E7D32", "#F9A825", "#7B1FA2", "#EF6C00"];
const CORNER_R = 5;

function Corner({ x, y, color }: { x: number; y: number; color: string }) {
  return <circle cx={x} cy={y} r={CORNER_R} fill={color} stroke="#fff" strokeWidth={1.5} />;
}

function sides(pts: [number, number][], closed = true) {
  const segs: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  const count = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < count; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    segs.push({ x1, y1, x2, y2, color: SIDE_COLORS[i % SIDE_COLORS.length] });
  }
  return segs;
}

function corners(pts: [number, number][]) {
  return pts.map(([x, y], i) => ({ x, y, color: SIDE_COLORS[i % SIDE_COLORS.length] }));
}

const shapes: Record<string, () => ReactElement> = {
  Circle: () => (
    <svg viewBox="0 0 120 120" className="shape-svg">
      <circle cx={60} cy={60} r={48} fill="none" stroke="#E53935" strokeWidth={5} />
    </svg>
  ),

  Oval: () => (
    <svg viewBox="0 0 140 100" className="shape-svg">
      <ellipse cx={70} cy={50} rx={58} ry={38} fill="none" stroke="#EF6C00" strokeWidth={5} />
    </svg>
  ),

  Triangle: () => {
    const pts: [number, number][] = [[60, 10], [110, 95], [10, 95]];
    const s = sides(pts);
    const c = corners(pts);
    return (
      <svg viewBox="0 0 120 110" className="shape-svg">
        {s.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth={5} strokeLinecap="round" />
        ))}
        {c.map((pt, i) => <Corner key={i} x={pt.x} y={pt.y} color={pt.color} />)}
      </svg>
    );
  },

  Square: () => {
    const pts: [number, number][] = [[15, 15], [105, 15], [105, 105], [15, 105]];
    const s = sides(pts);
    const c = corners(pts);
    return (
      <svg viewBox="0 0 120 120" className="shape-svg">
        {s.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth={5} strokeLinecap="round" />
        ))}
        {c.map((pt, i) => <Corner key={i} x={pt.x} y={pt.y} color={pt.color} />)}
      </svg>
    );
  },

  Rectangle: () => {
    const pts: [number, number][] = [[10, 25], [130, 25], [130, 95], [10, 95]];
    const s = sides(pts);
    const c = corners(pts);
    return (
      <svg viewBox="0 0 140 120" className="shape-svg">
        {s.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth={5} strokeLinecap="round" />
        ))}
        {c.map((pt, i) => <Corner key={i} x={pt.x} y={pt.y} color={pt.color} />)}
      </svg>
    );
  },

  Diamond: () => {
    const pts: [number, number][] = [[60, 8], [112, 60], [60, 112], [8, 60]];
    const s = sides(pts);
    const c = corners(pts);
    return (
      <svg viewBox="0 0 120 120" className="shape-svg">
        {s.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth={5} strokeLinecap="round" />
        ))}
        {c.map((pt, i) => <Corner key={i} x={pt.x} y={pt.y} color={pt.color} />)}
      </svg>
    );
  },

  Star: () => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      pts.push([60 + 50 * Math.cos(angle), 60 + 50 * Math.sin(angle)]);
      const inner = ((i * 72) + 36 - 90) * Math.PI / 180;
      pts.push([60 + 22 * Math.cos(inner), 60 + 22 * Math.sin(inner)]);
    }
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";
    return (
      <svg viewBox="0 0 120 120" className="shape-svg">
        <path d={d} fill="none" stroke="#F9A825" strokeWidth={4} strokeLinejoin="round" />
        {[0, 2, 4, 6, 8].map((idx) => (
          <Corner key={idx} x={pts[idx][0]} y={pts[idx][1]} color={SIDE_COLORS[idx / 2]} />
        ))}
      </svg>
    );
  },

  Heart: () => (
    <svg viewBox="0 0 120 120" className="shape-svg">
      <path
        d="M60,100 C20,70 0,40 20,20 C35,5 55,15 60,35 C65,15 85,5 100,20 C120,40 100,70 60,100Z"
        fill="none" stroke="#E91E63" strokeWidth={4} strokeLinejoin="round"
      />
    </svg>
  ),

  Crescent: () => (
    <svg viewBox="0 0 120 120" className="shape-svg">
      <path
        d="M70,10 A50,50 0 1,1 70,110 A35,35 0 1,0 70,10Z"
        fill="none" stroke="#5C6BC0" strokeWidth={4}
      />
    </svg>
  ),

  Cross: () => {
    const pts: [number, number][] = [
      [45, 10], [75, 10], [75, 45], [110, 45], [110, 75], [75, 75],
      [75, 110], [45, 110], [45, 75], [10, 75], [10, 45], [45, 45],
    ];
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";
    return (
      <svg viewBox="0 0 120 120" className="shape-svg">
        <path d={d} fill="none" stroke="#00897B" strokeWidth={4} strokeLinejoin="round" />
        {pts.map(([x, y], i) => <Corner key={i} x={x} y={y} color={SIDE_COLORS[i % SIDE_COLORS.length]} />)}
      </svg>
    );
  },
};

export default function ShapeSVG({ name }: { name: string }) {
  const Shape = shapes[name];
  return Shape ? <Shape /> : null;
}
