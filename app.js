const starterLinks = [
  { name: 'Gmail', url: 'https://mail.google.com', icon: '✉', group: 'Quick access' },
  { name: 'Calendar', url: 'https://calendar.google.com', icon: '▣', group: 'Quick access' },
  { name: 'Notes', url: 'https://keep.google.com', icon: '▤', group: 'Quick access' },
  { name: 'GitHub', url: 'https://github.com', icon: '⌘', group: 'Quick access' }
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
  return {
    links: starterLinks.map((link) => ({ ...link })),
    tasks: [],
    taskHistory: [],
    tasksDate: '',
    notes: '',
    twentyFourHour: false,
    theme: 'night',
    accentColor: '#d5e78d',
    wallpaper: '',
    wallpaperCollection: [],
    wallpaperRotate: false,
    wallpaperPreset: 'blue',
    wallpaperBlur: 0,
    wallpaperScale: 100,
    wallpaperPosition: 'center',
    greeting: '',
    searchEngine: 'google',
    customSearchUrl: '',
    dailyReset: true,
    timerNotifications: true,
    timerCycles: false,
    timerBreakMinutes: 5,
    quoteDaily: true,
    quoteIndex: 0,
    reducedMotion: false,
    minimalMode: false,
    highContrast: false,
    textSize: 'normal',
    syncSettings: false,
    onboardingComplete: false,
    weather: { city: '', temperature: null, description: '', updatedAt: '', unit: 'celsius', forecast: [] },
    timer: { seconds: 1500, durationMinutes: 25, running: false, phase: 'focus' },
    layout: { locked: false, hidden: [], positions: {} }
  };
}

const state = createDefaultState();
const linkGrid = document.querySelector('#link-grid');
const clock = document.querySelector('#clock-text');
const dateLabel = document.querySelector('#date-text');
const greeting = document.querySelector('#greeting-text');
const quote = document.querySelector('#quote');
const appVersion = '3.0.0';
let editingLinkIndex = null;

function todayKey() {
  return new Date().toLocaleDateString('en-CA');
}

function saveState() {
  const storage = globalThis.chrome?.storage?.local;
  try {
    if (storage) {
      storage.set({ hearthState: state });
    } else {
      localStorage.setItem('hearthState', JSON.stringify(state));
    }
  } catch (err) {
    console.warn('Daymark: Failed to save local state', err);
  }

  if (state.syncSettings && globalThis.chrome?.storage?.sync) {
    try {
      const syncState = { ...state, wallpaper: '', wallpaperCollection: [] };
      chrome.storage.sync.set({ hearthState: syncState });
    } catch (err) {
      console.warn('Daymark: Failed to save sync state', err);
    }
  }
}

function normalizeUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'https://';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getHostName(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return (url || '').replace(/^https?:\/\//i, '').split('/')[0] || url;
  }
}

function renderQuote() {
  if (!quote) return;
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - yearStart) / 86400000);
  const index = state.quoteDaily ? dayOfYear % quotes.length : state.quoteIndex % quotes.length;
  quote.textContent = quotes[index] || quotes[0];
}

function refreshQuote() {
  state.quoteIndex = (state.quoteIndex + 1) % quotes.length;
  state.quoteDaily = false;
  const rotateToggle = document.querySelector('#quote-rotate-toggle');
  if (rotateToggle) rotateToggle.checked = false;
  renderQuote();
  saveState();
}

function applyPreferences() {
  document.body.classList.toggle('minimal-mode', Boolean(state.minimalMode));
  document.body.classList.toggle('reduce-motion', Boolean(state.reducedMotion));
  document.body.classList.toggle('high-contrast', Boolean(state.highContrast));
  document.body.dataset.textSize = state.textSize || 'normal';
  document.body.style.setProperty('--accent', state.accentColor || '#d5e78d');

  const setVal = (selector, prop, val) => {
    const el = document.querySelector(selector);
    if (el) el[prop] = val;
  };

  setVal('#search-engine', 'value', state.searchEngine || 'google');
  setVal('#custom-search-url', 'value', state.customSearchUrl || '');
  setVal('#daily-reset-toggle', 'checked', Boolean(state.dailyReset));
  setVal('#timer-notification-toggle', 'checked', Boolean(state.timerNotifications));
  setVal('#quote-rotate-toggle', 'checked', Boolean(state.quoteDaily));
  setVal('#reduced-motion-toggle', 'checked', Boolean(state.reducedMotion));
  setVal('#minimal-mode-toggle', 'checked', Boolean(state.minimalMode));
  setVal('#wallpaper-rotate-toggle', 'checked', Boolean(state.wallpaperRotate));
  setVal('#timer-cycles-toggle', 'checked', Boolean(state.timerCycles));
  setVal('#timer-break-input', 'value', state.timerBreakMinutes || 5);
  setVal('#sync-settings-toggle', 'checked', Boolean(state.syncSettings));
  setVal('#high-contrast-toggle', 'checked', Boolean(state.highContrast));
  setVal('#text-size', 'value', state.textSize || 'normal');
  setVal('#weather-unit', 'value', state.weather?.unit || 'celsius');
  setVal('#accent-color', 'value', state.accentColor || '#d5e78d');
}

function convertTemperature(celsius) {
  if (celsius === null || celsius === undefined || Number.isNaN(Number(celsius))) return '--';
  return state.weather.unit === 'fahrenheit' ? Math.round((Number(celsius) * 9 / 5) + 32) : Math.round(Number(celsius));
}

function renderForecast() {
  const forecast = document.querySelector('#weather-forecast');
  if (!forecast) return;
  forecast.innerHTML = '';
  (state.weather?.forecast || []).forEach((day) => {
    const item = document.createElement('span');
    const dayName = new Date(day.date).toLocaleDateString([], { weekday: 'short' });
    item.innerHTML = `<strong>${dayName}</strong><small>${convertTemperature(day.high)}° / ${convertTemperature(day.low)}°</small>`;
    forecast.append(item);
  });
}

function rollOverTasks() {
  const today = todayKey();
  if (!state.tasksDate) state.tasksDate = today;
  if (state.dailyReset && state.tasksDate !== today && Array.isArray(state.tasks) && state.tasks.length) {
    const recurring = state.tasks.filter((task) => task.repeat === 'daily' || (task.repeat === 'weekly' && new Date(state.tasksDate).getDay() === new Date(today).getDay()));
    state.taskHistory.unshift({ date: state.tasksDate, tasks: state.tasks });
    state.taskHistory = state.taskHistory.slice(0, 30);
    state.tasks = recurring.map((task) => ({ ...task, done: false }));
  }
  state.tasksDate = today;
}

function searchUrl(query) {
  const engines = {
    google: 'https://www.google.com/search?q=%s',
    duckduckgo: 'https://duckduckgo.com/?q=%s',
    bing: 'https://www.bing.com/search?q=%s',
    kagi: 'https://kagi.com/search?q=%s'
  };
  const template = state.searchEngine === 'custom' ? state.customSearchUrl : engines[state.searchEngine];
  return (template || engines.google).replace('%s', encodeURIComponent(query));
}

function notifyFocusComplete() {
  if (!state.timerNotifications) return;
  try {
    if (globalThis.chrome?.notifications) {
      chrome.notifications.create({ type: 'basic', iconUrl: 'icon.svg', title: 'Daymark', message: 'Focus session complete.' });
    } else if (globalThis.Notification?.permission === 'granted') {
      new Notification('Daymark', { body: 'Focus session complete.' });
    }
  } catch (err) {
    console.warn('Daymark: Notification error', err);
  }
}

function importBookmarks(nodes, links = []) {
  if (!Array.isArray(nodes)) return links;
  nodes.forEach((node) => {
    if (links.length >= 12) return;
    if (node.url) links.push({ name: node.title || getHostName(node.url), url: node.url, icon: '★', group: 'Bookmarks' });
    if (node.children) importBookmarks(node.children, links);
  });
  return links;
}

function getStoredState() {
  return new Promise((resolve) => {
    const storage = globalThis.chrome?.storage?.local;
    if (storage) {
      try {
        storage.get('hearthState', (result) => {
          if (chrome.runtime?.lastError || !result) {
            fallbackLocalStorage(resolve);
            return;
          }
          if (result.hearthState || !globalThis.chrome?.storage?.sync) {
            resolve(result.hearthState || null);
          } else {
            chrome.storage.sync.get('hearthState', (syncResult) => {
              resolve(syncResult?.hearthState || result.hearthState || null);
            });
          }
        });
        return;
      } catch {
        fallbackLocalStorage(resolve);
        return;
      }
    }
    fallbackLocalStorage(resolve);
  });
}

function fallbackLocalStorage(resolve) {
  try {
    const raw = localStorage.getItem('hearthState');
    resolve(raw ? JSON.parse(raw) : null);
  } catch {
    resolve(null);
  }
}

function applyWallpaper() {
  const backdrop = document.querySelector('.backdrop');
  if (!backdrop) return;
  const presets = {
    blue: 'linear-gradient(145deg, rgba(25, 75, 155, .72), transparent 45%), radial-gradient(ellipse at 75% 18%, rgba(90, 178, 255, .34), transparent 25%), radial-gradient(ellipse at 28% 92%, rgba(22, 43, 112, .76), transparent 36%)',
    dusk: 'linear-gradient(145deg, rgba(62, 28, 103, .78), transparent 45%), radial-gradient(ellipse at 72% 15%, rgba(239, 133, 188, .28), transparent 27%), radial-gradient(ellipse at 20% 90%, rgba(20, 31, 91, .8), transparent 36%)',
    sea: 'linear-gradient(145deg, rgba(12, 82, 107, .8), transparent 45%), radial-gradient(ellipse at 78% 12%, rgba(107, 222, 205, .25), transparent 27%), radial-gradient(ellipse at 20% 88%, rgba(8, 43, 91, .82), transparent 36%)'
  };
  const wallpapers = state.wallpaperCollection || [];
  const dayIndex = [...todayKey()].reduce((total, character) => total + character.charCodeAt(0), 0);
  const wallpaper = state.wallpaperRotate && wallpapers.length ? wallpapers[dayIndex % wallpapers.length] : state.wallpaper;
  backdrop.style.backgroundImage = wallpaper ? `linear-gradient(rgba(11, 35, 74, .28), rgba(5, 15, 42, .5)), url("${wallpaper}")` : presets[state.wallpaperPreset] || presets.blue;
  backdrop.style.backgroundPosition = state.wallpaperPosition || 'center';
  backdrop.style.backgroundSize = wallpaper ? `${state.wallpaperScale || 100}%` : 'cover';
  backdrop.style.filter = `blur(${state.wallpaperBlur || 0}px)`;

  const setEl = (id, prop, val) => {
    const el = document.querySelector(id);
    if (el) el[prop] = val;
  };
  setEl('#wallpaper-blur', 'value', state.wallpaperBlur || 0);
  setEl('#wallpaper-blur-value', 'textContent', `${state.wallpaperBlur || 0}px`);
  setEl('#wallpaper-scale', 'value', state.wallpaperScale || 100);
  setEl('#wallpaper-scale-value', 'textContent', `${state.wallpaperScale || 100}%`);
  setEl('#wallpaper-position', 'value', state.wallpaperPosition || 'center');
}

function applyLayout() {
  const layout = state.layout || { locked: false, hidden: [], positions: {} };
  document.querySelectorAll('[data-widget]').forEach((widget) => {
    const name = widget.dataset.widget;
    const position = layout.positions?.[name] || { x: 0, y: 0 };
    widget.hidden = Array.isArray(layout.hidden) && layout.hidden.includes(name);
    widget.style.translate = `${position.x}px ${position.y}px`;
  });
  const lockToggle = document.querySelector('#layout-lock-toggle');
  if (lockToggle) lockToggle.checked = Boolean(layout.locked);
  document.querySelectorAll('[data-visibility]').forEach((input) => {
    input.checked = !layout.hidden?.includes(input.dataset.visibility);
  });
}

function renderTasks() {
  const list = document.querySelector('#task-list');
  if (!list) return;
  list.innerHTML = '';
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  (state.tasks || [])
    .map((task, index) => ({ task, index }))
    .sort((left, right) => (priorityOrder[left.task.priority || 'normal'] ?? 1) - (priorityOrder[right.task.priority || 'normal'] ?? 1))
    .forEach(({ task, index }) => {
      const item = document.createElement('li');
      item.className = task.done ? 'completed' : '';
      const repeatBadge = task.repeat && task.repeat !== 'none' ? `<span class="task-repeat">${task.repeat}</span>` : '';
      item.innerHTML = `<label><input type="checkbox" ${task.done ? 'checked' : ''} /><span></span></label><span class="task-priority priority-${task.priority || 'normal'}">${task.priority || 'normal'}</span>${repeatBadge}<button class="move-task-up" type="button" aria-label="Move task up">↑</button><button class="remove-task-btn" type="button" aria-label="Remove task">×</button>`;
      item.querySelector('span').textContent = task.text;
      item.querySelector('input')?.addEventListener('change', (event) => {
        state.tasks[index].done = event.target.checked;
        saveState();
        renderTasks();
      });
      item.querySelector('.remove-task-btn')?.addEventListener('click', () => {
        state.tasks.splice(index, 1);
        saveState();
        renderTasks();
      });
      item.querySelector('.move-task-up')?.addEventListener('click', () => {
        if (index > 0) {
          [state.tasks[index - 1], state.tasks[index]] = [state.tasks[index], state.tasks[index - 1]];
          saveState();
          renderTasks();
        }
      });
      list.append(item);
    });
  const countEl = document.querySelector('#task-count');
  if (countEl) countEl.textContent = (state.tasks || []).filter((task) => !task.done).length;
}

function renderTaskHistory() {
  const list = document.querySelector('#task-history-list');
  if (!list) return;
  list.innerHTML = '';
  if (!state.taskHistory || !state.taskHistory.length) {
    list.textContent = 'No archived tasks yet.';
    return;
  }
  state.taskHistory.forEach((day) => {
    const section = document.createElement('section');
    const taskTexts = (day.tasks || []).map((t) => t.text).join(' · ');
    section.innerHTML = `<strong>${day.date}</strong><p></p>`;
    section.querySelector('p').textContent = taskTexts || 'No tasks';
    list.append(section);
  });
}

function renderTimer() {
  const seconds = Number(state.timer?.seconds ?? 1500);
  const minutesDisplay = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secondsDisplay = (seconds % 60).toString().padStart(2, '0');

  const displayEl = document.querySelector('#timer-display');
  if (displayEl) displayEl.textContent = `${minutesDisplay}:${secondsDisplay}`;

  const toggleEl = document.querySelector('#timer-toggle');
  if (toggleEl) toggleEl.textContent = state.timer?.running ? 'Pause' : 'Start';

  const statusEl = document.querySelector('#timer-status');
  if (statusEl) {
    statusEl.textContent = state.timer?.running
      ? (state.timer.phase === 'break' ? 'On break' : 'In focus')
      : 'Ready';
  }

  const durationInput = document.querySelector('#timer-duration');
  if (durationInput) {
    durationInput.value = state.timer?.durationMinutes || 25;
    durationInput.disabled = Boolean(state.timer?.running);
  }
}

function runTimer() {
  clearInterval(window.daymarkTimer);
  if (!state.timer?.running) return;
  window.daymarkTimer = setInterval(() => {
    if (state.timer.seconds > 0) {
      state.timer.seconds -= 1;
    } else if (state.timerCycles && state.timer.phase === 'focus') {
      state.timer.phase = 'break';
      state.timer.seconds = (state.timerBreakMinutes || 5) * 60;
      notifyFocusComplete();
    } else {
      state.timer.running = false;
      state.timer.phase = 'focus';
      state.timer.seconds = (state.timer.durationMinutes || 25) * 60;
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
  const readingEl = document.querySelector('#weather-reading');
  if (readingEl) {
    readingEl.textContent = weather.temperature === null || weather.temperature === undefined ? '--°' : `${convertTemperature(weather.temperature)}°`;
  }

  const detailEl = document.querySelector('#weather-detail');
  if (detailEl) {
    const updated = weather.updatedAt ? ` · ${new Date(weather.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '';
    detailEl.textContent = weather.city ? `${weather.city} · ${weather.description || 'Current conditions'}${updated}` : 'Set a city to begin';
  }

  const inputEl = document.querySelector('#weather-input');
  if (inputEl) inputEl.value = weather.city || '';

  const cityInputEl = document.querySelector('#weather-city-input');
  if (cityInputEl) cityInputEl.value = weather.city || '';

  renderForecast();
}

async function loadWeather(city) {
  if (!city) return;
  const detailEl = document.querySelector('#weather-detail');
  if (detailEl) detailEl.textContent = 'Loading...';
  try {
    const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const locationData = await locationResponse.json();
    const place = locationData.results?.[0];
    if (!place) throw new Error('City not found');

    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=3&temperature_unit=celsius`);
    const weatherData = await weatherResponse.json();

    state.weather = {
      ...state.weather,
      city: place.name,
      temperature: weatherData.current?.temperature_2m ?? null,
      description: weatherDescription(weatherData.current?.weather_code),
      updatedAt: new Date().toISOString(),
      forecast: (weatherData.daily?.time || []).map((date, index) => ({
        date,
        high: weatherData.daily.temperature_2m_max[index],
        low: weatherData.daily.temperature_2m_min[index],
        description: weatherDescription(weatherData.daily.weather_code[index])
      }))
    };
    saveState();
    renderWeather();
  } catch {
    if (detailEl) detailEl.textContent = 'Unavailable offline';
  }
}

function setCustomizeMode(enabled) {
  document.body.classList.toggle('customizing', enabled);
  const editBtn = document.querySelector('#layout-edit-button');
  if (editBtn) editBtn.textContent = enabled ? 'Done editing' : 'Edit layout';

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
    handle.hidden = !enabled || Boolean(state.layout?.locked);
  });
}

function startDrag(event) {
  if (state.layout?.locked) return;
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

  const setVal = (sel, prop, val) => {
    const el = document.querySelector(sel);
    if (el) el[prop] = val;
  };
  setVal('#wallpaper-input', 'value', '');
  setVal('#greeting-input', 'value', '');
  setVal('#notes-input', 'value', '');
  setVal('#clock-toggle', 'checked', false);

  applyPreferences();
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

function applyLayoutPreset(preset) {
  const hiddenByPreset = {
    balanced: [],
    focus: ['links', 'todo', 'notes', 'weather', 'quote'],
    minimal: ['topbar', 'date', 'greeting', 'prompt', 'widgets', 'quote']
  };
  state.layout = { locked: false, hidden: hiddenByPreset[preset] || [], positions: {} };
  state.minimalMode = preset === 'minimal';
  applyPreferences();
  applyLayout();
  saveState();
}

function openLinkDialog(index = null) {
  editingLinkIndex = index;
  const editing = index !== null;
  const eyebrowEl = document.querySelector('#link-dialog-eyebrow');
  if (eyebrowEl) eyebrowEl.textContent = editing ? 'Edit shortcut' : 'New shortcut';
  const titleEl = document.querySelector('#link-dialog-title');
  if (titleEl) titleEl.textContent = editing ? 'Edit a place' : 'Add a place';

  if (editing && state.links[index]) {
    const link = state.links[index];
    const setVal = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.value = val;
    };
    setVal('#link-name', link.name || '');
    setVal('#link-url', link.url || '');
    setVal('#link-icon', link.icon || '✦');
    setVal('#link-group', link.group || '');
  }
  const dialog = document.querySelector('#link-dialog');
  if (dialog) dialog.showModal();
}

function renderLinks() {
  if (!linkGrid) return;
  linkGrid.innerHTML = '';
  const groups = new Map();
  (state.links || []).forEach((link, index) => {
    const group = link.group || 'Quick access';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ link, index });
  });

  const showGroupHeadings = groups.size > 1 || (groups.size === 1 && !groups.has('Quick access'));

  groups.forEach((links, group) => {
    if (showGroupHeadings) {
      const heading = document.createElement('div');
      heading.className = 'link-group-heading';
      heading.textContent = group;
      linkGrid.append(heading);
    }
    links.forEach(({ link, index }) => {
      const card = document.createElement('a');
      card.className = 'link-card';
      card.href = link.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      const host = getHostName(link.url);
      card.innerHTML = `<span class="link-icon" aria-hidden="true">${link.icon || (link.name || 'L').slice(0, 1)}</span><span class="link-copy"><span class="link-name">${link.name || 'Shortcut'}</span><span class="link-host">${host}</span></span><button class="edit-link" type="button" aria-label="Edit ${link.name}">Edit</button><button class="delete-link" type="button" aria-label="Remove ${link.name}">×</button>`;
      card.querySelector('.edit-link')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openLinkDialog(index);
      });
      card.querySelector('.delete-link')?.addEventListener('click', (event) => {
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
  if (clock) {
    clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !state.twentyFourHour });
  }
  if (dateLabel) {
    dateLabel.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }
  if (greeting) {
    const hour = now.getHours();
    greeting.textContent = state.greeting || `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, friend.`;
  }
}

function openSettings(open) {
  const panel = document.querySelector('#settings-panel');
  const scrim = document.querySelector('#scrim');
  if (panel) {
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
  }
  if (scrim) scrim.classList.toggle('open', open);
}

// Event Listeners with safe attachment
const safeOn = (selector, event, handler) => {
  const el = document.querySelector(selector);
  if (el) el.addEventListener(event, handler);
};

safeOn('#search-form', 'submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#search-input')?.value.trim();
  if (query) location.href = searchUrl(query);
});

safeOn('#add-link-button', 'click', () => openLinkDialog());

safeOn('#link-form', 'submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const url = document.querySelector('#link-url')?.value.trim() || '';
  const name = document.querySelector('#link-name')?.value.trim() || 'Shortcut';
  const icon = document.querySelector('#link-icon')?.value || '✦';
  const group = document.querySelector('#link-group')?.value.trim() || '';
  const link = { name, url: normalizeUrl(url), icon, group };

  if (editingLinkIndex === null) {
    state.links.push(link);
  } else {
    state.links[editingLinkIndex] = link;
  }
  saveState();
  renderLinks();
  document.querySelector('#link-dialog')?.close();
  event.target.reset();
  editingLinkIndex = null;
});

safeOn('#settings-button', 'click', () => openSettings(true));
safeOn('#close-settings', 'click', () => openSettings(false));
safeOn('#scrim', 'click', () => openSettings(false));
safeOn('#close-link-dialog', 'click', () => document.querySelector('#link-dialog')?.close());
safeOn('#link-dialog', 'close', () => { editingLinkIndex = null; });

safeOn('#clock-toggle', 'change', (event) => {
  state.twentyFourHour = event.target.checked;
  saveState();
  updateClock();
});

safeOn('#search-engine', 'change', (event) => {
  state.searchEngine = event.target.value;
  saveState();
});

safeOn('#custom-search-url', 'change', (event) => {
  state.customSearchUrl = event.target.value.trim();
  saveState();
});

safeOn('#daily-reset-toggle', 'change', (event) => {
  state.dailyReset = event.target.checked;
  saveState();
});

safeOn('#task-history-button', 'click', () => {
  renderTaskHistory();
  document.querySelector('#task-history-dialog')?.showModal();
});

safeOn('#close-task-history-dialog', 'click', () => {
  document.querySelector('#task-history-dialog')?.close();
});

safeOn('#timer-notification-toggle', 'change', (event) => {
  state.timerNotifications = event.target.checked;
  if (state.timerNotifications && globalThis.Notification?.permission === 'default') {
    Notification.requestPermission();
  }
  saveState();
});

safeOn('#timer-cycles-toggle', 'change', (event) => {
  state.timerCycles = event.target.checked;
  saveState();
});

safeOn('#timer-break-input', 'change', (event) => {
  state.timerBreakMinutes = Math.min(30, Math.max(1, Number(event.target.value) || 5));
  applyPreferences();
  saveState();
});

safeOn('#quote-rotate-toggle', 'change', (event) => {
  state.quoteDaily = event.target.checked;
  renderQuote();
  saveState();
});

safeOn('#new-quote-button', 'click', refreshQuote);

safeOn('#reduced-motion-toggle', 'change', (event) => {
  state.reducedMotion = event.target.checked;
  applyPreferences();
  saveState();
});

safeOn('#minimal-mode-toggle', 'change', (event) => {
  state.minimalMode = event.target.checked;
  applyPreferences();
  saveState();
});

safeOn('#high-contrast-toggle', 'change', (event) => {
  state.highContrast = event.target.checked;
  applyPreferences();
  saveState();
});

safeOn('#text-size', 'change', (event) => {
  state.textSize = event.target.value;
  applyPreferences();
  saveState();
});

safeOn('#sync-settings-toggle', 'change', (event) => {
  state.syncSettings = event.target.checked;
  saveState();
});

safeOn('#accent-color', 'input', (event) => {
  state.accentColor = event.target.value;
  applyPreferences();
  saveState();
});

safeOn('#import-bookmarks-button', 'click', () => {
  if (!globalThis.chrome?.bookmarks) return;
  chrome.bookmarks.getTree((tree) => {
    const imported = importBookmarks(tree).filter((link) => !state.links.some((existing) => existing.url === link.url));
    state.links.push(...imported);
    saveState();
    renderLinks();
  });
});

document.querySelectorAll('.swatch').forEach((swatch) => {
  swatch.addEventListener('click', () => {
    state.theme = swatch.dataset.theme;
    document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme;
    saveState();
  });
});

document.querySelectorAll('[data-layout-preset]').forEach((button) => {
  button.addEventListener('click', () => applyLayoutPreset(button.dataset.layoutPreset));
});

safeOn('#reset-button', 'click', () => {
  state.links = starterLinks.map((l) => ({ ...l }));
  saveState();
  renderLinks();
});

safeOn('#task-form', 'submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#task-input');
  const text = input?.value.trim();
  if (!text) return;
  const priority = document.querySelector('#task-priority')?.value || 'normal';
  const repeat = document.querySelector('#task-repeat')?.value || 'none';
  state.tasks.push({ text, priority, repeat, done: false });
  if (input) input.value = '';
  saveState();
  renderTasks();
});

safeOn('#notes-input', 'input', (event) => {
  state.notes = event.target.value;
  const statusEl = document.querySelector('#notes-status');
  if (statusEl) statusEl.textContent = 'Saved';
  saveState();
});

safeOn('#timer-toggle', 'click', () => {
  state.timer.running = !state.timer.running;
  renderTimer();
  runTimer();
  saveState();
});

safeOn('#timer-duration', 'change', (event) => {
  const durationMinutes = Math.min(180, Math.max(1, Number(event.target.value) || 25));
  state.timer = { seconds: durationMinutes * 60, durationMinutes, running: false, phase: 'focus' };
  renderTimer();
  runTimer();
  saveState();
});

document.querySelectorAll('[data-timer-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    const durationMinutes = Number(button.dataset.timerPreset) || 25;
    state.timer = { seconds: durationMinutes * 60, durationMinutes, running: false, phase: 'focus' };
    renderTimer();
    runTimer();
    saveState();
  });
});

safeOn('#timer-reset', 'click', () => {
  const durationMinutes = state.timer?.durationMinutes || 25;
  state.timer = { seconds: durationMinutes * 60, durationMinutes, running: false, phase: 'focus' };
  renderTimer();
  runTimer();
  saveState();
});

safeOn('#weather-form', 'submit', (event) => {
  event.preventDefault();
  const city = document.querySelector('#weather-input')?.value.trim();
  if (city) loadWeather(city);
});

safeOn('#weather-refresh', 'click', () => {
  if (state.weather?.city) loadWeather(state.weather.city);
});

safeOn('#weather-city-input', 'change', (event) => {
  const city = event.target.value.trim();
  if (city) loadWeather(city);
});

safeOn('#weather-unit', 'change', (event) => {
  state.weather.unit = event.target.value;
  renderWeather();
  saveState();
});

document.querySelectorAll('[data-wallpaper-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    state.wallpaper = '';
    state.wallpaperPreset = button.dataset.wallpaperPreset;
    saveState();
    applyWallpaper();
  });
});

safeOn('#wallpaper-input', 'change', (event) => {
  const [file] = event.target.files;
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    state.wallpaper = reader.result;
    state.wallpaperCollection = [...(state.wallpaperCollection || []), reader.result].slice(-5);
    saveState();
    applyWallpaper();
  });
  reader.readAsDataURL(file);
});

safeOn('#wallpaper-reset', 'click', () => {
  state.wallpaper = '';
  saveState();
  applyWallpaper();
  const input = document.querySelector('#wallpaper-input');
  if (input) input.value = '';
});

safeOn('#wallpaper-rotate-toggle', 'change', (event) => {
  state.wallpaperRotate = event.target.checked;
  saveState();
  applyWallpaper();
});

safeOn('#wallpaper-blur', 'input', (event) => {
  state.wallpaperBlur = Number(event.target.value);
  saveState();
  applyWallpaper();
});

safeOn('#wallpaper-scale', 'input', (event) => {
  state.wallpaperScale = Number(event.target.value);
  saveState();
  applyWallpaper();
});

safeOn('#wallpaper-position', 'change', (event) => {
  state.wallpaperPosition = event.target.value;
  saveState();
  applyWallpaper();
});

safeOn('#greeting-input', 'input', (event) => {
  state.greeting = event.target.value.trim();
  saveState();
  updateClock();
});

safeOn('#greeting-reset', 'click', () => {
  state.greeting = '';
  saveState();
  const input = document.querySelector('#greeting-input');
  if (input) input.value = '';
  updateClock();
});

safeOn('#layout-edit-button', 'click', () => {
  setCustomizeMode(!document.body.classList.contains('customizing'));
});

safeOn('#layout-lock-toggle', 'change', (event) => {
  state.layout.locked = event.target.checked;
  saveState();
  setCustomizeMode(document.body.classList.contains('customizing'));
});

safeOn('#defaults-button', 'click', () => restoreDefaults());

safeOn('#clear-notes-button', 'click', () => {
  if (!confirm('Clear all notes? This cannot be undone.')) return;
  state.notes = '';
  const input = document.querySelector('#notes-input');
  if (input) input.value = '';
  saveState();
});

safeOn('#clear-completed-button', 'click', () => {
  state.tasks = state.tasks.filter((task) => !task.done);
  renderTasks();
  saveState();
});

safeOn('#clear-data-button', 'click', () => {
  if (confirm('Clear all Daymark data and restore defaults? This cannot be undone.')) {
    restoreDefaults();
  }
});

safeOn('#export-button', 'click', () => {
  const backup = { schemaVersion: 2, exportedAt: new Date().toISOString(), daymarkVersion: appVersion, state };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'daymark-settings.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

safeOn('#import-input', 'change', (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const backup = JSON.parse(reader.result);
      const importedState = backup.state || backup;
      if (!importedState || typeof importedState !== 'object' || !Array.isArray(importedState.links)) {
        throw new Error('Invalid Daymark backup');
      }
      Object.assign(state, importedState);
      state.layout = { locked: false, hidden: [], positions: {}, ...(state.layout || {}) };
      document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme;
      applyWallpaper();
      applyLayout();
      const greetingInput = document.querySelector('#greeting-input');
      if (greetingInput) greetingInput.value = state.greeting || '';
      const clockToggle = document.querySelector('#clock-toggle');
      if (clockToggle) clockToggle.checked = Boolean(state.twentyFourHour);
      applyPreferences();
      renderTasks();
      renderTimer();
      renderWeather();
      const notesInput = document.querySelector('#notes-input');
      if (notesInput) notesInput.value = state.notes || '';
      renderLinks();
      updateClock();
      saveState();
    } catch {
      const statusEl = document.querySelector('#notes-status');
      if (statusEl) statusEl.textContent = 'Import failed';
    }
  });
  reader.readAsText(file);
});

document.addEventListener('keydown', (event) => {
  const editable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('#command-dialog')?.showModal();
  }
  if (event.key === '/' && !editable) {
    event.preventDefault();
    document.querySelector('#search-input')?.focus();
  }
  if (!editable && /^[1-9]$/.test(event.key)) {
    document.querySelectorAll('.link-card')[Number(event.key) - 1]?.click();
  }
  if (!editable && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    document.querySelector('#task-input')?.focus();
  }
  if (event.key === 'Escape') {
    openSettings(false);
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
  }
});

safeOn('#close-command-dialog', 'click', () => {
  document.querySelector('#command-dialog')?.close();
});

document.querySelectorAll('[data-command]').forEach((button) => {
  button.addEventListener('click', () => {
    const command = button.dataset.command;
    document.querySelector('#command-dialog')?.close();
    if (command === 'search') document.querySelector('#search-input')?.focus();
    if (command === 'task') document.querySelector('#task-input')?.focus();
    if (command === 'settings') openSettings(true);
    if (command === 'minimal') {
      state.minimalMode = !state.minimalMode;
      applyPreferences();
      saveState();
    }
  });
});

safeOn('#onboarding-form', 'submit', (event) => {
  event.preventDefault();
  state.greeting = document.querySelector('#onboarding-name')?.value.trim() || '';
  state.searchEngine = document.querySelector('#onboarding-search-engine')?.value || 'google';
  state.onboardingComplete = true;
  const city = document.querySelector('#onboarding-city')?.value.trim();
  if (city) loadWeather(city);
  document.querySelector('#onboarding-dialog')?.close();
  const greetingInput = document.querySelector('#greeting-input');
  if (greetingInput) greetingInput.value = state.greeting;
  applyPreferences();
  updateClock();
  saveState();
});

safeOn('#skip-onboarding-button', 'click', () => {
  state.onboardingComplete = true;
  saveState();
  document.querySelector('#onboarding-dialog')?.close();
});

document.querySelectorAll('[data-visibility]').forEach((input) => {
  input.addEventListener('change', (event) => {
    const hidden = new Set(state.layout?.hidden || []);
    if (event.target.checked) hidden.delete(event.target.dataset.visibility);
    else hidden.add(event.target.dataset.visibility);
    state.layout.hidden = [...hidden];
    saveState();
    applyLayout();
  });
});

// Initialization
getStoredState().then((stored) => {
  if (stored && typeof stored === 'object') {
    Object.assign(state, stored);
  }
  state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
  state.notes = state.notes || '';
  state.weather = { city: '', temperature: null, description: '', updatedAt: '', unit: 'celsius', forecast: [], ...(state.weather || {}) };
  state.timer = { seconds: 1500, durationMinutes: 25, running: false, phase: 'focus', ...(state.timer || {}) };
  state.timerBreakMinutes = Math.min(30, Math.max(1, Number(state.timerBreakMinutes) || 5));
  state.timerCycles = Boolean(state.timerCycles);
  state.wallpaperPreset = state.wallpaperPreset || 'blue';
  state.wallpaperScale = state.wallpaperScale || 100;
  state.wallpaperPosition = state.wallpaperPosition || 'center';
  state.wallpaperCollection = Array.isArray(state.wallpaperCollection) ? state.wallpaperCollection : (state.wallpaper ? [state.wallpaper] : []);
  state.wallpaperRotate = Boolean(state.wallpaperRotate);
  state.layout = { locked: false, hidden: [], positions: {}, ...(state.layout || {}) };
  state.taskHistory = Array.isArray(state.taskHistory) ? state.taskHistory : [];
  state.searchEngine = state.searchEngine || 'google';
  state.textSize = state.textSize || 'normal';
  state.accentColor = state.accentColor || '#d5e78d';

  rollOverTasks();
  document.body.dataset.theme = state.theme === 'moss' ? '' : state.theme;
  applyWallpaper();
  applyLayout();

  const greetingInput = document.querySelector('#greeting-input');
  if (greetingInput) greetingInput.value = state.greeting || '';

  const clockToggle = document.querySelector('#clock-toggle');
  if (clockToggle) clockToggle.checked = Boolean(state.twentyFourHour);

  applyPreferences();

  const notesInput = document.querySelector('#notes-input');
  if (notesInput) notesInput.value = state.notes || '';

  renderTasks();
  renderTimer();
  renderWeather();
  runTimer();
  renderQuote();
  renderLinks();
  updateClock();

  if (!state.onboardingComplete) {
    try {
      document.querySelector('#onboarding-dialog')?.showModal();
    } catch {}
  }
  setInterval(updateClock, 1000);
});