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
<<<<<<< Updated upstream
  return { links: starterLinks.map((link) => ({ ...link })), tasks: [], taskHistory: [], tasksDate: '', notes: '', twentyFourHour: false, theme: 'night', wallpaper: '', wallpaperPreset: 'blue', wallpaperBlur: 0, wallpaperScale: 100, wallpaperPosition: 'center', greeting: '', searchEngine: 'google', customSearchUrl: '', dailyReset: true, timerNotifications: true, quoteDaily: true, quoteIndex: 0, reducedMotion: false, minimalMode: false, onboardingComplete: false, weather: { city: '', temperature: null, description: '' }, timer: { seconds: 1500, durationMinutes: 25, running: false }, layout: { locked: false, hidden: [], positions: {} } };
=======
  return { links: starterLinks.map((link) => ({ ...link })), tasks: [], taskHistory: [], tasksDate: '', notes: '', twentyFourHour: false, theme: 'night', wallpaper: '', wallpaperCollection: [], wallpaperRotate: false, wallpaperPreset: 'blue', wallpaperBlur: 0, wallpaperScale: 100, wallpaperPosition: 'center', greeting: '', searchEngine: 'google', customSearchUrl: '', dailyReset: true, timerNotifications: true, timerCycles: false, timerBreakMinutes: 5, quoteDaily: true, quoteIndex: 0, reducedMotion: false, minimalMode: false, highContrast: false, textSize: 'normal', syncSettings: false, onboardingComplete: false, weather: { city: '', temperature: null, description: '', updatedAt: '', unit: 'celsius', forecast: [] }, timer: { seconds: 1500, durationMinutes: 25, running: false, phase: 'focus' }, layout: { locked: false, hidden: [], positions: {} } };
>>>>>>> Stashed changes
}

const state = createDefaultState();
const linkGrid = document.querySelector('#link-grid');
const clock = document.querySelector('#clock-text');
const dateLabel = document.querySelector('#date-text');
const greeting = document.querySelector('#greeting-text');
const quote = document.querySelector('#quote');

function todayKey() {
  return new Date().toLocaleDateString('en-CA');
}

function saveState() {
  const storage = globalThis.chrome?.storage?.local;
  if (storage) storage.set({ hearthState: state });
  else localStorage.setItem('hearthState', JSON.stringify(state));
  if (state.syncSettings && globalThis.chrome?.storage?.sync) {
    const syncState = { ...state, wallpaper: '', wallpaperCollection: [] };
    chrome.storage.sync.set({ hearthState: syncState });
  }
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function renderQuote() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - yearStart) / 86400000);
  const index = state.quoteDaily ? dayOfYear % quotes.length : state.quoteIndex % quotes.length;
  quote.textContent = quotes[index];
}

function refreshQuote() {
  state.quoteIndex = (state.quoteIndex + 1) % quotes.length;
  state.quoteDaily = false;
  document.querySelector('#quote-rotate-toggle').checked = false;
  renderQuote();
  saveState();
}

function applyPreferences() {
  document.body.classList.toggle('minimal-mode', state.minimalMode);
  document.body.classList.toggle('reduce-motion', state.reducedMotion);
  document.querySelector('#search-engine').value = state.searchEngine;
  document.querySelector('#custom-search-url').value = state.customSearchUrl;
  document.querySelector('#daily-reset-toggle').checked = state.dailyReset;
  document.querySelector('#timer-notification-toggle').checked = state.timerNotifications;
  document.querySelector('#quote-rotate-toggle').checked = state.quoteDaily;
  document.querySelector('#reduced-motion-toggle').checked = state.reducedMotion;
  document.querySelector('#minimal-mode-toggle').checked = state.minimalMode;
<<<<<<< Updated upstream
=======
  document.querySelector('#wallpaper-rotate-toggle').checked = state.wallpaperRotate;
  document.body.classList.toggle('high-contrast', state.highContrast);
  document.body.dataset.textSize = state.textSize;
  document.querySelector('#timer-cycles-toggle').checked = state.timerCycles;
  document.querySelector('#timer-break-input').value = state.timerBreakMinutes;
  document.querySelector('#sync-settings-toggle').checked = state.syncSettings;
  document.querySelector('#high-contrast-toggle').checked = state.highContrast;
  document.querySelector('#text-size').value = state.textSize;
  document.querySelector('#weather-unit').value = state.weather.unit;
  document.body.style.setProperty('--accent', state.accentColor || '#d5e78d');
  document.querySelector('#accent-color').value = state.accentColor || '#d5e78d';
}

function convertTemperature(celsius) {
  return state.weather.unit === 'fahrenheit' ? Math.round((celsius * 9 / 5) + 32) : Math.round(celsius);
}

function renderForecast() {
  const forecast = document.querySelector('#weather-forecast');
  forecast.innerHTML = '';
  (state.weather.forecast || []).forEach((day) => {
    const item = document.createElement('span');
    item.innerHTML = `<strong>${new Date(day.date).toLocaleDateString([], { weekday: 'short' })}</strong><small>${convertTemperature(day.high)}° / ${convertTemperature(day.low)}°</small>`;
    forecast.append(item);
  });
>>>>>>> Stashed changes
}

function rollOverTasks() {
  const today = todayKey();
  if (!state.tasksDate) state.tasksDate = today;
  if (state.dailyReset && state.tasksDate !== today && state.tasks.length) {
    const recurring = state.tasks.filter((task) => task.repeat === 'daily' || (task.repeat === 'weekly' && new Date(state.tasksDate).getDay() === new Date(today).getDay()));
    state.taskHistory.unshift({ date: state.tasksDate, tasks: state.tasks });
    state.taskHistory = state.taskHistory.slice(0, 30);
    state.tasks = recurring.map((task) => ({ ...task, done: false }));
  }
  state.tasksDate = today;
}

function searchUrl(query) {
  const engines = { google: 'https://www.google.com/search?q=%s', duckduckgo: 'https://duckduckgo.com/?q=%s', bing: 'https://www.bing.com/search?q=%s', kagi: 'https://kagi.com/search?q=%s' };
  const template = state.searchEngine === 'custom' ? state.customSearchUrl : engines[state.searchEngine];
  return (template || engines.google).replace('%s', encodeURIComponent(query));
}

function notifyFocusComplete() {
  if (!state.timerNotifications) return;
  if (globalThis.chrome?.notifications) {
    chrome.notifications.create({ type: 'basic', iconUrl: 'icon.svg', title: 'Daymark', message: 'Focus session complete.' });
  } else if (globalThis.Notification?.permission === 'granted') {
    new Notification('Daymark', { body: 'Focus session complete.' });
  }
}

function convertTemperature(celsius) {
  return state.weather.unit === 'fahrenheit' ? Math.round((celsius * 9 / 5) + 32) : Math.round(celsius);
}

function importBookmarks(nodes, links = []) {
  nodes.forEach((node) => {
    if (links.length >= 12) return;
    if (node.url) links.push({ name: node.title || new URL(node.url).hostname, url: node.url, icon: '★' });
    if (node.children) importBookmarks(node.children, links);
  });
  return links;
}

function getStoredState() {
  return new Promise((resolve) => {
    const storage = globalThis.chrome?.storage?.local;
    if (storage) {
      storage.get('hearthState', (result) => {
        if (result.hearthState || !globalThis.chrome?.storage?.sync) resolve(result.hearthState);
        else chrome.storage.sync.get('hearthState', (syncResult) => resolve(syncResult.hearthState));
      });
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
<<<<<<< Updated upstream
    item.innerHTML = `<label><input type="checkbox" ${task.done ? 'checked' : ''} /><span></span></label><button type="button" aria-label="Remove task">×</button>`;
=======
    item.innerHTML = `<label><input type="checkbox" ${task.done ? 'checked' : ''} /><span></span></label><span class="task-priority priority-${task.priority || 'normal'}">${task.priority || 'normal'}</span><span class="task-repeat">${task.repeat && task.repeat !== 'none' ? task.repeat : ''}</span><button class="move-task-up" type="button" aria-label="Move task up">↑</button><button type="button" aria-label="Remove task">×</button>`;
>>>>>>> Stashed changes
    item.querySelector('span').textContent = task.text;
    item.querySelector('input').addEventListener('change', (event) => { state.tasks[index].done = event.target.checked; saveState(); renderTasks(); });
    item.querySelector('button[aria-label="Remove task"]').addEventListener('click', () => { state.tasks.splice(index, 1); saveState(); renderTasks(); });
    item.querySelector('.move-task-up').addEventListener('click', () => { if (index > 0) [state.tasks[index - 1], state.tasks[index]] = [state.tasks[index], state.tasks[index - 1]]; saveState(); renderTasks(); });
    list.append(item);
  });
  document.querySelector('#task-count').textContent = state.tasks.filter((task) => !task.done).length;
}

function renderTaskHistory() {
  const list = document.querySelector('#task-history-list');
  list.innerHTML = '';
  if (!state.taskHistory.length) {
    list.textContent = 'No archived tasks yet.';
    return;
  }
  state.taskHistory.forEach((day) => {
    const section = document.createElement('section');
    section.innerHTML = `<strong>${day.date}</strong><p>${day.tasks.map((task) => task.text).join(' · ')}</p>`;
    list.append(section);
  });
}

function renderTimer() {
  const minutes = Math.floor(state.timer.seconds / 60).toString().padStart(2, '0');
  const seconds = (state.timer.seconds % 60).toString().padStart(2, '0');
  document.querySelector('#timer-display').textContent = `${minutes}:${seconds}`;
  document.querySelector('#timer-toggle').textContent = state.timer.running ? 'Pause' : 'Start';
  document.querySelector('#timer-status').textContent = state.timer.running ? (state.timer.phase === 'break' ? 'On break' : 'In focus') : 'Ready';
  document.querySelector('#timer-duration').value = state.timer.durationMinutes;
  document.querySelector('#timer-duration').disabled = state.timer.running;
}

function runTimer() {
  clearInterval(window.daymarkTimer);
  if (!state.timer.running) return;
  window.daymarkTimer = setInterval(() => {
    if (state.timer.seconds > 0) state.timer.seconds -= 1;
    else if (state.timerCycles && state.timer.phase === 'focus') {
      state.timer.phase = 'break';
      state.timer.seconds = state.timerBreakMinutes * 60;
    } else {
      state.timer.running = false;
      state.timer.phase = 'focus';
      notifyFocusComplete();
    }
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
<<<<<<< Updated upstream
  document.querySelector('#weather-location').textContent = weather.city || 'Set a city';
  document.querySelector('#weather-reading').textContent = weather.temperature === null ? '--°' : `${Math.round(weather.temperature)}°`;
=======
  document.querySelector('#weather-reading').textContent = weather.temperature === null ? '--°' : `${convertTemperature(weather.temperature)}°`;
  const updated = weather.updatedAt ? ` · ${new Date(weather.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '';
  document.querySelector('#weather-detail').textContent = weather.city ? `${weather.city} · ${weather.description || 'Current conditions'}${updated}` : 'Set a city to begin';
>>>>>>> Stashed changes
  document.querySelector('#weather-input').value = weather.city || '';
  document.querySelector('#weather-city-input').value = weather.city || '';
  renderForecast();
}

async function loadWeather(city) {
  if (!city) return;
  document.querySelector('#weather-detail').textContent = 'Loading...';
  try {
    const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const locationData = await locationResponse.json();
    const place = locationData.results?.[0];
    if (!place) throw new Error('City not found');
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=3&temperature_unit=celsius`);
    const weatherData = await weatherResponse.json();
<<<<<<< Updated upstream
    state.weather = { city: place.name, temperature: weatherData.current.temperature_2m, description: weatherDescription(weatherData.current.weather_code) };
=======
    state.weather = { ...state.weather, city: place.name, temperature: weatherData.current.temperature_2m, description: weatherDescription(weatherData.current.weather_code), updatedAt: new Date().toISOString(), forecast: weatherData.daily.time.map((date, index) => ({ date, high: weatherData.daily.temperature_2m_max[index], low: weatherData.daily.temperature_2m_min[index], description: weatherDescription(weatherData.daily.weather_code[index]) })) };
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
function applyLayoutPreset(preset) {
  const hiddenByPreset = {
    balanced: [],
    focus: ['links', 'todo', 'notes', 'weather', 'quote'],
    minimal: ['topbar', 'date', 'greeting', 'prompt', 'widgets', 'quote']
  };
  state.layout = { locked: false, hidden: hiddenByPreset[preset], positions: {} };
  state.minimalMode = preset === 'minimal';
  applyPreferences();
  applyLayout();
  saveState();
}

function openLinkDialog(index = null) {
  editingLinkIndex = index;
  const editing = index !== null;
  document.querySelector('#link-dialog-eyebrow').textContent = editing ? 'Edit shortcut' : 'New shortcut';
  document.querySelector('#link-dialog-title').textContent = editing ? 'Edit a place' : 'Add a place';
  if (editing) {
    const link = state.links[index];
    document.querySelector('#link-name').value = link.name;
    document.querySelector('#link-url').value = link.url;
    document.querySelector('#link-icon').value = link.icon;
    document.querySelector('#link-group').value = link.group || '';
  }
  document.querySelector('#link-dialog').showModal();
}

>>>>>>> Stashed changes
function renderLinks() {
  linkGrid.innerHTML = '';
  const groups = new Map();
  state.links.forEach((link, index) => {
    const group = link.group || 'Quick access';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ link, index });
  });
  groups.forEach((links, group) => {
    const heading = document.createElement('div');
    heading.className = 'link-group-heading';
    heading.textContent = group;
    linkGrid.append(heading);
    links.forEach(({ link, index }) => {
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
  if (query) location.href = searchUrl(query);
});
document.querySelector('#add-link-button').addEventListener('click', () => document.querySelector('#link-dialog').showModal());
document.querySelector('#link-form').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const url = document.querySelector('#link-url').value.trim();
<<<<<<< Updated upstream
  state.links.push({ name: document.querySelector('#link-name').value.trim(), url: normalizeUrl(url), icon: document.querySelector('#link-icon').value });
=======
  const link = { name: document.querySelector('#link-name').value.trim(), url: normalizeUrl(url), icon: document.querySelector('#link-icon').value, group: document.querySelector('#link-group').value.trim() };
  if (editingLinkIndex === null) state.links.push(link);
  else state.links[editingLinkIndex] = link;
>>>>>>> Stashed changes
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
document.querySelector('#search-engine').addEventListener('change', (event) => { state.searchEngine = event.target.value; saveState(); });
document.querySelector('#custom-search-url').addEventListener('change', (event) => { state.customSearchUrl = event.target.value.trim(); saveState(); });
document.querySelector('#daily-reset-toggle').addEventListener('change', (event) => { state.dailyReset = event.target.checked; saveState(); });
document.querySelector('#task-history-button').addEventListener('click', () => { renderTaskHistory(); document.querySelector('#task-history-dialog').showModal(); });
document.querySelector('#close-task-history-dialog').addEventListener('click', () => document.querySelector('#task-history-dialog').close());
document.querySelector('#timer-notification-toggle').addEventListener('change', (event) => {
  state.timerNotifications = event.target.checked;
  if (state.timerNotifications && globalThis.Notification?.permission === 'default') Notification.requestPermission();
  saveState();
});
document.querySelector('#timer-cycles-toggle').addEventListener('change', (event) => { state.timerCycles = event.target.checked; saveState(); });
document.querySelector('#timer-break-input').addEventListener('change', (event) => { state.timerBreakMinutes = Math.min(30, Math.max(1, Number(event.target.value) || 5)); applyPreferences(); saveState(); });
document.querySelector('#quote-rotate-toggle').addEventListener('change', (event) => { state.quoteDaily = event.target.checked; renderQuote(); saveState(); });
document.querySelector('#new-quote-button').addEventListener('click', refreshQuote);
document.querySelector('#reduced-motion-toggle').addEventListener('change', (event) => { state.reducedMotion = event.target.checked; applyPreferences(); saveState(); });
document.querySelector('#minimal-mode-toggle').addEventListener('change', (event) => { state.minimalMode = event.target.checked; applyPreferences(); saveState(); });
document.querySelector('#high-contrast-toggle').addEventListener('change', (event) => { state.highContrast = event.target.checked; applyPreferences(); saveState(); });
document.querySelector('#text-size').addEventListener('change', (event) => { state.textSize = event.target.value; applyPreferences(); saveState(); });
document.querySelector('#sync-settings-toggle').addEventListener('change', (event) => { state.syncSettings = event.target.checked; saveState(); });
document.querySelector('#accent-color').addEventListener('input', (event) => { state.accentColor = event.target.value; applyPreferences(); saveState(); });
document.querySelector('#import-bookmarks-button').addEventListener('click', () => {
  if (!globalThis.chrome?.bookmarks) return;
  chrome.bookmarks.getTree((tree) => {
    const imported = importBookmarks(tree).filter((link) => !state.links.some((existing) => existing.url === link.url));
    state.links.push(...imported);
    saveState();
    renderLinks();
  });
});
document.querySelectorAll('.swatch').forEach((swatch) => swatch.addEventListener('click', () => { state.theme = swatch.dataset.theme; document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme; saveState(); }));
document.querySelector('#reset-button').addEventListener('click', () => { state.links = [...starterLinks]; saveState(); renderLinks(); });
document.querySelector('#task-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#task-input');
  const text = input.value.trim();
  if (!text) return;
<<<<<<< Updated upstream
  state.tasks.push({ text, done: false });
=======
  state.tasks.push({ text, priority: document.querySelector('#task-priority').value, repeat: document.querySelector('#task-repeat').value, done: false });
>>>>>>> Stashed changes
  input.value = '';
  saveState();
  renderTasks();
});
document.querySelector('#notes-input').addEventListener('input', (event) => { state.notes = event.target.value; document.querySelector('#notes-status').textContent = 'Saved'; saveState(); });
document.querySelector('#timer-toggle').addEventListener('click', () => { state.timer.running = !state.timer.running; renderTimer(); runTimer(); saveState(); });
document.querySelector('#timer-duration').addEventListener('change', (event) => {
  const durationMinutes = Math.min(180, Math.max(1, Number(event.target.value) || 25));
  state.timer = { seconds: durationMinutes * 60, durationMinutes, running: false };
  renderTimer();
  runTimer();
  saveState();
});
document.querySelector('#timer-reset').addEventListener('click', () => { state.timer = { seconds: state.timer.durationMinutes * 60, durationMinutes: state.timer.durationMinutes, running: false }; renderTimer(); runTimer(); saveState(); });
document.querySelector('#weather-form').addEventListener('submit', (event) => { event.preventDefault(); loadWeather(document.querySelector('#weather-input').value.trim()); });
document.querySelector('#weather-city-input').addEventListener('change', (event) => loadWeather(event.target.value.trim()));
document.querySelector('#weather-unit').addEventListener('change', (event) => { state.weather.unit = event.target.value; renderWeather(); saveState(); });
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
      applyPreferences();
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
  const editable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.querySelector('#command-dialog').showModal(); }
  if (event.key === '/' && !editable) { event.preventDefault(); document.querySelector('#search-input').focus(); }
  if (!editable && /^[1-9]$/.test(event.key)) document.querySelectorAll('.link-card')[Number(event.key) - 1]?.click();
  if (!editable && event.key.toLowerCase() === 'n') { event.preventDefault(); document.querySelector('#task-input').focus(); }
  if (event.key === 'Escape') { openSettings(false); document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close()); }
});
document.querySelector('#close-command-dialog').addEventListener('click', () => document.querySelector('#command-dialog').close());
document.querySelectorAll('[data-command]').forEach((button) => button.addEventListener('click', () => {
  const command = button.dataset.command;
  document.querySelector('#command-dialog').close();
  if (command === 'search') document.querySelector('#search-input').focus();
  if (command === 'task') document.querySelector('#task-input').focus();
  if (command === 'settings') openSettings(true);
  if (command === 'minimal') { state.minimalMode = !state.minimalMode; applyPreferences(); saveState(); }
}));
document.querySelector('#onboarding-form').addEventListener('submit', (event) => {
  event.preventDefault();
  state.greeting = document.querySelector('#onboarding-name').value.trim();
  state.searchEngine = document.querySelector('#onboarding-search-engine').value;
  state.onboardingComplete = true;
  const city = document.querySelector('#onboarding-city').value.trim();
  if (city) loadWeather(city);
  document.querySelector('#onboarding-dialog').close();
  document.querySelector('#greeting-input').value = state.greeting;
  applyPreferences();
  updateClock();
  saveState();
});
document.querySelector('#skip-onboarding-button').addEventListener('click', () => { state.onboardingComplete = true; saveState(); document.querySelector('#onboarding-dialog').close(); });
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
  state.timer = { seconds: 1500, durationMinutes: 25, running: false, ...(state.timer || {}) };
  state.timer.phase = state.timer.phase || 'focus';
  state.timerBreakMinutes = Math.min(30, Math.max(1, Number(state.timerBreakMinutes) || 5));
  state.timerCycles = Boolean(state.timerCycles);
  state.wallpaperPreset = state.wallpaperPreset || 'blue';
  state.wallpaperScale = state.wallpaperScale || 100;
  state.wallpaperPosition = state.wallpaperPosition || 'center';
  state.layout = { locked: false, hidden: [], positions: {}, ...(state.layout || {}) };
  state.taskHistory = Array.isArray(state.taskHistory) ? state.taskHistory : [];
  state.searchEngine = state.searchEngine || 'google';
  state.weather.unit = state.weather.unit || 'celsius';
  state.weather.forecast = Array.isArray(state.weather.forecast) ? state.weather.forecast : [];
  state.textSize = state.textSize || 'normal';
  state.accentColor = state.accentColor || '#d5e78d';
  rollOverTasks();
  document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme;
  applyWallpaper();
  applyLayout();
  document.querySelector('#greeting-input').value = state.greeting;
  document.querySelector('#clock-toggle').checked = state.twentyFourHour;
  applyPreferences();
  document.querySelector('#notes-input').value = state.notes;
  renderTasks();
  renderTimer();
  renderWeather();
  runTimer();
  renderQuote();
  renderLinks();
  updateClock();
  if (!state.onboardingComplete) document.querySelector('#onboarding-dialog').showModal();
  setInterval(updateClock, 1000);
});