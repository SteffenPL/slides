
var $ = function (id) { return document.getElementById(id); };

const params = {
  general: {
    t_end: 48,
    dt: 0.1,
    random_seed: 0,
    init_basal_junction_dist: 0.3,
    N_init: 30,
    N_max: 80,
    N_emt: 1,
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

    function update_label(t, el) {
      if( t < pg.t_end && !emt.hetero )
        el.style = "left: " + String(t / pg.t_end * 100) + "%";
    else
        el.style = "display: none;"
    } 

    update_label(emt.events.time_A.min, p_A);
    update_label(emt.events.time_B.min, p_B);
    update_label(emt.events.time_S.min, p_S);

    if( emt.run > 0 )
        p_B.innerHTML  = "B(p)"
    else
        p_B.innerHTML  = "B"

    p_sim_end.style = "display:none;"

    // update timing table: 

    let j = 0; 
    p_info.innerHTML = '';
    for(let i = 0; i < s.cells.length; ++i) {
        if( s.cells[i].type.name == 'emt' ) {
            const A = s.cells[i].time_A;
            const B = s.cells[i].time_B;
            const S = s.cells[i].time_S;
            const P = s.cells[i].time_P;
            const row_s = '<td class="px-6 py-2 font-medium">' + String(j+1) + '</td>' +
                        '<td class="px-6 py-2 font-medium">' + (A < Infinity ? A.toFixed(1)+"h" : "") + '</td>' +
                        '<td class="px-6 py-2 font-medium">' + (B < Infinity ? B.toFixed(1)+"h" : "") + '</td>' +
                        '<td class="px-6 py-2 font-medium">' + (S < Infinity ? S.toFixed(1)+"h" : "") + '</td>' +
                        '<td class="px-6 py-2 font-medium">' + (s.cells[i].has_inm ? "Yes" : "") + '</td>' +
                        '<td class="px-6 py-2 font-medium">' + (P*B < Infinity ? "Yes" : "") + '</td>';

            if( j < p_info.rows.length ) {
                const row = p_info.rows[j];
                row.innerHTML = row_s;
            }
            else {
                const row = p_info.insertRow(-1);
                row.innerHTML = row_s;
            }
            j += 1;
        }
    }

    for(let i = j; i < 11; ++i) {
        if( i < p_info.rows.length ) {
            const row = p_info.rows[i];
            row.innerHTML =  '<td class="px-6 py-2 font-medium">' + String(i+1) + '</td>';
        }
        else {
            const row = p_info.insertRow(-1);
            row.innerHTML =  '<td class="px-6 py-2 font-medium">' + String(i+1) + '</td>';
        }
    }
}

const p_time = $("time");
const p_prog = $("progress_bar");
const p_A = $("A_time");
const p_B = $("B_time");
const p_S = $("S_time");
const p_sim_end = $("sim_end");
const p_info = $("timing_table");

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

  let hetero = $("hetero_input").checked;

  if (hetero) {
    pg.N_emt = 11;
    pg.N_init = pg.N_emt + 35;

    emt.INM = parseFloat($("INM_input_hetero").value) / 2.0
    emt.run = parseFloat($("run_input_hetero").value) / 2.0
    emt.hetero = true;

    emt.events.time_A = {min: 6, max: 24};
    emt.events.time_B = {min: 6, max: 24};
    emt.events.time_S = {min: 6, max: 24};
    emt.events.time_P = {min: 6, max: 24};

    // timings are always the same rage: 
  }
  else {
    let N_cases = parseInt($("N_input").value);
    if (N_cases == 0) {
      pg.N_emt = 0;
    } else if (N_cases == 1) {
      pg.N_emt = 1;
    } else {
      pg.N_emt = 11;
    }
    pg.N_init = pg.N_emt + 35;

    emt.INM = $("INM_input_homo").checked ? 1.0 : 0.0;
    emt.run = $("run_input_homo").checked ? 1.0 : 0.0;

    const emt_sc = $("EMT_scenario");
    var emt_times = JSON.parse(emt_sc.options[emt_sc.selectedIndex].value);
    // replace in emt_times = 0 with Infinity
    for (let i = 0; i < emt_times.length; i++) {
      if (emt_times[i] == 0) {
        emt_times[i] = Infinity;
      }
    }

    let A = emt_times[0];
    let B = emt_times[1];
    let S = emt_times[2];
    let P = B;

    emt.events.time_A = {min: A, max: A+0.05};
    emt.events.time_B = {min: B, max: B+0.05};
    emt.events.time_S = {min: S, max: S+0.05};
    emt.events.time_B = {min: P, max: P+0.05};
  }

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


$("hetero_input")
  .addEventListener("change", function () {
    let hetero = this.checked;
    if (hetero) {
      $("N_hetero").style.display = "block";
      $("N_homo").style.display = "none";
      $("INM_hetero").style.display = "block";
      $("INM_homo").style.display = "none";
      $("run_hetero").style.display = "block";
      $("run_homo").style.display = "none";
      $("scenario_div_hetero").style.display = "block";
      $("scenario_div_homo").style.display = "none";

      //$("INM_input_hetero").value = ($("INM_input_homo").checked ? 1.0 : 0.0 )
      //$("run_input_hetero").value = ($("run_input_homo").checked ? 1.0 : 0.0 )
    }
    else {
      $("N_hetero").style.display = "none";
      $("N_homo").style.display = "block";
      $("INM_hetero").style.display = "none";
      $("INM_homo").style.display = "block";
      $("run_hetero").style.display = "none";
      $("run_homo").style.display = "block";
      $("scenario_div_hetero").style.display = "none";
      $("scenario_div_homo").style.display = "block";

      //$("INM_input_homo").checked = (parseFloat($("INM_input_hetero").value) < 0.5 ? false : true )
      //$("run_input_homo").checked = (parseFloat($("run_input_hetero").value) < 0.5 ? false : true )
    }

    controlFromHtml();
  });

$("N_input")
  .addEventListener("change", function () {
    controlFromHtml();
  });

$("INM_input_hetero")
  .addEventListener("change", function () {
    controlFromHtml();
  });

$("INM_input_homo")
  .addEventListener("change", function () {
    controlFromHtml();
  });

$("run_input_hetero")
  .addEventListener("change", function () {
    controlFromHtml();
  });

$("run_input_homo")
  .addEventListener("change", function () {
    controlFromHtml();
  });

// load EMT scenario from html
$("EMT_scenario").addEventListener("change", function () {
  controlFromHtml();
});
