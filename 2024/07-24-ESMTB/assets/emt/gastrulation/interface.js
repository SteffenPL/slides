var $ = function (id) {
  return document.getElementById(id);
};

const params = {
  general: {
    t_end: 48,
    dt: 0.1,
    random_seed: 0,
    N_init: 59,
    N_max: 80,
    N_emt: 19,
    w_init: 60, // ~ N_init * 1.5
    h_init: 5,
    mu: 0.2,
    n_substeps: 30,
    alg_dt: 0.01,
    w_screen: 70,
    h_screen: (70 * 1) / 5,
    p_div_out: 0.95, // cp. NC
  },
  cell_prop: {
    apical_junction_init: 1.5,
    max_basal_junction_dist: 1.0,
    basal_daming_ratio: 1.0,
    cytos_init: 1.5,
    diffusion: 0.1,
  },
  cell_types: {
    control: {
      name: "control",
      R_hard: 0.4,
      R_hard_div: 0.7,
      R_soft: 1.2,
      color: { r: 30, g: 100, b: 20 },
      dur_G2: 0.5,
      dur_mitosis: 0.5,
      k_apical_junction: 1.0,
      k_cytos: 5.0,
      max_cytoskeleton_length: 3.7,
      run: 0.0,
      running_speed: 1.0,
      running_mode: 0,
      stiffness_apical_apical: 2.0,
      stiffness_apical_apical_div: 4.0,
      stiffness_nuclei_apical: 3.0,
      stiffness_nuclei_basal: 2.0,
      stiffness_repulsion: 4.0,
      stiffness_straightness: 15.0,
      lifespan: { min: 5.5, max: 6.5 },
      INM: 1.0,
      hetero: false,
      events: {
        time_A: { min: Infinity, max: Infinity },
        time_B: { min: Infinity, max: Infinity },
        time_S: { min: Infinity, max: Infinity },
        time_P: { min: Infinity, max: Infinity },
      },
    },
    emt: {
      name: "emt",
      R_hard: 0.4,
      R_hard_div: 0.7,
      R_soft: 1.2,
      color: { r: 128, g: 0, b: 128 },
      dur_G2: 0.5,
      dur_mitosis: 0.5,
      k_apical_junction: 1.0,
      k_cytos: 5.0,
      max_cytoskeleton_length: 3.7,
      run: 0.0,
      running_speed: 1.0,
      running_mode: 0,
      stiffness_apical_apical: 2.0,
      stiffness_apical_apical_div: 4.0,
      stiffness_nuclei_apical: 3.0,
      stiffness_nuclei_basal: 2.0,
      stiffness_repulsion: 4.0,
      stiffness_straightness: 15.0,
      lifespan: { min: 5.5, max: 6.5 },
      INM: 1.0,
      hetero: false,
      events: {
        time_A: { min: Infinity, max: Infinity },
        time_B: { min: 6, max: 24 },
        time_S: { min: Infinity, max: Infinity },
        time_P: { min: Infinity, max: Infinity },
      },
    },
  },
};

function init_display(s) {
  const pg = params.general;
  const emt = params.cell_types.emt;

  function update_label(t, el) {
    if (t < pg.t_end && !emt.hetero)
      el.style = "left: " + String((t / pg.t_end) * 100) + "%; display: block;";
    else el.style = "display: none;";
  }

  update_label(emt.events.time_A.min, p_A);
  update_label(emt.events.time_B.min, p_B);
  update_label(emt.events.time_S.min, p_S);

  if (emt.run > 0) p_B.innerHTML = "B(p)";
  else p_B.innerHTML = "B";

  p_sim_end.style = "display:none;";
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
  p_prog.style = "width: " + String((s.t / params.general.t_end) * 100) + "%";

  if (s.cells.length == params.general.N_max) {
    p.fill(0, 0, 0);
    p.text(
      "Maximal number of cells reached. Cell division inactive.",
      -pg.w_screen / 2 + 4,
      0.2 * pg.h_screen
    );
  }

  if (s.t > pg.t_end) {
    p_sim_end.style = "display:block;";
  }
}

let inputs = {
  params: params,
  init_display: init_display,
  update_display: update_display,
  screen_size: { w: 1000.0, h: 200.0 },
};

let sim_emt_p5 = new p5((p) => sim_emt(p, inputs, $("sim_div")), "sim_div");

function controlFromHtml() {
  const pg = params.general;
  const epi = params.cell_types.control;
  const ps = params.cell_types.emt;

  ps.events.time_B = !$("ps_attached").checked
    ? { min: 6, max: 24 }
    : { min: Infinity, max: Infinity };

  ps.lifespan = $("ps_cc_duration") ? { min: 5.5, max: 6.5 } : { min: 2.5, max: 3.5}
  epi.lifespan = $("epi_cc_duration") ? { min: 5.5, max: 6.5 } : { min: 2.5, max: 3.5}

  ps.dur_G2 = $("epi_div_duration") ? 0.5 : 0.25
  epi.dur_G2 = $("epi_div_duration") ? 0.5 : 0.25

  ps.dur_mitosis = $("epi_div_duration") ? 0.5 : 0.25
  epi.dur_mitosis = $("epi_div_duration") ? 0.5 : 0.25

  // get value of  epi_contract radio inputs 
  let epi_contract_value = JSON.parse(document.querySelector('input[name="epi_contract"]:checked').value);
  let ps_contract_value = JSON.parse(document.querySelector('input[name="ps_contract"]:checked').value);
  
  epi.stiffness_nuclei_apical = epi_contract_value[0];
  epi.stiffness_nuclei_basal = epi_contract_value[1];
  epi.stiffness_apical_apical = epi_contract_value[2];

  ps.stiffness_nuclei_apical = ps_contract_value[0];
  ps.stiffness_nuclei_basal = ps_contract_value[1];
  ps.stiffness_apical_apical = ps_contract_value[2];


  $("epi_aa").innerHTML = epi.stiffness_apical_apical;
  $("epi_aN").innerHTML = epi.stiffness_nuclei_apical;
  $("epi_bN").innerHTML = epi.stiffness_nuclei_basal;

  $("ps_aa").innerHTML = ps.stiffness_apical_apical;
  $("ps_aN").innerHTML = ps.stiffness_nuclei_apical;
  $("ps_bN").innerHTML = ps.stiffness_nuclei_basal;


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

$("ps_attached").addEventListener("change", controlFromHtml);
$("ps_cc_duration").addEventListener("change", controlFromHtml);
$("epi_cc_duration").addEventListener("change", controlFromHtml);
$("ps_div_duration").addEventListener("change", controlFromHtml);
$("epi_div_duration").addEventListener("change", controlFromHtml);
$("epi_ct_all").addEventListener("click", controlFromHtml);
$("ps_ct_all").addEventListener("click", controlFromHtml);
$("epi_ct_inm").addEventListener("click", controlFromHtml);
$("ps_ct_inm").addEventListener("click", controlFromHtml);
$("epi_ct_api").addEventListener("click", controlFromHtml);
$("ps_ct_api").addEventListener("click", controlFromHtml);
$("epi_ct_ctrl").addEventListener("click", controlFromHtml);
$("ps_ct_ctrl").addEventListener("click", controlFromHtml);

$("reset").addEventListener("click", function () {
  $("ps_attached").checked = false;
  $("ps_cc_duration").checked = false;
  $("epi_cc_duration").checked = true;
  $("ps_div_duration").checked = true;
  $("epi_div_duration").checked = true;
  $("epi_ct_ctrl").checked = true;
  $("ps_ct_ctrl").checked = true;
  controlFromHtml();
});