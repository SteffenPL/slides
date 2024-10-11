const pv = p5.Vector;

//import { scaleCanvas } from "./p5utils.js";

/* Helper functions */
function scaleCanvas(P, p) {
  // we fit a rectangle of w x h into the canvas
  const ratioX = P.width / p.w;
  const ratioY = P.height / p.h;
  if (ratioX < ratioY) {
    P.translate(0, (P.height - p.h * ratioX) / 2);
    P.scale(ratioX, ratioX);
  } else {
    P.translate((P.width - p.w * ratioY) / 2, 0);
    P.scale(ratioY, ratioY);
  }
  P.translate(p.coord_center.x, p.coord_center.y);
}

/** This is the main interface with tweakpane */
const p = {
  dt: 0.2,
  log_dt: -1,
  N: 30,
  R: 5.0,
  alpha: 3,
  dt_frame: 0.1,
  alg: 0, // 0: pbd, 1: xpbd, 2: penalty
  penalty_strength: 1.5,

  /** Some constants which are not subject to change! */
  w: 100, // physical units of the width
  h: 100, // physical units of the height
  coord_center: { x: 0, y: 0 }, // physical center of the canvas
};

const simulation = function (P) {
  /** export functions for external use */
  P.setup = setup;
  P.draw = draw;
  P.init = init;

  /** This is a setup function. */
  function setup() {
    P.createCanvas(500, 400);
    init();
  }

  /** A second dict witch holds the current simulation state */
  let s = {};

  function randomPos() {
    return P.createVector(P.random() * p.w, P.random() * p.h);
  }

  /** Init the simulation state. */
  function init() {
    s.t = 0.0;

    s.cells = [];
    for (let i = 0; i < p.N; i++) {
      s.cells.push({
        pos: randomPos(),
        vel: P.createVector(0, 0),
        dx: P.createVector(0, 0),
        R: p.R,
      });
    }
  }

  function projectCellCell(c1, c2) {
    const d = pv.sub(c2.pos, c1.pos);
    const l = d.mag();

    if (l > c1.R + c2.R) {
      return;
    }

    const n = d.copy().normalize();
    const f = l - c1.R - c2.R;
    const f1 = f * 0.5;
    c1.pos.add(n.mult(f1));
    c2.pos.add(n.mult(-1));
  }

  let draw_t = 0.0;

  /** This is a draw function. */
  function draw() {
    s.t += p.dt;
    draw_t += p.dt;

    for (let i = 0; i < s.cells.length; i++) {
      const c = s.cells[i];

      // compute forces (intro variable dx)
      c.dx.set(c.pos);
      c.dx.x -= 50;
      c.dx.y -= 50;
      c.dx.mult(-0.01 * p.alpha);
    }

    if (p.alg == 2) {
      for (let i = 0; i < s.cells.length; i++) {
        const ci = s.cells[i];
        for (let j = i + 1; j < s.cells.length; j++) {
          const cj = s.cells[j];
          const d = pv.sub(ci.pos, cj.pos);
          const l = d.mag();

          if (l < ci.R + cj.R) {
            const n = d.copy().normalize();
            const f = l - ci.R - cj.R;
            const f1 = -f * p.penalty_strength;
            ci.dx.add(n.mult(f1));
            cj.dx.add(n.mult(-1));
          }
        }
      }
    }

    for (let i = 0; i < s.cells.length; i++) {
      const c = s.cells[i];

      // update the position
      c.dx.mult(p.dt);
      c.pos.add(c.dx);
    }

    if (p.alg == 0) {
      for (let i = 0; i < s.cells.length; i++) {
        const c = s.cells[i];
        for (let j = i + 1; j < s.cells.length; j++) {
          projectCellCell(c, s.cells[j]);
        }
      }
    }

    let overlap = 0.0;
    for (let i = 0; i < s.cells.length; i++) {
      const ci = s.cells[i];
      for (let j = i + 1; j < s.cells.length; j++) {
        const cj = s.cells[j];
        const d = pv.dist(ci.pos, cj.pos);
        if (d < ci.R + cj.R) overlap += ci.R + cj.R - d;
      }
    }

    if (draw_t > p.dt_frame) {
      scaleCanvas(P, p);
      P.background(255);
      
      // draw the cells
      P.fill(0);
      P.stroke(0, 0, 0, 0);
      P.strokeWeight(0);
      for (let i = 0; i < s.cells.length; i++) {
        const c = s.cells[i];
        const irel = P.round((i / s.cells.length) * 128);
        P.fill(irel, 128 - irel, irel);
        P.circle(c.pos.x, c.pos.y, 2 * c.R);
      }

      P.stroke(200, 20, 20);
      P.strokeWeight(2);
      P.line(5, 5, 5 + (p.w * overlap) / p.N, 5);

      P.strokeWeight(0);
      P.textSize(5);
      P.fill(200, 20, 20);
      P.text("overlap: " + overlap.toFixed(1), 10, 12);
      
      P.fill(20, 20, 20);
      if (p.alg == 0) {
        P.text("PBD", 80, 12);
      } else if (p.alg == 1) {
        P.text("XPBD", 80, 12);
      } else if (p.alg == 2) {
        P.text("Penalty", 80, 12);
      }


      draw_t = 0.0;
    }
  }
};
