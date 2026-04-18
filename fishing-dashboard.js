const spots = [
  {
    name: "鈴鹿",
    area: "三重県",
    lat: 34.8403,
    lon: 136.5867,
    detail: "白子周辺の海岸を代表点として表示",
    tideUrl: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/suisan.php?stn=G3",
  },
  {
    name: "四日市",
    area: "三重県",
    lat: 34.9667,
    lon: 136.6333,
    detail: "四日市港の代表点",
    tideUrl: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/suisan.php?stn=G3",
  },
  {
    name: "長良川河口",
    area: "三重県",
    lat: 35.0217,
    lon: 136.7333,
    detail: "河口右岸寄りの代表点",
    tideUrl: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/suisan.php?stn=NG",
  },
  {
    name: "田原市赤羽",
    area: "愛知県",
    lat: 34.6064,
    lon: 137.1819,
    detail: "赤羽漁港の代表点",
    tideUrl: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php",
  },
  {
    name: "伊古部",
    area: "愛知県",
    lat: 34.655,
    lon: 137.365,
    detail: "伊古部海岸の代表点",
    tideUrl: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php",
  },
  {
    name: "浜名湖",
    area: "静岡県",
    lat: 34.6913,
    lon: 137.5926,
    detail: "弁天島付近の代表点",
    tideUrl: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php",
  },
  {
    name: "御前崎",
    area: "静岡県",
    lat: 34.617,
    lon: 138.217,
    detail: "御前崎港の代表点",
    tideUrl: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/suisan.php?stn=OM",
  },
  {
    name: "天竜川河口",
    area: "静岡県",
    lat: 34.6489,
    lon: 137.7925,
    detail: "河口周辺の代表点",
    tideUrl: "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php",
  },
];

const chartColors = {
  tide: "#0f766e",
  wave: "#2563eb",
  wind: "#ea580c",
  temp: "#dc2626",
};

const charts = new Map();
const spotState = new Map();
const grid = document.getElementById("spotGrid");
const template = document.getElementById("spotTemplate");
const lastUpdated = document.getElementById("lastUpdated");
const refreshButton = document.getElementById("refreshButton");
const filters = document.getElementById("filters");
const datePicker = document.getElementById("datePicker");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const moonInfo = document.getElementById("moonInfo");
const rangeInfo = document.getElementById("rangeInfo");

let selectedDate = "";
let minDate = "";
let maxDate = "";

function formatNumber(value, fractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return Number(value).toFixed(fractionDigits);
}

function weatherLabel(code) {
  const map = {
    0: "快晴",
    1: "晴れ",
    2: "薄曇り",
    3: "曇り",
    45: "霧",
    48: "霧氷",
    51: "弱い霧雨",
    53: "霧雨",
    55: "強い霧雨",
    61: "弱い雨",
    63: "雨",
    65: "強い雨",
    71: "弱い雪",
    73: "雪",
    75: "強い雪",
    80: "にわか雨",
    81: "強いにわか雨",
    82: "激しいにわか雨",
    95: "雷雨",
  };
  return map[code] || "変化あり";
}

function makeForecastUrl(spot) {
  const params = new URLSearchParams({
    latitude: spot.lat,
    longitude: spot.lon,
    timezone: "Asia/Tokyo",
    forecast_days: "7",
    current: "temperature_2m,wind_speed_10m,wind_direction_10m,weather_code",
    hourly:
      "temperature_2m,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function makeMarineUrl(spot) {
  const params = new URLSearchParams({
    latitude: spot.lat,
    longitude: spot.lon,
    timezone: "Asia/Tokyo",
    cell_selection: "sea",
    forecast_days: "7",
    current: "wave_height,wave_direction,wave_period,sea_level_height_msl",
    hourly: "wave_height,wave_direction,wave_period,sea_level_height_msl",
  });
  return `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;
}

function getDateKey(value) {
  return value.slice(0, 10);
}

function buildCard(spot) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.dataset.area = spot.area;
  node.querySelector(".area").textContent = spot.area;
  node.querySelector(".spot-name").textContent = spot.name;
  node.querySelector(".spot-meta").textContent = `${spot.detail} / ${spot.lat.toFixed(4)}, ${spot.lon.toFixed(4)}`;
  node.querySelector(".weather-link").href = makeForecastUrl(spot);
  node.querySelector(".tide-link").href = spot.tideUrl;
  grid.appendChild(node);
  return node;
}

function getMoonAge(dateString) {
  const baseNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const current = new Date(`${dateString}T12:00:00+09:00`).getTime();
  const synodicMonth = 29.53058867 * 24 * 60 * 60 * 1000;
  const diff = current - baseNewMoon;
  return ((diff % synodicMonth) + synodicMonth) % synodicMonth / (24 * 60 * 60 * 1000);
}

function getTideName(moonAge) {
  if (moonAge < 3 || moonAge >= 27) return "大潮";
  if (moonAge < 6) return "中潮";
  if (moonAge < 9) return "小潮";
  if (moonAge < 11) return "長潮";
  if (moonAge < 13) return "若潮";
  if (moonAge < 17) return "大潮";
  if (moonAge < 20) return "中潮";
  if (moonAge < 23) return "小潮";
  if (moonAge < 25) return "長潮";
  return "若潮";
}

function formatDateLong(dateString) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${dateString}T00:00:00+09:00`));
}

function updateMoonPanel() {
  const moonAge = getMoonAge(selectedDate);
  const tideName = getTideName(moonAge);
  selectedDateLabel.textContent = `表示日: ${formatDateLong(selectedDate)}`;
  moonInfo.textContent = `${tideName} / 月齢 ${formatNumber(moonAge, 1)}`;
  rangeInfo.textContent = `予報対象: ${minDate} から ${maxDate}`;
}

function combineData(weatherJson, marineJson) {
  const hourly = weatherJson.hourly.time.map((time, index) => ({
    time,
    dateKey: getDateKey(time),
    label: new Intl.DateTimeFormat("ja-JP", { hour: "numeric" }).format(new Date(time)),
    fullTime: new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(time)),
    tide: marineJson.hourly.sea_level_height_msl[index],
    wave: marineJson.hourly.wave_height[index],
    wind: weatherJson.hourly.wind_speed_10m[index],
    temp: weatherJson.hourly.temperature_2m[index],
    code: weatherJson.hourly.weather_code[index],
  }));

  return {
    hourly,
    current: {
      tide: marineJson.current.sea_level_height_msl,
      wave: marineJson.current.wave_height,
      wind: weatherJson.current.wind_speed_10m,
      temp: weatherJson.current.temperature_2m,
      code: weatherJson.current.weather_code,
    },
  };
}

function getDaySlice(hourly, dateString) {
  return hourly.filter((entry) => entry.dateKey === dateString).slice(0, 24);
}

function setError(card) {
  card.querySelector(".status-pill").textContent = "取得失敗";
  card.querySelector('[data-field="summary"]').textContent =
    "データ取得に失敗しました。通信状況を確認して再読み込みしてください。";
}

function updateMetrics(card, combined, daySlice) {
  card.querySelector('[data-field="tide"]').textContent = `${formatNumber(combined.current.tide)} m`;
  card.querySelector('[data-field="wave"]').textContent = `${formatNumber(combined.current.wave)} m`;
  card.querySelector('[data-field="wind"]').textContent = `${formatNumber(combined.current.wind)} m/s`;
  card.querySelector('[data-field="temp"]').textContent = `${formatNumber(combined.current.temp)} ℃`;
  card.querySelector(".status-pill").textContent = weatherLabel(combined.current.code);

  if (!daySlice.length) {
    card.querySelector('[data-field="summary"]').textContent = "この日の24時間データはまだありません。";
    return;
  }

  const waves = daySlice.map((item) => item.wave).filter(Number.isFinite);
  const winds = daySlice.map((item) => item.wind).filter(Number.isFinite);
  const tides = daySlice.map((item) => item.tide).filter(Number.isFinite);
  const temps = daySlice.map((item) => item.temp).filter(Number.isFinite);
  const dominant = weatherLabel(daySlice[Math.floor(daySlice.length / 2)].code);
  const moonAge = getMoonAge(selectedDate);
  const tideName = getTideName(moonAge);

  card.querySelector('[data-field="summary"]').textContent =
    `${selectedDate} / ${tideName} / 月齢 ${formatNumber(moonAge, 1)} / ` +
    `波高max ${formatNumber(Math.max(...waves), 1)}m / 風速max ${formatNumber(Math.max(...winds), 1)}m/s / ` +
    `気温 ${formatNumber(Math.min(...temps), 1)}-${formatNumber(Math.max(...temps), 1)}℃ / ` +
    `潮位差 ${formatNumber(Math.max(...tides) - Math.min(...tides), 2)}m / ${dominant}`;
}

function buildChart(card, spotName, daySlice) {
  const canvas = card.querySelector("canvas");
  const existing = charts.get(spotName);
  if (existing) {
    existing.destroy();
  }

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: daySlice.map((item) => item.label),
      datasets: [
        {
          label: "潮位近似 (m)",
          data: daySlice.map((item) => item.tide),
          borderColor: chartColors.tide,
          backgroundColor: chartColors.tide,
          pointRadius: 0,
          borderWidth: 1.8,
          yAxisID: "y",
          tension: 0.28,
        },
        {
          label: "波高 (m)",
          data: daySlice.map((item) => item.wave),
          borderColor: chartColors.wave,
          backgroundColor: chartColors.wave,
          pointRadius: 0,
          borderWidth: 1.8,
          yAxisID: "y",
          tension: 0.28,
        },
        {
          label: "風速 (m/s)",
          data: daySlice.map((item) => item.wind),
          borderColor: chartColors.wind,
          backgroundColor: chartColors.wind,
          pointRadius: 0,
          borderWidth: 1.8,
          yAxisID: "y1",
          tension: 0.22,
        },
        {
          label: "気温 (℃)",
          data: daySlice.map((item) => item.temp),
          borderColor: chartColors.temp,
          backgroundColor: chartColors.temp,
          pointRadius: 0,
          borderWidth: 1.8,
          yAxisID: "y2",
          tension: 0.22,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, boxWidth: 8, padding: 14 },
        },
        tooltip: {
          callbacks: {
            title(items) {
              return daySlice[items[0].dataIndex]?.fullTime || "";
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8, color: "#5a7184" },
          grid: { color: "rgba(15, 23, 42, 0.04)" },
        },
        y: {
          position: "left",
          ticks: { color: chartColors.wave },
          grid: { color: "rgba(15, 23, 42, 0.05)" },
        },
        y1: {
          position: "right",
          ticks: { color: chartColors.wind },
          grid: { drawOnChartArea: false },
        },
        y2: {
          position: "right",
          offset: true,
          ticks: { color: chartColors.temp },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });

  charts.set(spotName, chart);
}

function renderSpotCard(spot) {
  const state = spotState.get(spot.name);
  if (!state?.combined) {
    return;
  }

  const daySlice = getDaySlice(state.combined.hourly, selectedDate);
  updateMetrics(state.card, state.combined, daySlice);

  if (!daySlice.length) {
    state.card.querySelector(".status-pill").textContent = "対象外";
    state.card.querySelector('[data-field="summary"]').textContent = "選択日は予報範囲外です。";
    const existing = charts.get(spot.name);
    if (existing) {
      existing.destroy();
      charts.delete(spot.name);
    }
    return;
  }

  buildChart(state.card, spot.name, daySlice);
}

function renderSelectedDate() {
  updateMoonPanel();
  spots.forEach(renderSpotCard);
  applyFilter(document.querySelector(".filter.is-active")?.dataset.area || "all");
}

async function loadSpot(spot) {
  const state = spotState.get(spot.name);
  try {
    const [weatherRes, marineRes] = await Promise.all([fetch(makeForecastUrl(spot)), fetch(makeMarineUrl(spot))]);
    const [weatherJson, marineJson] = await Promise.all([weatherRes.json(), marineRes.json()]);
    state.combined = combineData(weatherJson, marineJson);
  } catch (error) {
    setError(state.card);
  }
}

function setupDateRangeFromState() {
  const firstLoaded = [...spotState.values()].find((entry) => entry.combined?.hourly?.length);
  if (!firstLoaded) {
    return;
  }

  minDate = getDateKey(firstLoaded.combined.hourly[0].time);
  maxDate = getDateKey(firstLoaded.combined.hourly[firstLoaded.combined.hourly.length - 1].time);
  selectedDate = selectedDate && selectedDate >= minDate && selectedDate <= maxDate ? selectedDate : minDate;
  datePicker.min = minDate;
  datePicker.max = maxDate;
  datePicker.value = selectedDate;
}

async function renderAll() {
  lastUpdated.textContent = "更新中…";
  spots.forEach((spot) => {
    const card = buildCard(spot);
    spotState.set(spot.name, { card, combined: null });
  });

  await Promise.all(spots.map(loadSpot));
  setupDateRangeFromState();
  renderSelectedDate();
  lastUpdated.textContent = new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date());
}

function clearCards() {
  charts.forEach((chart) => chart.destroy());
  charts.clear();
  spotState.clear();
  grid.innerHTML = "";
}

async function rerender() {
  clearCards();
  await renderAll();
}

function applyFilter(area) {
  document.querySelectorAll(".spot-card").forEach((card) => {
    const visible = area === "all" || card.dataset.area === area;
    card.classList.toggle("is-hidden", !visible);
  });
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) {
    return;
  }

  document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
  applyFilter(button.dataset.area);
});

datePicker.addEventListener("change", () => {
  selectedDate = datePicker.value;
  renderSelectedDate();
});

refreshButton.addEventListener("click", rerender);

renderAll();
