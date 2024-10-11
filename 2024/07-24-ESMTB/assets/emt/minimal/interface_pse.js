
var $ = function (id) { return document.getElementById(id); };

const params = {
  general: {
    t_end: 48,
    dt: 0.1,
    random_seed: 0,
    init_basal_junction_dist: 0.3,
    N_init: 30,
    N_max: 80,
    N_emt: 0,
    w_init: 8,
    h_init: 10,
    mu: 0.2,
    n_substeps: 30,
    alg_dt: 0.01,
    w_screen: 24,
    h_screen: 24 * 3/4,
    p_div_out: 0.8,
  },
  cell_prop: {
    apical_junction_init: 0.3,
    max_basal_junction_dist: 0.6,
    basal_daming_ratio: 1.0,
    cytos_init: 1.5,
    diffusion: 0.1,

  },
  cell_types: {
    control: {
      name: 'control',
      R_hard: 0.3,
      R_hard_div: 0.7,
      R_soft: 1.0,
      color: { r: 30, g: 100, b: 20 },
      dur_G2: 0.5,
      dur_mitosis: 0.5,
      k_apical_junction: 1.0,
      k_cytos: 5.0,
      max_cytoskeleton_length: Infinity,
      run: 0.0,
      running_speed: 1.0,
      running_mode: 0,
      stiffness_apical_apical: 5.0,
      stiffness_apical_apical_div: 10.0,
      stiffness_nuclei_apical: 2.0,
      stiffness_nuclei_basal: 2.0,
      stiffness_repulsion: 1.0,
      stiffness_straightness: 15.0,
      lifespan: { min: 10, max: 21 },
      INM: 1.0,
      hetero: false,
      events: {
        time_A: { min: Infinity, max: Infinity},
        time_B: { min: Infinity, max: Infinity},
        time_S: { min: Infinity, max: Infinity},
        time_P: { min: Infinity, max: Infinity },
      }
    },
    emt: {
      name: 'emt',
      R_hard: 0.3,
      R_hard_div: 0.7,
      R_soft: 1.0,
      color: { r: 150, g: 0, b: 0 },
      dur_G2: 0.5,
      dur_mitosis: 0.5,
      k_apical_junction: 1.0,
      k_cytos: 5.0,
      max_cytoskeleton_length: Infinity,
      run: 0.0,
      running_speed: 1.0,
      running_mode: 0,
      stiffness_apical_apical: 5.0,
      stiffness_apical_apical_div: 10.0,
      stiffness_nuclei_apical: 2.0,
      stiffness_nuclei_basal: 2.0,
      stiffness_repulsion: 1.0,
      stiffness_straightness: 15.0,
      lifespan: { min: 10, max: 21 },
      INM: 0.0,
      hetero: false,
      events: {
        time_A: { min: 6, max: 24 },
        time_B: { min: 6, max: 24 },
        time_S: { min: 6, max: 24 },
        time_P: { min: 6, max: 24 },
      }
    }
  }
}

function init_display(s) {
    const pg = params.general;
    const emt = params.cell_types.emt;  

    p_sim_end.style = "display:none;"

    // update timing table: 

}

const p_time = $("time");
const p_prog = $("progress_bar");

const p_sim_end = $("sim_end");

function update_display(p, s) {
    const pg = params.general;
    p_time.innerHTML = "" + String(s.t.toFixed(1)) + "h"; 
    p_prog.style = "width: " + String(s.t / params.general.t_end * 100) + "%";

    if( s.cells.length == params.general.N_max) {
         p.fill(0,0,0);
         p.text("Maximal number of cells reached. Cell division inactive.", -pg.w_screen/2 + 4, 0.2*pg.h_screen);
    }

    if( s.t > pg.t_end ) {
      p_sim_end.style = "display:block;"
    }
};

let inputs = {
  params: params,
  init_display: init_display,
  update_display: update_display,
  screen_size: { w: 1280.0, h: 960 }
};

let sim_emt_p5 = new p5(p => sim_emt(p, inputs, $('sim_div')), 'sim_div');

// pcontrol.run = false;
// pcontrol.INM = true;
// pcontrol.A = 9;
// pcontrol.B = 15;
// pcontrol.S = 21;
// pcontrol.N = 11;

function controlFromHtml() {

  const pg = params.general;
  const emt = params.cell_types.emt;

  sim_emt_p5.init();
}

controlFromHtml();

// when run_button is pressed, call sim_emt.init()
$("run_button").addEventListener("click", function () {
  sim_emt_p5.init();
});

$("play_button").addEventListener("click", function () {
  sim_emt_p5.pause();
});
