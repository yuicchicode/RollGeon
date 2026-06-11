"use strict";

/* =========================
   RollGeon — MAIN SCRIPT
========================= */

const STORAGE_KEY = "rollgeon-state-v1";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const els = {
  body: document.body,

  wheelSection: $(".wheel-section"),
  canvas: $("#wheelCanvas"),
  itemsCount: $("#itemsCount"),
  suspenseMessage: $("#suspenseMessage"),

  spinButton: $("#spinButton"),
  spinAgainButton: $("#spinAgainButton"),
  currentResult: $("#currentResult"),

  itemForm: $("#itemForm"),
  emojiInput: $("#emojiInput"),
  labelInput: $("#labelInput"),
  colorInput: $("#colorInput"),
  weightInput: $("#weightInput"),
  itemsList: $("#itemsList"),
  clearItemsButton: $("#clearItemsButton"),

  soundToggle: $("#soundToggle"),
  confettiToggle: $("#confettiToggle"),
  eliminateToggle: $("#eliminateToggle"),
  weightedToggle: $("#weightedToggle"),
  themeSelect: $("#themeSelect"),
  durationRange: $("#durationRange"),
  durationLabel: $("#durationLabel"),

  historyList: $("#historyList"),
  clearHistoryButton: $("#clearHistoryButton"),

  winnerModal: $("#winnerModal"),
  closeWinnerModal: $("#closeWinnerModal"),
  winnerEmoji: $("#winnerEmoji"),
  winnerLabel: $("#winnerLabel"),
  winnerMessage: $("#winnerMessage"),

  resetButton: $("#resetButton"),
  exportButton: $("#exportButton"),
  importButton: $("#importButton"),
  importModal: $("#importModal"),
  closeImportModal: $("#closeImportModal"),
  importTextarea: $("#importTextarea"),
  confirmImportButton: $("#confirmImportButton"),

  randomizeColorsButton: $("#randomizeColorsButton"),
  confettiLayer: $("#confettiLayer"),

  spinSound: $("#spinSound"),
  tickSound: $("#tickSound"),
  winSound: $("#winSound"),

  itemTemplate: $("#itemTemplate"),
  historyTemplate: $("#historyTemplate")
};

const ctx = els.canvas.getContext("2d");

const themeAliases = {
  neon: "castle",
  casino: "tavern",
  minimal: "forest",
  galaxy: "dungeon",
  candy: "parchment"
};

const validThemes = ["castle", "tavern", "forest", "dungeon", "parchment"];

function normalizeTheme(theme) {
  return validThemes.includes(theme) ? theme : themeAliases[theme] || "castle";
}

const colorPalette = [
  "#9f2f2a",
  "#d9a441",
  "#5f8f45",
  "#7a4d2a",
  "#315f72",
  "#b86932",
  "#6f3c66",
  "#c2a464",
  "#394150",
  "#8c6f3d",
  "#b24a38",
  "#4f7d5f"
];

const suspenseMessages = [
  "The ancient dice have been cast...",
  "The guild hall is completely silent.",
  "The blade of fate points toward someone.",
  "The herald prepares the announcement.",
  "The runes are glowing on the board.",
  "No turning back: the quest has begun.",
  "The wheel consults the elders.",
  "Hold your shield and breathe.",
  "Almost... the seal is opening.",
  "The council is calculating chaos."
];

const winnerMessages = [
  "Fate has spoken. Now accept the quest.",
  "I did not choose it; the wheel council did.",
  "Official verdict, sealed on parchment.",
  "The decision was made with guild authority.",
  "You may protest, but the runes do not rewind.",
  "This one was chosen by ancient chaos."
];

const presets = {
  food: [
    ["🍕", "Pizza"],
    ["🍔", "Burger"],
    ["🍣", "Sushi"],
    ["🌮", "Taco"],
    ["🍝", "Pasta"],
    ["🥗", "Salad"],
    ["🍜", "Ramen"],
    ["🥪", "Sandwich"]
  ],

  movies: [
    ["🎬", "Action movie"],
    ["😂", "Comedy"],
    ["👻", "Horror"],
    ["🚀", "Science fiction"],
    ["💕", "Romance"],
    ["🕵️", "Suspense"],
    ["🧙", "Fantasy"],
    ["📺", "Random series"]
  ],

  chores: [
    ["🧹", "Sweep"],
    ["🧽", "Wash dishes"],
    ["🗑️", "Take out trash"],
    ["🧺", "Do laundry"],
    ["🛏️", "Make the bed"],
    ["🧼", "Clean bathroom"],
    ["🌱", "Water plants"],
    ["🧊", "Organize fridge"]
  ],

  challenges: [
    ["🔥", "Surprise challenge"],
    ["🎤", "Sing a song"],
    ["💃", "Dance for 20 seconds"],
    ["📸", "Make a weird pose"],
    ["😂", "Tell a joke"],
    ["🧠", "Answer a hard question"],
    ["🎭", "Imitate someone"],
    ["⏱️", "Do something in 30 seconds"]
  ]
};

const defaultState = {
  wheelName: "RollGeon",

  items: [
    createItem("🍕", "Pizza", "#b86932"),
    createItem("🎬", "Movie", "#6f3c66"),
    createItem("🎮", "Play", "#315f72"),
    createItem("🍔", "Burger", "#9f2f2a"),
    createItem("😴", "Sleep", "#5f8f45"),
    createItem("☕", "Coffee", "#d9a441")
  ],

  history: [],

  settings: {
    sound: true,
    confetti: true,
    eliminateAfterSpin: false,
    weightedMode: false,
    spinDuration: 5000,
    theme: "castle"
  }
};

let state = clone(defaultState);
let currentRotation = 0;
let isSpinning = false;
let lastTickSegmentId = null;

/* =========================
   HELPERS
========================= */

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createItem(emoji, label, color, weight = 1) {
  return {
    id: createId(),
    emoji,
    label,
    color,
    weight,
    enabled: true,
    wins: 0
  };
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function getRandomColor(index = 0) {
  return colorPalette[index % colorPalette.length];
}

function getRandomSuspenseMessage() {
  return suspenseMessages[randomInt(0, suspenseMessages.length - 1)];
}

function getRandomWinnerMessage() {
  return winnerMessages[randomInt(0, winnerMessages.length - 1)];
}

function getActiveItems() {
  return state.items.filter((item) => item.enabled);
}

function setSuspenseMessage(message) {
  els.suspenseMessage.textContent = message;
}

function shakeElement(element) {
  element.classList.remove("shake");
  void element.offsetWidth;
  element.classList.add("shake");
}

function flashElement(element) {
  element.classList.remove("flash");
  void element.offsetWidth;
  element.classList.add("flash");
}

/* =========================
   LOCAL STORAGE
========================= */

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    state = {
      ...clone(defaultState),
      ...parsed,
      settings: {
        ...clone(defaultState.settings),
        ...(parsed.settings || {})
      },
      items: Array.isArray(parsed.items) ? parsed.items : clone(defaultState.items),
      history: Array.isArray(parsed.history) ? parsed.history : []
    };

    state.wheelName = "RollGeon";
    state.settings.theme = normalizeTheme(state.settings.theme);
  } catch {
    state = clone(defaultState);
  }
}

/* =========================
   GENERAL RENDERING
========================= */

function renderApp() {
  applyTheme();
  syncSettingsControls();
  renderItems();
  renderHistory();
  updateItemsCount();
  drawWheel();
  saveState();
}

function updateItemsCount() {
  const active = getActiveItems().length;
  const total = state.items.length;

  if (total === 0) {
    els.itemsCount.textContent = "0 items";
    return;
  }

  if (active === total) {
    els.itemsCount.textContent = `${total} ${total === 1 ? "item" : "items"}`;
    return;
  }

  els.itemsCount.textContent = `${active}/${total} active`;
}

function syncSettingsControls() {
  els.soundToggle.checked = state.settings.sound;
  els.confettiToggle.checked = state.settings.confetti;
  els.eliminateToggle.checked = state.settings.eliminateAfterSpin;
  els.weightedToggle.checked = state.settings.weightedMode;
  state.settings.theme = normalizeTheme(state.settings.theme);
  els.themeSelect.value = state.settings.theme;
  els.durationRange.value = state.settings.spinDuration;
  els.durationLabel.textContent = `${state.settings.spinDuration / 1000}s`;
}

/* =========================
   CANVAS / WHEEL
========================= */

function getWheelSegments() {
  const activeItems = getActiveItems();

  if (activeItems.length === 0) {
    return [];
  }

  const totalWeight = activeItems.reduce((sum, item) => {
    return sum + Math.max(1, Number(item.weight) || 1);
  }, 0);

  let cursor = 0;

  return activeItems.map((item) => {
    const value = state.settings.weightedMode
      ? Math.max(1, Number(item.weight) || 1)
      : 1;

    const total = state.settings.weightedMode ? totalWeight : activeItems.length;
    const size = (value / total) * 360;

    const segment = {
      item,
      start: cursor,
      end: cursor + size,
      center: cursor + size / 2,
      size
    };

    cursor += size;

    return segment;
  });
}

function drawWheel() {
  const width = els.canvas.width;
  const height = els.canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 18;

  ctx.clearRect(0, 0, width, height);

  const segments = getWheelSegments();

  if (segments.length === 0) {
    drawEmptyWheel(centerX, centerY, radius);
    return;
  }

  segments.forEach((segment, index) => {
    drawSegment(segment, index, centerX, centerY, radius);
  });

  drawWheelHighlights(centerX, centerY, radius);
}

function drawEmptyWheel(centerX, centerY, radius) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fill();

  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.font = "900 28px Trebuchet MS, Courier New, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Add items", centerX, centerY - 12);

  ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
  ctx.font = "800 16px Trebuchet MS, Courier New, monospace";
  ctx.fillText("to spin the wheel", centerX, centerY + 22);

  ctx.restore();
}

function drawSegment(segment, index, centerX, centerY, radius) {
  const startAngle = degreesToRadians(-90 + segment.start + currentRotation);
  const endAngle = degreesToRadians(-90 + segment.end + currentRotation);
  const middleAngle = degreesToRadians(-90 + segment.center + currentRotation);

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.closePath();

  ctx.fillStyle = segment.item.color || getRandomColor(index);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.stroke();

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.1,
    centerX,
    centerY,
    radius
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 0.24)");
  gradient.addColorStop(0.65, "rgba(255, 255, 255, 0.03)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.22)");

  ctx.fillStyle = gradient;
  ctx.fill();

  drawSegmentText(segment, middleAngle, centerX, centerY, radius);

  ctx.restore();
}

function drawSegmentText(segment, middleAngle, centerX, centerY, radius) {
  if (segment.size < 9) return;

  const label = `${segment.item.emoji || "✨"} ${segment.item.label}`;
  const maxTextLength = segment.size < 18 ? 10 : 18;
  const text = label.length > maxTextLength
    ? `${label.slice(0, maxTextLength)}…`
    : label;

  ctx.save();

  ctx.translate(centerX, centerY);
  ctx.rotate(middleAngle);

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  const fontSize = segment.size < 16 ? 13 : 16;
  ctx.font = `900 ${fontSize}px Trebuchet MS, Courier New, monospace`;

  ctx.fillText(text, radius - 28, 0);

  ctx.restore();
}

function drawWheelHighlights(centerX, centerY, radius) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 16, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.stroke();

  ctx.restore();
}

/* =========================
   SORTEIO
========================= */

function pickRandomItem() {
  const activeItems = getActiveItems();

  if (activeItems.length === 0) return null;

  if (state.settings.weightedMode) {
    return pickWeightedItem(activeItems);
  }

  return activeItems[randomInt(0, activeItems.length - 1)];
}

function pickWeightedItem(items) {
  const totalWeight = items.reduce((sum, item) => {
    return sum + Math.max(1, Number(item.weight) || 1);
  }, 0);

  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= Math.max(1, Number(item.weight) || 1);

    if (random <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

/* =========================
   SPIN ANIMATION
========================= */

function spinWheel() {
  if (isSpinning) return;

  const activeItems = getActiveItems();

  if (activeItems.length < 2) {
    setSuspenseMessage("You need at least 2 active items to spin.");
    shakeElement(els.wheelSection);
    return;
  }

  const winner = pickRandomItem();
  const segments = getWheelSegments();
  const winnerSegment = segments.find((segment) => segment.item.id === winner.id);

  if (!winnerSegment) return;

  isSpinning = true;
  lastTickSegmentId = null;

  els.spinButton.disabled = true;
  els.spinButton.classList.add("is-spinning");
  els.wheelSection.classList.add("is-spinning");

  setSuspenseMessage(getRandomSuspenseMessage());
  playSound("spin");

  const currentMod = normalizeDegrees(currentRotation);
  const desiredMod = normalizeDegrees(-winnerSegment.center);
  const correction = normalizeDegrees(desiredMod - currentMod);

  const extraSpins = randomInt(5, 9) * 360;
  const targetRotation = currentRotation + extraSpins + correction;

  animateSpin(targetRotation, winner);
}

function animateSpin(targetRotation, winner) {
  const start = performance.now();
  const duration = Number(state.settings.spinDuration) || 5000;
  const startRotation = currentRotation;
  const distance = targetRotation - startRotation;

  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    currentRotation = startRotation + distance * eased;

    drawWheel();
    maybePlayTick(progress);

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    finishSpin(winner);
  }

  requestAnimationFrame(frame);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function maybePlayTick(progress) {
  if (!state.settings.sound) return;
  if (progress > 0.96) return;

  const segments = getWheelSegments();

  if (segments.length === 0) return;

  const pointerAngle = normalizeDegrees(-currentRotation);

  const currentSegment = segments.find((segment) => {
    return pointerAngle >= segment.start && pointerAngle < segment.end;
  });

  if (!currentSegment) return;

  if (currentSegment.item.id !== lastTickSegmentId) {
    lastTickSegmentId = currentSegment.item.id;
    playSound("tick", 0.18);
  }
}

function finishSpin(winner) {
  currentRotation = normalizeDegrees(currentRotation);

  isSpinning = false;

  els.spinButton.disabled = false;
  els.spinButton.classList.remove("is-spinning");
  els.wheelSection.classList.remove("is-spinning");

  registerWinner(winner);
  showWinner(winner);

  if (state.settings.confetti) {
    launchConfetti();
  }

  playSound("win");
  flashElement(els.wheelSection);

  renderApp();
}

/* =========================
   RESULT / HISTORY
========================= */

function registerWinner(winner) {
  const item = state.items.find((current) => current.id === winner.id);

  if (!item) return;

  item.wins = Number(item.wins || 0) + 1;

  state.history.unshift({
    id: createId(),
    itemId: item.id,
    emoji: item.emoji,
    label: item.label,
    color: item.color,
    date: new Date().toISOString()
  });

  state.history = state.history.slice(0, 24);

  if (state.settings.eliminateAfterSpin) {
    item.enabled = false;
  }

  saveState();
}

function showWinner(winner) {
  els.winnerEmoji.textContent = winner.emoji || "🎉";
  els.winnerLabel.textContent = winner.label;
  els.winnerMessage.textContent = getRandomWinnerMessage();

  els.currentResult.innerHTML = `
    <span class="result-kicker">Current Verdict</span>
    <strong>${escapeHTML(winner.emoji || "🎉")} ${escapeHTML(winner.label)}</strong>
  `;

  els.winnerModal.classList.remove("hidden");
  setSuspenseMessage(`Rolled: ${winner.emoji || "🎉"} ${winner.label}`);
}

function closeWinnerModal() {
  els.winnerModal.classList.add("hidden");
}

function renderHistory() {
  els.historyList.innerHTML = "";

  if (state.history.length === 0) {
    els.historyList.innerHTML = `
      <div class="empty-state horizontal">
        <strong>No spins yet.</strong>
        <span>When the wheel spins, results appear here.</span>
      </div>
    `;
    return;
  }

  state.history.forEach((entry) => {
    const node = els.historyTemplate.content.cloneNode(true);

    const item = node.querySelector(".history-item");
    const title = node.querySelector(".history-title");
    const time = node.querySelector(".history-time");
    const badge = node.querySelector(".history-badge");

    item.style.borderColor = `${entry.color}66`;
    title.textContent = `${entry.emoji || "🎉"} ${entry.label}`;
    time.textContent = formatDate(entry.date);
    badge.textContent = entry.emoji || "🎉";
    badge.style.background = `${entry.color || "#ffffff"}22`;

    els.historyList.appendChild(node);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

/* =========================
   ITENS
========================= */

function addItem(event) {
  event.preventDefault();

  const emoji = els.emojiInput.value.trim() || "✨";
  const label = els.labelInput.value.trim();
  const color = els.colorInput.value || getRandomColor(state.items.length);
  const weight = Math.max(1, Number(els.weightInput.value) || 1);

  if (!label) {
    shakeElement(els.itemForm);
    return;
  }

  state.items.push(createItem(emoji, label, color, weight));

  els.itemForm.reset();
  els.colorInput.value = getRandomColor(state.items.length);
  els.weightInput.value = 1;
  els.labelInput.focus();

  setSuspenseMessage(`"${label}" joined the wheel.`);
  renderApp();
}

function renderItems() {
  els.itemsList.innerHTML = "";

  if (state.items.length === 0) {
    els.itemsList.innerHTML = `
      <div class="empty-state">
        <strong>Nothing here yet.</strong>
        <span>Add options to build your wheel.</span>
      </div>
    `;
    return;
  }

  state.items.forEach((item) => {
    const node = els.itemTemplate.content.cloneNode(true);

    const card = node.querySelector(".item-card");
    const color = node.querySelector(".item-color");
    const title = node.querySelector(".item-title");
    const meta = node.querySelector(".item-meta");
    const toggleButton = node.querySelector(".item-toggle");
    const editButton = node.querySelector(".edit-item");
    const removeButton = node.querySelector(".remove-item");

    card.dataset.id = item.id;
    card.classList.toggle("is-disabled", !item.enabled);

    color.style.setProperty("--item-color", item.color);
    color.textContent = item.emoji || "✨";

    title.textContent = `${item.emoji || "✨"} ${item.label}`;
    meta.textContent = `Weight ${item.weight || 1} • ${item.wins || 0} win${Number(item.wins || 0) === 1 ? "" : "s"}`;

    toggleButton.addEventListener("click", () => toggleItem(item.id));
    editButton.addEventListener("click", () => editItem(item.id));
    removeButton.addEventListener("click", () => removeItem(item.id));

    els.itemsList.appendChild(node);
  });
}

function toggleItem(id) {
  const item = state.items.find((current) => current.id === id);

  if (!item) return;

  item.enabled = !item.enabled;

  setSuspenseMessage(
    item.enabled
      ? `${item.label} returned to the wheel.`
      : `${item.label} left the wheel for now.`
  );

  renderApp();
}

function editItem(id) {
  const item = state.items.find((current) => current.id === id);

  if (!item) return;

  const newLabel = prompt("Edit name:", item.label);
  if (newLabel === null) return;

  const cleanLabel = newLabel.trim();
  if (!cleanLabel) return;

  const newEmoji = prompt("Edit emoji:", item.emoji || "✨");
  if (newEmoji === null) return;

  const newWeight = prompt("Edit weight:", item.weight || 1);
  if (newWeight === null) return;

  item.label = cleanLabel;
  item.emoji = newEmoji.trim() || "✨";
  item.weight = Math.max(1, Number(newWeight) || 1);

  setSuspenseMessage(`${item.label} was updated.`);
  renderApp();
}

function removeItem(id) {
  const item = state.items.find((current) => current.id === id);

  if (!item) return;

  state.items = state.items.filter((current) => current.id !== id);

  setSuspenseMessage(`${item.label} was removed.`);
  renderApp();
}

function clearItems() {
  if (state.items.length === 0) return;

  const confirmed = confirm("Remove all wheel items?");

  if (!confirmed) return;

  state.items = [];
  setSuspenseMessage("The wheel is empty.");
  renderApp();
}

function randomizeColors() {
  state.items = state.items.map((item, index) => ({
    ...item,
    color: getRandomColor(index + randomInt(0, colorPalette.length - 1))
  }));

  setSuspenseMessage("Wheel colors were shuffled.");
  renderApp();
}

/* =========================
   SETTINGS
========================= */

function applyTheme() {
  state.settings.theme = normalizeTheme(state.settings.theme);
  els.body.dataset.theme = state.settings.theme;
}

function updateSetting(key, value) {
  state.settings[key] = value;
  renderApp();
}

function resetWheel() {
  const confirmed = confirm("Reset everything? Items, history, and settings will be restored.");

  if (!confirmed) return;

  state = clone(defaultState);
  currentRotation = 0;

  setSuspenseMessage("Wheel reset.");
  renderApp();
}

function clearHistory() {
  if (state.history.length === 0) return;

  const confirmed = confirm("Clear all history?");

  if (!confirmed) return;

  state.history = [];

  setSuspenseMessage("History cleared.");
  renderApp();
}

/* =========================
   PRESETS
========================= */

function applyPreset(name) {
  const preset = presets[name];

  if (!preset) return;

  if (state.items.length > 0) {
    const confirmed = confirm("Replace current items with this preset?");

    if (!confirmed) return;
  }

  state.items = preset.map(([emoji, label], index) => {
    return createItem(emoji, label, getRandomColor(index), 1);
  });

  state.history = [];
  currentRotation = 0;

  setSuspenseMessage("Quest loaded. Time to spin.");
  renderApp();
}

/* =========================
   IMPORT / EXPORT
========================= */

async function exportWheel() {
  const data = JSON.stringify(state, null, 2);

  try {
    await navigator.clipboard.writeText(data);
    setSuspenseMessage("Wheel copied to clipboard.");
  } catch {
    downloadTextFile("rollgeon-wheel.json", data);
    setSuspenseMessage("Wheel file exported.");
  }
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function openImportModal() {
  els.importTextarea.value = "";
  els.importModal.classList.remove("hidden");
}

function closeImportModal() {
  els.importModal.classList.add("hidden");
}

function importWheel() {
  const value = els.importTextarea.value.trim();

  if (!value) {
    shakeElement(els.importTextarea);
    return;
  }

  try {
    const imported = JSON.parse(value);

    state = {
      ...clone(defaultState),
      ...imported,
      settings: {
        ...clone(defaultState.settings),
        ...(imported.settings || {})
      },
      items: Array.isArray(imported.items) ? imported.items : [],
      history: Array.isArray(imported.history) ? imported.history : []
    };

    state.wheelName = "RollGeon";
    state.settings.theme = normalizeTheme(state.settings.theme);
    currentRotation = 0;

    closeImportModal();
    setSuspenseMessage("Wheel imported successfully.");
    renderApp();
  } catch {
    shakeElement(els.importTextarea);
    setSuspenseMessage("Import failed. The JSON seems invalid.");
  }
}

/* =========================
   CONFETE
========================= */

function launchConfetti() {
  const amount = 90;

  for (let i = 0; i < amount; i++) {
    const piece = document.createElement("span");

    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = getRandomColor(i);
    piece.style.animationDuration = `${randomBetween(2.2, 4.8)}s`;
    piece.style.animationDelay = `${randomBetween(0, 0.35)}s`;
    piece.style.setProperty("--drift", `${randomBetween(-140, 140)}px`);

    if (Math.random() > 0.5) {
      piece.style.width = "8px";
      piece.style.height = "8px";
    }

    els.confettiLayer.appendChild(piece);

    setTimeout(() => {
      piece.remove();
    }, 5500);
  }
}

/* =========================
   SOUNDS
========================= */

function playSound(name, volume = 0.6) {
  if (!state.settings.sound) return;

  const audioMap = {
    spin: els.spinSound,
    tick: els.tickSound,
    win: els.winSound
  };

  const audio = audioMap[name];

  if (!audio) return;

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {
    // If the browser blocks autoplay or the file is missing, ignore it.
  }
}

/* =========================
   SIMPLE SECURITY
========================= */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   EVENTS
========================= */

function bindEvents() {
  els.itemForm.addEventListener("submit", addItem);

  els.spinButton.addEventListener("click", spinWheel);
  els.spinAgainButton.addEventListener("click", () => {
    closeWinnerModal();
    spinWheel();
  });

  els.closeWinnerModal.addEventListener("click", closeWinnerModal);
  els.winnerModal.addEventListener("click", (event) => {
    if (event.target.classList.contains("winner-backdrop")) {
      closeWinnerModal();
    }
  });

  els.clearItemsButton.addEventListener("click", clearItems);
  els.clearHistoryButton.addEventListener("click", clearHistory);

  els.resetButton.addEventListener("click", resetWheel);
  els.exportButton.addEventListener("click", exportWheel);

  els.importButton.addEventListener("click", openImportModal);
  els.closeImportModal.addEventListener("click", closeImportModal);
  els.confirmImportButton.addEventListener("click", importWheel);

  els.importModal.addEventListener("click", (event) => {
    if (event.target.classList.contains("winner-backdrop")) {
      closeImportModal();
    }
  });

  els.randomizeColorsButton.addEventListener("click", randomizeColors);

  els.soundToggle.addEventListener("change", () => {
    updateSetting("sound", els.soundToggle.checked);
  });

  els.confettiToggle.addEventListener("change", () => {
    updateSetting("confetti", els.confettiToggle.checked);
  });

  els.eliminateToggle.addEventListener("change", () => {
    updateSetting("eliminateAfterSpin", els.eliminateToggle.checked);
  });

  els.weightedToggle.addEventListener("change", () => {
    updateSetting("weightedMode", els.weightedToggle.checked);
  });

  els.themeSelect.addEventListener("change", () => {
    updateSetting("theme", els.themeSelect.value);
  });

  els.durationRange.addEventListener("input", () => {
    state.settings.spinDuration = Number(els.durationRange.value);
    els.durationLabel.textContent = `${state.settings.spinDuration / 1000}s`;
    saveState();
  });

  $$(".preset-button").forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeWinnerModal();
      closeImportModal();
    }

    if (event.code === "Space") {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);

      if (!isTyping) {
        event.preventDefault();
        spinWheel();
      }
    }
  });
}

/* =========================
   INIT
========================= */

function initApp() {
  loadState();
  bindEvents();

  els.colorInput.value = getRandomColor(state.items.length);

  renderApp();

  setSuspenseMessage("The guild is ready. Press SPIN or the spacebar.");
}

initApp();