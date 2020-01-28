import rawSleepData from "./data/sleep.json";

const allKeys = ["wake", "light", "rem", "deep"];

const totalMinutes = e => allKeys.reduce((p, k) => p + e.summary[k].minutes, 0)

const sleepData = rawSleepData
  .filter(e => !!e.summary.wake)
  // Less than 5.5 hours 
  .filter(e => totalMinutes(e) > 330)
  // More than 11 hours
  .filter(e => totalMinutes(e) < 660)
  .reverse();

const round = n => v => Number(v.toFixed(n));

function getY(key, type, days) {
  if (type === "abs") {
    return sleepData.reduce(
      ({ y, q }, e) => {
        const v = e.summary[key].minutes;
        if (q.length === days) q.shift();
        q.push(v);
        const avg = q.reduce((p, c) => p + c, 0) / q.length;
        y.push(avg);
        return { y, q };
      },
      { y: [], q: [] }
    ).y;
  } else if (type === "perc") {
    return sleepData.reduce(
      ({ y, q }, e) => {
        const sum = totalMinutes(e);
        const v = (e.summary[key].minutes / sum) * 100;
        if (q.length === days) q.shift();
        q.push(v);
        const avg = q.reduce((p, c) => p + c, 0) / q.length;
        y.push(avg);
        return { y, q };
      },
      { y: [], q: [] }
    ).y;
  } else {
    throw Error(`Unknown type ${type}`);
  }
}

function getColor(type) {
  switch (type) {
    case "wake":
      return "hsla(360, 82%, 75%, 1)";
    case "rem":
      return "hsla(124, 72%, 67%, 1)";
    case "light":
      return "hsla(216, 65%, 67%, 1)";
    case "deep":
      return "rgba(24, 36, 114, 1)";
    default:
      throw Error(`Unknown type ${type}`);
  }
}

const createTrace = type => key => {
  const y = getY(key, type, globalRange).map(round(0));

  const trace = {
    name: key,
    x: sleepData.map(e => e.date),
    y,
    mode: "lines",
    line: {
      color: getColor(key)
    }
  };

  return trace;
};

function drawChart() {
  const chart = document.getElementById("chart");

  const traces = allKeys.map(createTrace(globalType));

  const layout = {
    title: "Sleep",
    yaxis: { title: `Time in zone (${globalType === "abs" ? "min" : "%"})` }
  };
  Plotly.newPlot(chart, traces, layout);
}

let globalType = "abs";
let globalRange = 1;

function setup() {
  document.querySelectorAll(".chartTypeButton").forEach(btn => {
    const text = btn.textContent;
    btn.classList.remove("active");
    if (text === globalType) btn.classList.add("active");
    btn.onclick = () => {
      globalType = text;
      setup();
    };
  });
  document.querySelectorAll(".rangeButton").forEach(btn => {
    const text = btn.textContent;
    const n = Number(text.slice(0, text.length - 1));
    btn.classList.remove("active");
    if (n === globalRange) btn.classList.add("active");
    btn.onclick = () => {
      globalRange = n;
      setup();
    };
  });
  drawChart();
}

window.onload = () => {
  setup();
};

window.onresize = () => {
  Plotly.Plots.resize(gd);
};
