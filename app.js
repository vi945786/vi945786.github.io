const CITIES_SOURCE_URL = "https://www.tzevaadom.co.il/static/cities.json";
const CITY_ALERTS_URL_BASE =
  "https://alerts-history.oref.org.il//Shared/Ajax/GetAlarmsHistory.aspx";
const CORS_PROXY_PREFIX = "https://cors.io/?url=";

const REFRESH_INTERVAL_MS = 5000;
const TICK_INTERVAL_MS = 1000;

const dom = {
  cityPill: document.getElementById("city-pill"),
  statusChip: document.getElementById("status-chip"),
  sinceTimer: document.getElementById("since-timer"),
  sinceCaption: document.getElementById("since-caption"),
  countDay: document.getElementById("count-day"),
  countWeek: document.getElementById("count-week"),
  countMonth: document.getElementById("count-month"),
  cityInput: document.getElementById("city-input"),
  cityOptions: document.getElementById("city-options"),
  applyCityBtn: document.getElementById("apply-city-btn"),
  locateBtn: document.getElementById("locate-btn"),
  controlMessage: document.getElementById("control-message"),
  historyList: document.getElementById("alerts-history-list"),
};

const state = {
  cities: {},
  cityAliases: new Map(),
  selectedCity: null,
  locationSource: "Pending",
  lastPollAt: null,
  pollInFlight: false,
};

const israeliDateTimeFormat = new Intl.DateTimeFormat("en-IL", {
  timeZone: "Asia/Jerusalem",
  dateStyle: "medium",
  timeStyle: "medium",
  hour12: false,
});

const israelTimeOnlyFormat = new Intl.DateTimeFormat("en-IL", {
  timeZone: "Asia/Jerusalem",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0590-\u05ff\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function showControlMessage(message, isError = false) {
  dom.controlMessage.textContent = message;
  dom.controlMessage.classList.toggle("error", isError);
}

function updateUrlCity(city) {
  const url = new URL(window.location.href);
  if (!city) {
    url.searchParams.delete("city");
  } else {
    url.searchParams.set("city", city.name);
  }
  window.history.replaceState({}, "", url);
}

function parseAlertDate(alert) {
  if (alert?.date instanceof Date) {
    return alert.date;
  }

  if (typeof alert?.date === "string" && alert.time) {
    const [day, month, year] = alert.date.split(".").map(Number);
    const [hours, minutes, seconds] = alert.time.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  if (alert?.alertDate) {
    const date = new Date(String(alert.alertDate).replace(" ", "T") + "+03:00");
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) {
    return "--:--:--";
  }

  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (days > 0) {
    return `${days}d ${hh}h ${mm}m ${ss}s`;
  }

  return `${hh}:${mm}:${ss}`;
}

function renderStatusChip() {
  dom.statusChip.textContent = "Live city polling active";
  dom.statusChip.classList.remove("alerting");
  dom.statusChip.classList.add("quiet");
}

function render() {
  if (!state.selectedCity) {
    return;
  }

  const latest = state.selectedCity.alerts[0] || null;
  const latestDate = latest ? parseAlertDate(latest) : null;

  if (!latestDate) {
    dom.sinceTimer.textContent = "--:--:--";
  } else {
    const elapsed = Date.now() - latestDate.getTime();
    dom.sinceTimer.textContent = formatDuration(elapsed);
    dom.sinceCaption.textContent = `Time since last alert in ${state.selectedCity.name}`;
  }

  renderStatusChip();
  renderAlertCounters();
  renderAlertsHistory();
}

function renderAlertCounters() {
  if (!state.selectedCity) {
    return;
  }

  const alerts = state.selectedCity.alerts || [];
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  let dayCount = 0;
  let weekCount = 0;
  let monthCount = 0;

  for (const alert of alerts) {
    const date = parseAlertDate(alert);
    if (!date) {
      continue;
    }
    const t = date.getTime();
    if (t >= monthAgo) {
      monthCount += 1;
    }
    if (t >= weekAgo) {
      weekCount += 1;
    }
    if (t >= dayAgo) {
      dayCount += 1;
    }
  }

  dom.countDay.textContent = String(dayCount);
  dom.countWeek.textContent = String(weekCount);
  dom.countMonth.textContent = String(monthCount);
}

function renderAlertsHistory() {
  if (!dom.historyList || !state.selectedCity) {
    return;
  }

  const alerts = state.selectedCity.alerts || [];
  if (!alerts.length) {
    dom.historyList.innerHTML = '<li class="history-empty">No alerts in history for this city.</li>';
    return;
  }

  dom.historyList.innerHTML = alerts
    .map((alert) => {
      const date = parseAlertDate(alert);
      const when = date ? israeliDateTimeFormat.format(date) : "--";
      const desc = String(alert.category_desc || `Category ${alert.category || "?"}`);

      return `<li class="history-item"><p class="history-time">${when}</p><p class="history-category">${desc}</p></li>`;
    })
    .join("");
}

async function fetchViaCors(apiUrl) {
  const proxyUrl = `${CORS_PROXY_PREFIX}${encodeURIComponent(apiUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const wrapped = await response.json();
  if (!wrapped || Number(wrapped.status) !== 200) {
    throw new Error(`Proxy/Oref status: ${wrapped?.status}`);
  }

  const body = wrapped.body;
  if (typeof body === "string") {
    const cleaned = body.replace(/^\uFEFF/, "").replace(/\x00/g, "").trim();
    if (!cleaned) {
      return null;
    }
    return JSON.parse(cleaned);
  }

  return body;
}

async function loadCitiesObject() {
  const payload = await fetchViaCors(CITIES_SOURCE_URL);
  const sourceCities = payload?.cities || {};

  state.cities = Object.fromEntries(
    Object.entries(sourceCities).map((city) => {
      return [city[0], { name: city[0], id: city[1].id, alerts: [] }];
    })
  );

  const names = Object.keys(state.cities).sort((a, b) => a.localeCompare(b, "he"));
  state.cityAliases = new Map();
  names.forEach((name) => {
    state.cityAliases.set(normalizeText(name), state.cities[name]);
  });

  dom.cityOptions.innerHTML = names
    .map((name) => `<option value="${name}"></option>`)
    .join("");
}

async function addAlertsToCity(city) {
  const existingAlertTimes = new Set(
    city.alerts.map((alert) =>
      alert.date instanceof Date ? alert.date.getTime() : parseAlertDate(alert)?.getTime()
    )
  );

  const alerts = JSON.parse(
    (
      await (
        await fetch(
          "https://cors.io/?url=" +
            encodeURIComponent(
              `${CITY_ALERTS_URL_BASE}?mode=3&city_0=${encodeURIComponent(city.name)}`
            )
        )
      ).json()
    ).body
  )
    .filter((alert) => alert.category < 13)
    .map((alert) => {
      const [day, month, year] = alert.date.split(".").map(Number);
      const [hours, minutes, seconds] = alert.time.split(":").map(Number);
      const d = new Date(year, month - 1, day, hours, minutes, seconds);

      return {
        date: d,
        category: alert.category,
        category_desc: alert.category_desc,
      };
    });

  alerts.forEach((alert) => {
    const t = alert.date.getTime();
    if (!existingAlertTimes.has(t)) {
      city.alerts.push(alert);
      existingAlertTimes.add(t);
    }
  });

  city.alerts = city.alerts.sort((alert1, alert2) => {
    return alert2.date - alert1.date;
  });
}

function readCityFromUrl() {
  const url = new URL(window.location.href);
  const cityParam = url.searchParams.get("city") || url.searchParams.get("area");
  if (!cityParam) {
    return null;
  }

  const normalized = normalizeText(cityParam);
  return state.cityAliases.get(normalized) || null;
}

function setSelectedCity(city, reason) {
  state.selectedCity = city;
  dom.cityPill.textContent = city.name;
  dom.cityInput.value = city.name;
  updateUrlCity(city);
  if (reason) {
    showControlMessage(reason);
  }
  render();
}

function pickTelAvivFallback() {
  const names = Object.keys(state.cities);
  const telAvivName =
    names.find((name) => normalizeText(name).includes(normalizeText("תל אביב"))) || names[0];
  const city = state.cities[telAvivName] || null;
  if (city) {
    setSelectedCity(city, "Defaulted to Tel Aviv.");
  }
  return city;
}

async function resolveCityFromGeolocation() {
  if (!navigator.geolocation) {
    state.locationSource = "No geolocation support -> Tel Aviv fallback";
    pickTelAvivFallback();
    return;
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 300000,
      timeout: 7000,
    });
  }).catch(() => null);

  if (!position) {
    state.locationSource = "Location denied/unavailable -> Tel Aviv fallback";
    pickTelAvivFallback();
    return;
  }

  const { latitude, longitude } = position.coords;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "he");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  let reverse;
  try {
    const response = await fetch(url.toString());
    reverse = await response.json();
  } catch {
    state.locationSource = "Reverse geocode failed -> Tel Aviv fallback";
    pickTelAvivFallback();
    return;
  }

  if (reverse?.address?.country_code !== "il") {
    state.locationSource = "Location outside Israel -> Tel Aviv fallback";
    pickTelAvivFallback();
    return;
  }

  const candidates = [
    reverse?.address?.city,
    reverse?.address?.town,
    reverse?.address?.village,
    reverse?.address?.municipality,
    reverse?.address?.suburb,
    reverse?.address?.city_district,
    reverse?.name,
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value));

  let matched = null;
  for (const candidate of candidates) {
    matched = state.cityAliases.get(candidate) || null;
    if (matched) {
      break;
    }

    matched =
      Object.values(state.cities).find((city) =>
        normalizeText(city.name).includes(candidate)
      ) || null;
    if (matched) {
      break;
    }
  }

  if (!matched) {
    state.locationSource = "Israeli location unmatched -> Tel Aviv fallback";
    pickTelAvivFallback();
    return;
  }

  state.locationSource = "Client geolocation in Israel";
  setSelectedCity(matched, `Detected city: ${matched.name}`);
}

async function refreshSelectedCity() {
  if (!state.selectedCity || state.pollInFlight) {
    return;
  }

  state.pollInFlight = true;
  try {
    await addAlertsToCity(state.selectedCity);
    state.lastPollAt = new Date();
    render();
  } finally {
    state.pollInFlight = false;
  }
}

async function applySelectedInput() {
  const city = findCityByInput(dom.cityInput.value);
  if (!city) {
    showControlMessage("City not found in list.", true);
    return;
  }

  state.locationSource = "Manual selection";
  setSelectedCity(city, `Now tracking ${city.name}`);
  await addAlertsToCity(city);
  state.lastPollAt = new Date();
  render();
}

function findCityByInput(inputText) {
  const normalized = normalizeText(inputText);
  if (!normalized) {
    return null;
  }

  const direct = state.cityAliases.get(normalized);
  if (direct) {
    return direct;
  }

  return (
    Object.values(state.cities).find((city) =>
      normalizeText(city.name).includes(normalized)
    ) || null
  );
}

function bindEvents() {
  dom.applyCityBtn.addEventListener("click", () => {
    applySelectedInput();
  });

  dom.cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applySelectedInput();
    }
  });

  dom.locateBtn.addEventListener("click", async () => {
    showControlMessage("Detecting your location...");
    await resolveCityFromGeolocation();
    await refreshSelectedCity();
  });
}

async function initialize() {
  showControlMessage("Loading cities and city history...");

  await loadCitiesObject();

  const cityFromUrl = readCityFromUrl();
  if (cityFromUrl) {
    state.locationSource = "City from URL";
    setSelectedCity(cityFromUrl, `Loaded from URL: ${cityFromUrl.name}`);
  } else {
    pickTelAvivFallback();
    await resolveCityFromGeolocation();
  }

  await refreshSelectedCity();

  setInterval(render, TICK_INTERVAL_MS);
  setInterval(async () => {
    try {
      await refreshSelectedCity();
    } catch {
      showControlMessage("Realtime refresh failed temporarily. Retrying...", true);
    }
  }, REFRESH_INTERVAL_MS);

  showControlMessage(
    ""
  );
}

bindEvents();
initialize().catch(() => {
  showControlMessage("Failed to initialize data sources. Please refresh.", true);
});
