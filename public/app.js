const APP_PASSWORD = "TestApp-mij"; // wijzig dit wachtwoord (alleen lokale modus)
const STORAGE_KEY = "werkuren_state_v1";
const AUTH_KEY = "werkuren_auth_v1";
const AUTH_TOKEN_KEY = "werkuren_auth_token_v1";
const API_BASE = "/api";
const USE_API = true; // zet op true voor live versie met Supabase + Vercel

const DAYS_NL = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const MONTHS_NL = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];
const DAYS_FULL = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];
const BREAK_OPTIONS = [0, 15, 30, 45, 60, 75, 90];

const state = {
  view: "calendar",
  selectedDate: formatDateKey(new Date()),
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  overviewMode: "week",
  currentWeek: getWeekNumber(new Date()),
  settings: { hourlyRate: 40, currency: "€" },
  entries: [],
  clients: [],
  editingEntryId: null,
  breakMinutes: 30,
};

const els = {
  viewCalendar: document.getElementById("view-calendar"),
  viewOverview: document.getElementById("view-overview"),
  viewSettings: document.getElementById("view-settings"),
  tabs: document.querySelectorAll(".tab"),
  monthTitle: document.getElementById("monthTitle"),
  weekdayRow: document.getElementById("weekdayRow"),
  calendarGrid: document.getElementById("calendarGrid"),
  selectedDateLabel: document.getElementById("selectedDateLabel"),
  entriesList: document.getElementById("entriesList"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  addEntryBtn: document.getElementById("addEntryBtn"),
  toggleWeek: document.getElementById("toggleWeek"),
  toggleMonth: document.getElementById("toggleMonth"),
  periodLabel: document.getElementById("periodLabel"),
  prevPeriodBtn: document.getElementById("prevPeriodBtn"),
  nextPeriodBtn: document.getElementById("nextPeriodBtn"),
  statWorked: document.getElementById("statWorked"),
  statEarnings: document.getElementById("statEarnings"),
  statDays: document.getElementById("statDays"),
  statBreak: document.getElementById("statBreak"),
  dailyBreakdown: document.getElementById("dailyBreakdown"),
  exportPeriodBtn: document.getElementById("exportPeriodBtn"),
  exportSelectBtn: document.getElementById("exportSelectBtn"),
  currencyInput: document.getElementById("currencyInput"),
  hourlyRateInput: document.getElementById("hourlyRateInput"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),
  addClientBtn: document.getElementById("addClientBtn"),
  clientList: document.getElementById("clientList"),
  todayBtn: document.getElementById("todayBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  loginModal: document.getElementById("loginModal"),
  loginBtn: document.getElementById("loginBtn"),
  loginPassword: document.getElementById("loginPassword"),
  loginHint: document.getElementById("loginHint"),
  entryModal: document.getElementById("entryModal"),
  entryModalTitle: document.getElementById("entryModalTitle"),
  closeEntryModal: document.getElementById("closeEntryModal"),
  entryDate: document.getElementById("entryDate"),
  entryClient: document.getElementById("entryClient"),
  entryStart: document.getElementById("entryStart"),
  entryEnd: document.getElementById("entryEnd"),
  breakChips: document.getElementById("breakChips"),
  entryNotes: document.getElementById("entryNotes"),
  saveEntryBtn: document.getElementById("saveEntryBtn"),
  deleteEntryBtn: document.getElementById("deleteEntryBtn"),
  exportModal: document.getElementById("exportModal"),
  closeExportModal: document.getElementById("closeExportModal"),
  exportList: document.getElementById("exportList"),
  exportSummary: document.getElementById("exportSummary"),
  exportSelectedBtn: document.getElementById("exportSelectedBtn"),
  clientModal: document.getElementById("clientModal"),
  saveClientBtn: document.getElementById("saveClientBtn"),
  clientName: document.getElementById("clientName"),
  clientAddress: document.getElementById("clientAddress"),
};

init();

async function init() {
  renderWeekdays();
  attachEvents();
  if (!USE_API) {
    hydrateState();
    renderAll();
  } else if (hasToken()) {
    await refreshFromApi();
  } else {
    renderAll();
  }
  enforceAuth();
}

function hydrateState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data);
  } catch {
    // ignore
  }
}

function persistState() {
  if (USE_API) return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      view: state.view,
      selectedDate: state.selectedDate,
      currentYear: state.currentYear,
      currentMonth: state.currentMonth,
      overviewMode: state.overviewMode,
      currentWeek: state.currentWeek,
      settings: state.settings,
      entries: state.entries,
      clients: state.clients,
    })
  );
}

function attachEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.view = tab.dataset.view;
      renderViews();
    });
  });

  els.prevMonthBtn.addEventListener("click", () => shiftMonth(-1));
  els.nextMonthBtn.addEventListener("click", () => shiftMonth(1));
  els.addEntryBtn.addEventListener("click", () => openEntryModal());

  els.toggleWeek.addEventListener("click", () => setOverviewMode("week"));
  els.toggleMonth.addEventListener("click", () => setOverviewMode("month"));
  els.prevPeriodBtn.addEventListener("click", () => shiftPeriod(-1));
  els.nextPeriodBtn.addEventListener("click", () => shiftPeriod(1));

  els.exportPeriodBtn.addEventListener("click", () => exportPeriod());
  els.exportSelectBtn.addEventListener("click", () => openExportModal());

  els.saveSettingsBtn.addEventListener("click", () => {
    void saveSettings();
  });
  els.addClientBtn.addEventListener("click", () => toggleModal(els.clientModal, true));
  els.saveClientBtn.addEventListener("click", () => {
    void saveClient();
  });

  els.todayBtn.addEventListener("click", jumpToToday);
  els.logoutBtn.addEventListener("click", logout);
  els.loginBtn.addEventListener("click", login);

  els.closeEntryModal.addEventListener("click", () => toggleModal(els.entryModal, false));
  els.saveEntryBtn.addEventListener("click", () => {
    void saveEntry();
  });
  els.deleteEntryBtn.addEventListener("click", () => {
    void deleteEntry();
  });

  els.closeExportModal.addEventListener("click", () => toggleModal(els.exportModal, false));
  els.exportSelectedBtn.addEventListener("click", exportSelected);

  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      toggleModal(event.target, false);
    }
  });
}

function renderAll() {
  renderViews();
  renderCalendar();
  renderEntries();
  renderOverview();
  renderSettings();
}

function renderViews() {
  const map = {
    calendar: els.viewCalendar,
    overview: els.viewOverview,
    settings: els.viewSettings,
  };
  Object.values(map).forEach((view) => view.classList.remove("active"));
  map[state.view].classList.add("active");
  els.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === state.view);
  });
}

function renderWeekdays() {
  els.weekdayRow.innerHTML = "";
  DAYS_NL.forEach((day) => {
    const span = document.createElement("span");
    span.textContent = day;
    els.weekdayRow.appendChild(span);
  });
}

function renderCalendar() {
  els.monthTitle.textContent = `${MONTHS_NL[state.currentMonth]} ${state.currentYear}`;
  els.calendarGrid.innerHTML = "";

  const daysInMonth = getDaysInMonth(state.currentYear, state.currentMonth);
  const firstDay = getFirstDayOfMonth(state.currentYear, state.currentMonth);
  const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const day = i - firstDay + 1;
    const cell = document.createElement("div");
    cell.className = "day-cell";

    if (day > 0 && day <= daysInMonth) {
      const dateKey = formatDateKey({
        year: state.currentYear,
        month: state.currentMonth,
        day,
      });
      cell.textContent = day;
      cell.classList.toggle("selected", dateKey === state.selectedDate);
      cell.classList.toggle("today", isToday(state.currentYear, state.currentMonth, day));

      if (hasEntries(dateKey)) {
        const dot = document.createElement("span");
        dot.className = "dot";
        cell.appendChild(dot);
      }

      cell.addEventListener("click", () => {
        state.selectedDate = dateKey;
        renderCalendar();
        renderEntries();
        persistState();
      });
    }

    els.calendarGrid.appendChild(cell);
  }

  els.selectedDateLabel.textContent = formatDateLong(state.selectedDate);
}

function renderEntries() {
  els.entriesList.innerHTML = "";
  const entries = state.entries
    .filter((e) => e.date === state.selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML = "Geen uren geregistreerd. Klik op + om toe te voegen.";
    els.entriesList.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "entry-card";
    card.addEventListener("click", () => openEntryModal(entry.id));

    const bar = document.createElement("div");
    bar.className = "bar";

    const body = document.createElement("div");
    body.className = "entry-body";

    const client = state.clients.find((c) => c.id === entry.clientId);
    const title = document.createElement("div");
    title.className = "entry-title";
    title.textContent = client ? client.companyName : "Registratie";

    const meta = document.createElement("div");
    meta.className = "entry-meta";
    const workedMinutes = calculateWorkedMinutes(entry);
    const hours = minutesToDecimalHours(workedMinutes);
    meta.innerHTML = `<span>${entry.startTime} - ${entry.endTime} (${entry.breakMinutes}m pauze)</span><span>${formatDecimalHours(hours)}</span>`;

    const earnings = document.createElement("div");
    earnings.className = "entry-meta";
    earnings.innerHTML = `<span>${state.settings.currency}${(hours * state.settings.hourlyRate).toFixed(2)}</span>`;

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(earnings);

    if (entry.notes) {
      const notes = document.createElement("div");
      notes.className = "entry-notes";
      notes.textContent = entry.notes;
      body.appendChild(notes);
    }

    card.appendChild(bar);
    card.appendChild(body);
    els.entriesList.appendChild(card);
  });
}

function renderOverview() {
  const { entries } = state;
  const filtered = filterEntriesByPeriod(entries);

  const totalMinutes = filtered.reduce((sum, e) => sum + calculateWorkedMinutes(e), 0);
  const totalBreak = filtered.reduce((sum, e) => sum + e.breakMinutes, 0);
  const totalHours = minutesToDecimalHours(totalMinutes);
  const totalEarnings = totalHours * state.settings.hourlyRate;
  const daysWorked = new Set(filtered.map((e) => e.date)).size;

  els.statWorked.textContent = formatWorkedTime(totalMinutes);
  els.statEarnings.textContent = `${state.settings.currency}${totalEarnings.toFixed(2)}`;
  els.statDays.textContent = `${daysWorked}`;
  els.statBreak.textContent = `${totalBreak}m`;

  els.periodLabel.textContent = getPeriodLabel();

  els.dailyBreakdown.innerHTML = "";
  const breakdown = getDailyBreakdown(filtered);
  const maxHours = Math.max(...breakdown.map((d) => d.hours), 1);

  breakdown.forEach((row) => {
    const wrapper = document.createElement("div");
    wrapper.className = "break-row";
    const label = document.createElement("div");
    label.textContent = `${row.day} ${row.date.getDate()}`;
    const bar = document.createElement("div");
    bar.className = "break-bar";
    const fill = document.createElement("span");
    fill.style.width = `${(row.hours / maxHours) * 100}%`;
    bar.appendChild(fill);
    const val = document.createElement("div");
    val.textContent = formatDecimalHours(row.hours);
    wrapper.appendChild(label);
    wrapper.appendChild(bar);
    wrapper.appendChild(val);
    els.dailyBreakdown.appendChild(wrapper);
  });

  els.toggleWeek.classList.toggle("active", state.overviewMode === "week");
  els.toggleMonth.classList.toggle("active", state.overviewMode === "month");
}

function renderSettings() {
  els.currencyInput.value = state.settings.currency;
  els.hourlyRateInput.value = state.settings.hourlyRate;

  els.clientList.innerHTML = "";
  if (state.clients.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list-item";
    empty.textContent = "Nog geen klanten";
    els.clientList.appendChild(empty);
    return;
  }
  state.clients.forEach((client) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `<div><strong>${client.companyName}</strong><div class="hint">${client.address || ""}</div></div>`;
    const removeBtn = document.createElement("button");
    removeBtn.className = "ghost";
    removeBtn.textContent = "Verwijder";
    removeBtn.addEventListener("click", () => removeClient(client.id));
    item.appendChild(removeBtn);
    els.clientList.appendChild(item);
  });
}

function openEntryModal(entryId = null) {
  state.editingEntryId = entryId;
  const entry = state.entries.find((e) => e.id === entryId);

  els.entryModalTitle.textContent = entry ? "Uren bewerken" : "Uren toevoegen";
  els.entryDate.value = entry ? entry.date : state.selectedDate;
  els.entryNotes.value = entry ? entry.notes : "";
  state.breakMinutes = entry ? entry.breakMinutes : 30;

  populateTimeOptions();
  populateClients(entry?.clientId || "");
  els.entryStart.value = entry ? entry.startTime : "09:00";
  els.entryEnd.value = entry ? entry.endTime : "17:00";

  renderBreakChips();
  els.deleteEntryBtn.style.display = entry ? "inline-flex" : "none";
  toggleModal(els.entryModal, true);
}

function populateTimeOptions() {
  const times = getQuarterTimes();
  [els.entryStart, els.entryEnd].forEach((select) => {
    select.innerHTML = "";
    times.forEach((t) => {
      const option = document.createElement("option");
      option.value = t;
      option.textContent = t;
      select.appendChild(option);
    });
  });
}

function populateClients(selectedId) {
  els.entryClient.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Geen klant";
  els.entryClient.appendChild(empty);
  state.clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = client.companyName;
    els.entryClient.appendChild(option);
  });
  els.entryClient.value = selectedId || "";
}

function renderBreakChips() {
  els.breakChips.innerHTML = "";
  BREAK_OPTIONS.forEach((minutes) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = `${minutes}m`;
    chip.classList.toggle("active", minutes === state.breakMinutes);
    chip.addEventListener("click", () => {
      state.breakMinutes = minutes;
      renderBreakChips();
    });
    els.breakChips.appendChild(chip);
  });
}

async function saveEntry() {
  const date = els.entryDate.value;
  const startTime = els.entryStart.value;
  const endTime = els.entryEnd.value;
  const breakMinutes = state.breakMinutes;
  const notes = els.entryNotes.value.trim();
  const clientId = els.entryClient.value;

  if (!date) {
    alert("Kies een datum.");
    return;
  }
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    alert("De eindtijd moet na de starttijd liggen.");
    return;
  }

  if (USE_API) {
    try {
      if (state.editingEntryId) {
        await apiRequest(`/entries/${state.editingEntryId}`, {
          method: "PUT",
          body: { date, startTime, endTime, breakMinutes, notes, clientId },
        });
      } else {
        await apiRequest("/entries", {
          method: "POST",
          body: { date, startTime, endTime, breakMinutes, notes, clientId },
        });
      }
      state.selectedDate = date;
      toggleModal(els.entryModal, false);
      await refreshFromApi();
    } catch {
      alert("Opslaan mislukt.");
    }
    return;
  }

  if (state.editingEntryId) {
    const idx = state.entries.findIndex((e) => e.id === state.editingEntryId);
    if (idx !== -1) {
      state.entries[idx] = {
        ...state.entries[idx],
        date,
        startTime,
        endTime,
        breakMinutes,
        notes,
        clientId,
      };
    }
  } else {
    state.entries.push({
      id: crypto.randomUUID(),
      date,
      startTime,
      endTime,
      breakMinutes,
      notes,
      clientId,
    });
  }

  state.selectedDate = date;
  persistState();
  toggleModal(els.entryModal, false);
  renderCalendar();
  renderEntries();
  renderOverview();
}

async function deleteEntry() {
  if (!state.editingEntryId) return;
  if (USE_API) {
    try {
      await apiRequest(`/entries/${state.editingEntryId}`, { method: "DELETE" });
      toggleModal(els.entryModal, false);
      await refreshFromApi();
    } catch {
      alert("Verwijderen mislukt.");
    }
    return;
  }
  state.entries = state.entries.filter((e) => e.id !== state.editingEntryId);
  persistState();
  toggleModal(els.entryModal, false);
  renderCalendar();
  renderEntries();
  renderOverview();
}

async function saveSettings() {
  const rate = parseFloat(String(els.hourlyRateInput.value).replace(",", "."));
  if (Number.isNaN(rate) || rate < 0) {
    alert("Voer een geldig uurtarief in.");
    return;
  }
  if (USE_API) {
    try {
      await apiRequest("/settings", {
        method: "PUT",
        body: { hourlyRate: rate, currency: els.currencyInput.value || "€" },
      });
      await refreshFromApi();
    } catch {
      alert("Opslaan mislukt.");
    }
    return;
  }
  state.settings = {
    hourlyRate: rate,
    currency: els.currencyInput.value || "€",
  };
  persistState();
  renderOverview();
}

async function saveClient() {
  const name = els.clientName.value.trim();
  if (!name) {
    alert("Vul een bedrijfsnaam in.");
    return;
  }
  if (USE_API) {
    try {
      await apiRequest("/clients", {
        method: "POST",
        body: { companyName: name, address: els.clientAddress.value.trim() },
      });
      els.clientName.value = "";
      els.clientAddress.value = "";
      toggleModal(els.clientModal, false);
      await refreshFromApi();
    } catch {
      alert("Opslaan mislukt.");
    }
    return;
  }
  state.clients.push({
    id: crypto.randomUUID(),
    companyName: name,
    address: els.clientAddress.value.trim(),
  });
  els.clientName.value = "";
  els.clientAddress.value = "";
  persistState();
  renderSettings();
  toggleModal(els.clientModal, false);
}

async function removeClient(id) {
  if (USE_API) {
    try {
      await apiRequest(`/clients/${id}`, { method: "DELETE" });
      await refreshFromApi();
    } catch {
      alert("Verwijderen mislukt.");
    }
    return;
  }
  state.clients = state.clients.filter((c) => c.id !== id);
  state.entries = state.entries.map((entry) =>
    entry.clientId === id ? { ...entry, clientId: "" } : entry
  );
  persistState();
  renderSettings();
  renderEntries();
}

function setOverviewMode(mode) {
  state.overviewMode = mode;
  renderOverview();
  persistState();
}

function shiftMonth(delta) {
  let month = state.currentMonth + delta;
  let year = state.currentYear;
  if (month < 0) {
    month = 11;
    year -= 1;
  } else if (month > 11) {
    month = 0;
    year += 1;
  }
  state.currentMonth = month;
  state.currentYear = year;
  renderCalendar();
  persistState();
}

function shiftPeriod(delta) {
  if (state.overviewMode === "month") {
    shiftMonth(delta);
  } else {
    const next = state.currentWeek + delta;
    if (next < 1) {
      state.currentYear -= 1;
      state.currentWeek = 52;
    } else if (next > 52) {
      state.currentYear += 1;
      state.currentWeek = 1;
    } else {
      state.currentWeek = next;
    }
    renderOverview();
    persistState();
  }
}

function exportPeriod() {
  const entries = filterEntriesByPeriod(state.entries);
  if (entries.length === 0) {
    alert("Geen uren om te exporteren voor deze periode.");
    return;
  }
  const period = state.overviewMode === "month"
    ? `${MONTHS_NL[state.currentMonth]}_${state.currentYear}`
    : `Week${state.currentWeek}_${state.currentYear}`;
  const fileName = `Uren_${period}.csv`;
  downloadCSV(generateCSV(entries), fileName);
}

function openExportModal() {
  renderExportList();
  toggleModal(els.exportModal, true);
}

function renderExportList() {
  const dates = [...new Set(state.entries.map((e) => e.date))].sort((a, b) => b.localeCompare(a));
  const selected = new Set(dates);
  els.exportList.innerHTML = "";

  dates.forEach((date) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.style.cursor = "pointer";
    row.dataset.date = date;
    row.dataset.selected = "true";
    row.innerHTML = `<div><strong>${formatDateLabel(date)}</strong><div class="hint">${getDateStats(date)}</div></div><div>✓</div>`;
    row.addEventListener("click", () => {
      const isSelected = row.dataset.selected === "true";
      row.dataset.selected = String(!isSelected);
      row.lastElementChild.textContent = isSelected ? "" : "✓";
      row.style.opacity = isSelected ? "0.5" : "1";
      updateExportSummary();
    });
    els.exportList.appendChild(row);
  });

  function updateExportSummary() {
    const pickedDates = [...els.exportList.children]
      .filter((row) => row.dataset.selected === "true")
      .map((row) => row.dataset.date);
    selected.clear();
    pickedDates.forEach((d) => selected.add(d));
    const entries = state.entries.filter((e) => selected.has(e.date));
    const totalMinutes = entries.reduce((sum, e) => sum + calculateWorkedMinutes(e), 0);
    const totalHours = minutesToDecimalHours(totalMinutes);
    const totalEarnings = totalHours * state.settings.hourlyRate;
    els.exportSummary.textContent = `${selected.size} dagen geselecteerd · ${formatDecimalHours(totalHours)} · ${state.settings.currency}${totalEarnings.toFixed(2)}`;
    els.exportSelectedBtn.dataset.selected = JSON.stringify([...selected]);
  }

  updateExportSummary();
}

function exportSelected() {
  const selected = new Set(JSON.parse(els.exportSelectedBtn.dataset.selected || "[]"));
  const entries = state.entries.filter((e) => selected.has(e.date));
  if (entries.length === 0) {
    alert("Selecteer minimaal 1 dag.");
    return;
  }
  const fileName = `Uren_Export_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(generateCSV(entries), fileName);
  toggleModal(els.exportModal, false);
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function generateCSV(entries) {
  const rows = [
    ["Datum", "Start", "Eind", "Pauze", "Uren", "Verdiensten", "Klant", "Notities"],
  ];
  entries.forEach((entry) => {
    const worked = calculateWorkedMinutes(entry);
    const hours = minutesToDecimalHours(worked);
    const client = state.clients.find((c) => c.id === entry.clientId);
    rows.push([
      entry.date,
      entry.startTime,
      entry.endTime,
      `${entry.breakMinutes}m`,
      formatDecimalHours(hours),
      `${state.settings.currency}${(hours * state.settings.hourlyRate).toFixed(2)}`,
      client ? client.companyName : "",
      entry.notes || "",
    ]);
  });
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function filterEntriesByPeriod(entries) {
  if (state.overviewMode === "month") {
    const prefix = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, "0")}`;
    return entries.filter((e) => e.date.startsWith(prefix));
  }
  const { start, end } = getWeekDates(state.currentYear, state.currentWeek);
  return entries.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d >= start && d <= end;
  });
}

function getDailyBreakdown(entries) {
  const map = new Map();
  entries.forEach((e) => {
    if (!map.has(e.date)) map.set(e.date, 0);
    map.set(e.date, map.get(e.date) + calculateWorkedMinutes(e));
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, mins]) => ({
      date: new Date(date + "T00:00:00"),
      hours: minutesToDecimalHours(mins),
      day: DAYS_NL[getDayIndex(date)],
    }));
}

function getPeriodLabel() {
  if (state.overviewMode === "month") {
    return `${MONTHS_NL[state.currentMonth]} ${state.currentYear}`;
  }
  const { start, end } = getWeekDates(state.currentYear, state.currentWeek);
  return `Week ${state.currentWeek} - ${formatShortDate(start)} t/m ${formatShortDate(end)}`;
}

function hasToken() {
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    logout();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

async function refreshFromApi() {
  const data = await apiRequest("/data");
  state.settings = data.settings;
  state.entries = data.entries;
  state.clients = data.clients;
  renderAll();
}

function renderAuthHint() {
  if (USE_API) {
    els.loginHint.textContent = "";
    return;
  }
  if (APP_PASSWORD === "verander-mij") {
    els.loginHint.textContent = "Tip: pas het wachtwoord aan in app.js (APP_PASSWORD).";
  } else {
    els.loginHint.textContent = "";
  }
}

function enforceAuth() {
  renderAuthHint();
  const authed = USE_API ? hasToken() : localStorage.getItem(AUTH_KEY) === "true";
  toggleModal(els.loginModal, !authed);
}

async function login() {
  if (USE_API) {
    try {
      const result = await apiRequest("/login", {
        method: "POST",
        body: { password: els.loginPassword.value },
      });
      setToken(result.token);
      toggleModal(els.loginModal, false);
      els.loginPassword.value = "";
      await refreshFromApi();
    } catch {
      els.loginHint.textContent = "Onjuist wachtwoord.";
    }
    return;
  }
  if (els.loginPassword.value === APP_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "true");
    toggleModal(els.loginModal, false);
    els.loginPassword.value = "";
  } else {
    els.loginHint.textContent = "Onjuist wachtwoord.";
  }
}

function logout() {
  if (USE_API) {
    clearToken();
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
  enforceAuth();
}

function toggleModal(modal, show) {
  modal.classList.toggle("hidden", !show);
  modal.setAttribute("aria-hidden", show ? "false" : "true");
}

function jumpToToday() {
  const today = new Date();
  state.currentYear = today.getFullYear();
  state.currentMonth = today.getMonth();
  state.selectedDate = formatDateKey(today);
  state.currentWeek = getWeekNumber(today);
  renderCalendar();
  renderEntries();
  renderOverview();
  persistState();
}

function hasEntries(dateKey) {
  return state.entries.some((e) => e.date === dateKey);
}

function formatDateKey(input) {
  if (input instanceof Date) {
    return `${input.getFullYear()}-${String(input.getMonth() + 1).padStart(2, "0")}-${String(input.getDate()).padStart(2, "0")}`;
  }
  if (input && typeof input === "object") {
    const { year, month, day } = input;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

function formatDateLong(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
}

function formatShortDate(date) {
  return `${date.getDate()} ${MONTHS_NL[date.getMonth()].slice(0, 3)}`;
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS_FULL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]}`;
}

function getDateStats(dateStr) {
  const entries = state.entries.filter((e) => e.date === dateStr);
  const mins = entries.reduce((sum, e) => sum + calculateWorkedMinutes(e), 0);
  return `${entries.length} registratie(s) · ${formatDecimalHours(minutesToDecimalHours(mins))}`;
}

function formatWorkedTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}u ${String(mins).padStart(2, "0")}m`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isToday(year, month, day) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekDates(year, week) {
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay() || 7;
  const startOfWeek1 = new Date(jan1);
  startOfWeek1.setDate(jan1.getDate() + (1 - dayOfWeek));
  const start = new Date(startOfWeek1);
  start.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function getQuarterTimes() {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
}

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function calculateWorkedMinutes(entry) {
  const start = timeToMinutes(entry.startTime);
  const end = timeToMinutes(entry.endTime);
  const minutes = Math.max(0, end - start - entry.breakMinutes);
  return minutes;
}

function minutesToDecimalHours(minutes) {
  return Math.round((minutes / 60) * 100) / 100;
}

function formatDecimalHours(hours) {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return `${whole}u ${String(mins).padStart(2, "0")}m`;
}

function getDayIndex(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0 ? 6 : d.getDay() - 1;
}
