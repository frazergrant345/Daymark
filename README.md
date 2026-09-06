# Daymark

[![Latest Release](https://img.shields.io/github/v/release/frazergrant345/Daymark)](https://github.com/frazergrant345/Daymark/releases/latest)
[![Download Beta 1.1.0](https://img.shields.io/badge/download-beta--2.0-orange)](https://github.com/frazergrant345/Daymark/releases/tag/V2.0-Beta)

Daymark is a calm, personal dashboard that replaces your browser's new-tab page with a little room to begin. It combines a clock, search, shortcuts, lightweight planning tools, and customizable visual settings in one focused workspace.

## Features

- Live date, time, and automatic or custom greetings
- Web search from the new-tab page
- Starter shortcuts for Gmail, Calendar, Notes, and GitHub
- Add, remove, and restore custom shortcuts
- Daily task list with completion tracking
- Persistent notes area
- 25-minute focus timer with start, pause, and reset controls
- Focus completion notifications
- Weather lookup by city using Open-Meteo
- Google, DuckDuckGo, Bing, Kagi, and custom search engines
- Keyboard shortcuts for search, tasks, shortcuts, and a command palette
- Optional daily task rollover with a browsable 30-day task history
- Optional Chrome bookmark import
- Quote refresh and daily rotation controls
- First-run setup, minimal mode, and reduced-motion support
- Theme options, wallpaper presets, and custom image wallpapers
- Wallpaper blur, scale, and position controls
- Customizable widget visibility and drag-and-drop layout
- 12-hour or 24-hour clock display
- Export and import settings as JSON
- Persistent state through Chrome storage, with local-storage fallback when opened directly

## Install In Chrome

1. Download the [latest release](https://github.com/frazergrant345/Daymark/releases/latest) and unzip it (or clone this repository).
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the Daymark project folder.
6. Open a new tab to see Daymark.

To apply changes while developing, return to `chrome://extensions` and select the extension's reload button.

Daymark requests Chrome's `bookmarks` permission only to import shortcuts and `notifications` permission only to notify you when a focus session ends. Neither feature sends data away from your browser.

## Usage

- Use the search field to search the web. Press `/` from anywhere on the page to focus it.
- Select **Add link** to create a shortcut.
- Add tasks in **Today**, write in **Notes**, or start the **Focus** timer.
- Open the settings button to change the theme, wallpaper, greeting, clock format, weather city, and visible widgets.
- Choose **Edit layout** in settings to move widgets. Enable **Lock position** when the layout is set.
- Use **Export settings** to save a backup, or **Import settings** to restore one.

## Weather

Weather data is loaded from the free [Open-Meteo API](https://open-meteo.com/). Daymark uses its geocoding endpoint to find the selected city and its forecast endpoint to retrieve the current temperature. Weather requires an internet connection; the rest of the dashboard works locally.

## Project Structure

```text
.
├── app.js         # Dashboard behavior, state, storage, and integrations
├── icon.svg       # Extension icon assets
├── index.html     # New-tab page markup
├── manifest.json  # Chrome Manifest V3 configuration
├── styles.css     # Layout, themes, responsive styles, and animations
└── README.md      # Project documentation
```

## Technology

- HTML
- CSS
- Vanilla JavaScript
- Chrome Extensions Manifest V3
- Chrome Storage API with localStorage fallback
- Open-Meteo geocoding and weather APIs

## Development

Daymark has no build step or package dependencies. Edit the source files directly, reload the unpacked extension from `chrome://extensions`, and open a new tab to test changes.

## License

MIT License
