const starterLinks = [
  { name: 'Gmail', url: 'https://mail.google.com', icon: '✉' },
  { name: 'Calendar', url: 'https://calendar.google.com', icon: '▣' },
  { name: 'Notes', url: 'https://keep.google.com', icon: '▤' },
  { name: 'GitHub', url: 'https://github.com', icon: '⌘' }
];

const quotes = [
  'Almost everything will work again if you unplug it for a few minutes, including you.',
  'The best way out is always through.',
  'Start where you are. Use what you have. Do what you can.',
  'Make room for the thing that matters.',
  'Small steps still move you forward.',
  'Attention is the beginning of devotion.',
  'Let today be shaped by what you choose to notice.',
  'There is no need to rush a good beginning.'
];

function createDefaultState() {
  return { links: starterLinks.map((link) => ({ ...link })), tasks: [], notes: '', twentyFourHour: false, theme: 'night', wallpaper: '', wallpaperPreset: 'blue', wallpaperBlur: 0, wallpaperScale: 100, wallpaperPosition: 'center', greeting: '', weather: { city: '', temperature: null, description: '' }, timer: { seconds: 1500, running: false }, layout: { locked: false, hidden: [], positions: {} } };
}

const state = createDefaultState();
const linkGrid = document.querySelector('#link-grid');
const clock = document.querySelector('#clock-text');
const dateLabel = document.querySelector('#date-text');
const greeting = document.querySelector('#greeting-text');
const quote = document.querySelector('#quote');

function saveState() {
  const storage = globalThis.chrome?.storage?.local;
  if (storage) storage.set({ hearthState: state });
  else localStorage.setItem('hearthState', JSON.stringify(state));
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function renderQuote() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - yearStart) / 86400000);
  quote.textContent = quotes[dayOfYear % quotes.length];
}

function getStoredState() {
  return new Promise((resolve) => {
    const storage = globalThis.chrome?.storage?.local;
    if (storage) {
      storage.get('hearthState', (result) => resolve(result.hearthState));
      return;
    }
    try { resolve(JSON.parse(localStorage.getItem('hearthState'))); } catch { resolve(null); }
  });
}

function applyWallpaper() {
  const backdrop = document.querySelector('.backdrop');
  const presets = {
    blue: 'linear-gradient(145deg, rgba(25, 75, 155, .72), transparent 45%), radial-gradient(ellipse at 75% 18%, rgba(90, 178, 255, .34), transparent 25%), radial-gradient(ellipse at 28% 92%, rgba(22, 43, 112, .76), transparent 36%)',
    dusk: 'linear-gradient(145deg, rgba(62, 28, 103, .78), transparent 45%), radial-gradient(ellipse at 72% 15%, rgba(239, 133, 188, .28), transparent 27%), radial-gradient(ellipse at 20% 90%, rgba(20, 31, 91, .8), transparent 36%)',
    sea: 'linear-gradient(145deg, rgba(12, 82, 107, .8), transparent 45%), radial-gradient(ellipse at 78% 12%, rgba(107, 222, 205, .25), transparent 27%), radial-gradient(ellipse at 20% 88%, rgba(8, 43, 91, .82), transparent 36%)'
  };
  backdrop.style.backgroundImage = state.wallpaper ? `linear-gradient(rgba(11, 35, 74, .28), rgba(5, 15, 42, .5)), url("${state.wallpaper}")` : presets[state.wallpaperPreset] || presets.blue;
  backdrop.style.backgroundPosition = state.wallpaperPosition || 'center';
  backdrop.style.backgroundSize = state.wallpaper ? `${state.wallpaperScale || 100}%` : 'cover';
  backdrop.style.filter = `blur(${state.wallpaperBlur}px)`;
  document.querySelector('#wallpaper-blur').value = state.wallpaperBlur;
  document.querySelector('#wallpaper-blur-value').textContent = `${state.wallpaperBlur}px`;
  document.querySelector('#wallpaper-scale').value = state.wallpaperScale || 100;
  document.querySelector('#wallpaper-scale-value').textContent = `${state.wallpaperScale || 100}%`;
  document.querySelector('#wallpaper-position').value = state.wallpaperPosition || 'center';
}

function applyLayout() {
  const layout = state.layout || { locked: false, hidden: [], positions: {} };
  document.querySelectorAll('[data-widget]').forEach((widget) => {
    const name = widget.dataset.widget;
    const position = layout.positions?.[name] || { x: 0, y: 0 };
    widget.hidden = layout.hidden?.includes(name);
    widget.style.translate = `${position.x}px ${position.y}px`;
  });
  document.querySelector('#layout-lock-toggle').checked = layout.locked;
  document.querySelectorAll('[data-visibility]').forEach((input) => { input.checked = !layout.hidden?.includes(input.dataset.visibility); });
}

function renderTasks() {
  const list = document.querySelector('#task-list');
  list.innerHTML = '';
  state.tasks.forEach((task, index) => {
    const item = document.createElement('li');
    item.className = task.done ? 'completed' : '';
    item.innerHTML = `<label><input type="checkbox" ${task.done ? 'checked' : ''} /><span></span></label><button type="button" aria-label="Remove task">×</button>`;
    item.querySelector('span').textContent = task.text;
    item.querySelector('input').addEventListener('change', (event) => { state.tasks[index].done = event.target.checked; saveState(); renderTasks(); });
    item.querySelector('button').addEventListener('click', () => { state.tasks.splice(index, 1); saveState(); renderTasks(); });
    list.append(item);
  });
  document.querySelector('#task-count').textContent = state.tasks.filter((task) => !task.done).length;
}

function renderTimer() {
  const minutes = Math.floor(state.timer.seconds / 60).toString().padStart(2, '0');
  const seconds = (state.timer.seconds % 60).toString().padStart(2, '0');
  document.querySelector('#timer-display').textContent = `${minutes}:${seconds}`;
  document.querySelector('#timer-toggle').textContent = state.timer.running ? 'Pause' : 'Start';
  document.querySelector('#timer-status').textContent = state.timer.running ? 'In focus' : 'Ready';
}

function runTimer() {
  clearInterval(window.daymarkTimer);
  if (!state.timer.running) return;
  window.daymarkTimer = setInterval(() => {
    if (state.timer.seconds > 0) state.timer.seconds -= 1;
    else state.timer.running = false;
    renderTimer();
    saveState();
  }, 1000);
}

function weatherDescription(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 67) return 'Rain nearby';
  if (code <= 77) return 'Snow nearby';
  return 'Stormy';
}

function renderWeather() {
  const weather = state.weather || {};
  document.querySelector('#weather-location').textContent = weather.city || 'Set a city';
  document.querySelector('#weather-reading').textContent = weather.temperature === null ? '--°' : `${Math.round(weather.temperature)}°`;
  document.querySelector('#weather-input').value = weather.city || '';
  document.querySelector('#weather-city-input').value = weather.city || '';
}

async function loadWeather(city) {
  if (!city) return;
  document.querySelector('#weather-location').textContent = 'Loading...';
  try {
    const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const locationData = await locationResponse.json();
    const place = locationData.results?.[0];
    if (!place) throw new Error('City not found');
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`);
    const weatherData = await weatherResponse.json();
    state.weather = { city: place.name, temperature: weatherData.current.temperature_2m, description: weatherDescription(weatherData.current.weather_code) };
    saveState();
    renderWeather();
  } catch {
    document.querySelector('#weather-location').textContent = 'Unavailable offline';
  }
}

function setCustomizeMode(enabled) {
  document.body.classList.toggle('customizing', enabled);
  document.querySelector('#layout-edit-button').textContent = enabled ? 'Done editing' : 'Edit layout';
  document.querySelectorAll('[data-widget]').forEach((widget) => {
    let handle = widget.querySelector(':scope > .drag-handle');
    if (!handle) {
      handle = document.createElement('button');
      handle.className = 'drag-handle';
      handle.type = 'button';
      handle.textContent = '⠿';
      handle.title = 'Drag to move';
      widget.append(handle);
    }
    if (!handle.dataset.bound) {
      handle.addEventListener('pointerdown', startDrag);
      handle.dataset.bound = 'true';
    }
    handle.hidden = !enabled || state.layout.locked;
  });
}

function startDrag(event) {
  if (state.layout.locked) return;
  event.preventDefault();
  const widget = event.currentTarget.parentElement;
  const name = widget.dataset.widget;
  const origin = state.layout.positions[name] || { x: 0, y: 0 };
  const startX = event.clientX;
  const startY = event.clientY;
  const move = (moveEvent) => {
    const position = { x: origin.x + moveEvent.clientX - startX, y: origin.y + moveEvent.clientY - startY };
    state.layout.positions[name] = position;
    widget.style.translate = `${position.x}px ${position.y}px`;
  };
  const stop = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', stop);
    saveState();
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', stop, { once: true });
}

function restoreDefaults() {
  Object.assign(state, createDefaultState());
  document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme;
  document.querySelector('#wallpaper-input').value = '';
  document.querySelector('#greeting-input').value = '';
  document.querySelector('#notes-input').value = '';
  document.querySelector('#clock-toggle').checked = false;
  setCustomizeMode(false);
  applyWallpaper();
  applyLayout();
  renderLinks();
  renderTasks();
  renderTimer();
  renderWeather();
  runTimer();
  updateClock();
  saveState();
}

function renderLinks() {
  linkGrid.innerHTML = '';
  state.links.forEach((link, index) => {
    const card = document.createElement('a');
    card.className = 'link-card';
    card.href = link.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    const host = new URL(link.url).hostname.replace('www.', '');
    card.innerHTML = `<span class="link-icon" aria-hidden="true">${link.icon || link.name.slice(0, 1)}</span><span class="link-copy"><span class="link-name">${link.name}</span><span class="link-host">${host}</span></span><button class="delete-link" type="button" aria-label="Remove ${link.name}">×</button>`;
    card.querySelector('.delete-link').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.links.splice(index, 1);
      saveState();
      renderLinks();
    });
    linkGrid.append(card);
  });
}

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !state.twentyFourHour });
  dateLabel.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = now.getHours();
  greeting.textContent = state.greeting || `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, friend.`;
}

function openSettings(open) {
  document.querySelector('#settings-panel').classList.toggle('open', open);
  document.querySelector('#scrim').classList.toggle('open', open);
  document.querySelector('#settings-panel').setAttribute('aria-hidden', String(!open));
}

document.querySelector('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#search-input').value.trim();
  if (query) location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
});
document.querySelector('#add-link-button').addEventListener('click', () => document.querySelector('#link-dialog').showModal());
document.querySelector('#link-form').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const url = document.querySelector('#link-url').value.trim();
  state.links.push({ name: document.querySelector('#link-name').value.trim(), url: normalizeUrl(url), icon: document.querySelector('#link-icon').value });
  saveState();
  renderLinks();
  document.querySelector('#link-dialog').close();
  event.target.reset();
});
document.querySelector('#settings-button').addEventListener('click', () => openSettings(true));
document.querySelector('#close-settings').addEventListener('click', () => openSettings(false));
document.querySelector('#scrim').addEventListener('click', () => openSettings(false));
document.querySelector('#close-link-dialog').addEventListener('click', () => document.querySelector('#link-dialog').close());
document.querySelector('#clock-toggle').addEventListener('change', (event) => { state.twentyFourHour = event.target.checked; saveState(); updateClock(); });
document.querySelectorAll('.swatch').forEach((swatch) => swatch.addEventListener('click', () => { state.theme = swatch.dataset.theme; document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme; saveState(); }));
document.querySelector('#reset-button').addEventListener('click', () => { state.links = [...starterLinks]; saveState(); renderLinks(); });
document.querySelector('#task-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#task-input');
  const text = input.value.trim();
  if (!text) return;
  state.tasks.push({ text, done: false });
  input.value = '';
  saveState();
  renderTasks();
});
document.querySelector('#notes-input').addEventListener('input', (event) => { state.notes = event.target.value; document.querySelector('#notes-status').textContent = 'Saved'; saveState(); });
document.querySelector('#timer-toggle').addEventListener('click', () => { state.timer.running = !state.timer.running; renderTimer(); runTimer(); saveState(); });
document.querySelector('#timer-reset').addEventListener('click', () => { state.timer = { seconds: 1500, running: false }; renderTimer(); runTimer(); saveState(); });
document.querySelector('#weather-form').addEventListener('submit', (event) => { event.preventDefault(); loadWeather(document.querySelector('#weather-input').value.trim()); });
document.querySelector('#weather-city-input').addEventListener('change', (event) => loadWeather(event.target.value.trim()));
document.querySelectorAll('[data-wallpaper-preset]').forEach((button) => button.addEventListener('click', () => { state.wallpaper = ''; state.wallpaperPreset = button.dataset.wallpaperPreset; saveState(); applyWallpaper(); }));
document.querySelector('#wallpaper-input').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => { state.wallpaper = reader.result; saveState(); applyWallpaper(); });
  reader.readAsDataURL(file);
});
document.querySelector('#wallpaper-reset').addEventListener('click', () => { state.wallpaper = ''; saveState(); applyWallpaper(); document.querySelector('#wallpaper-input').value = ''; });
document.querySelector('#wallpaper-blur').addEventListener('input', (event) => { state.wallpaperBlur = Number(event.target.value); saveState(); applyWallpaper(); });
document.querySelector('#wallpaper-scale').addEventListener('input', (event) => { state.wallpaperScale = Number(event.target.value); saveState(); applyWallpaper(); });
document.querySelector('#wallpaper-position').addEventListener('change', (event) => { state.wallpaperPosition = event.target.value; saveState(); applyWallpaper(); });
document.querySelector('#greeting-input').addEventListener('input', (event) => { state.greeting = event.target.value.trim(); saveState(); updateClock(); });
document.querySelector('#greeting-reset').addEventListener('click', () => { state.greeting = ''; saveState(); document.querySelector('#greeting-input').value = ''; updateClock(); });
document.querySelector('#layout-edit-button').addEventListener('click', () => setCustomizeMode(!document.body.classList.contains('customizing')));
document.querySelector('#layout-lock-toggle').addEventListener('change', (event) => { state.layout.locked = event.target.checked; saveState(); setCustomizeMode(document.body.classList.contains('customizing')); });
document.querySelector('#defaults-button').addEventListener('click', () => restoreDefaults());
document.querySelector('#export-button').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'daymark-settings.json';
  link.click();
  URL.revokeObjectURL(link.href);
});
document.querySelector('#import-input').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      Object.assign(state, JSON.parse(reader.result));
      state.layout = { locked: false, hidden: [], positions: {}, ...(state.layout || {}) };
      document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme;
      applyWallpaper();
      applyLayout();
      document.querySelector('#greeting-input').value = state.greeting || '';
      document.querySelector('#clock-toggle').checked = state.twentyFourHour;
      renderTasks();
      renderTimer();
      renderWeather();
      document.querySelector('#notes-input').value = state.notes || '';
      renderLinks();
      updateClock();
      saveState();
    } catch { document.querySelector('#notes-status').textContent = 'Import failed'; }
  });
  reader.readAsText(file);
});
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { event.preventDefault(); document.querySelector('#search-input').focus(); }
  if (event.key === 'Escape') { openSettings(false); if (document.querySelector('#link-dialog').open) document.querySelector('#link-dialog').close(); }
});
document.querySelectorAll('[data-visibility]').forEach((input) => input.addEventListener('change', (event) => {
  const hidden = new Set(state.layout.hidden || []);
  if (event.target.checked) hidden.delete(event.target.dataset.visibility);
  else hidden.add(event.target.dataset.visibility);
  state.layout.hidden = [...hidden];
  saveState();
  applyLayout();
}));

getStoredState().then((stored) => {
  if (stored) Object.assign(state, stored);
  state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
  state.notes = state.notes || '';
  state.weather = { city: '', temperature: null, description: '', ...(state.weather || {}) };
  state.timer = { seconds: 1500, running: false, ...(state.timer || {}) };
  state.wallpaperPreset = state.wallpaperPreset || 'blue';
  state.wallpaperScale = state.wallpaperScale || 100;
  state.wallpaperPosition = state.wallpaperPosition || 'center';
  state.layout = { locked: false, hidden: [], positions: {}, ...(state.layout || {}) };
  document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme;
  applyWallpaper();
  applyLayout();
  document.querySelector('#greeting-input').value = state.greeting;
  document.querySelector('#clock-toggle').checked = state.twentyFourHour;
  document.querySelector('#notes-input').value = state.notes;
  renderTasks();
  renderTimer();
  renderWeather();
  runTimer();
  renderQuote();
  renderLinks();
  updateClock();
  setInterval(updateClock, 1000);
});