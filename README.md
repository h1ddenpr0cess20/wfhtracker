# WFH Tracker

<p align="center">
  <img src="logo.svg" alt="WFH Tracker Logo" width="128" height="128" />
</p>

A simple time tracker extension for work-from-home jobs.

## Features
- ⏱️ Start and stop tracking your work sessions
- 📋 View a log of tracked entries grouped by task
- 📤 Export your log to CSV
- 🌗 Minimal and easy-to-use interface with dark mode
- 🔄 Quickly select previously used task names from a dropdown

## How it works
1. Click the extension icon to open the popup.
2. Enter a task name and press Start to begin tracking.
3. Press Stop to end a session; your entry is saved automatically.
4. View, edit, delete, or resume entries from the log.
5. Export your log to CSV for reporting or backup.

## File Overview
- `popup.html`, `popup.js`: Main popup interface and logic
- `entries.html`, `entries.js`: View and manage tracked entries
- `styles.css`: Basic styling
- `manifest.json`: Extension configuration
- `logo.svg`: Extension and branding icon

## Requirements
- Chromium-based browser (e.g., Chrome, Edge)

## Installation
1. Download or clone this repository to your computer.
2. Open your Chromium-based browser and go to the Extensions page (`chrome://extensions` or `edge://extensions`).
3. Enable "Developer mode" (toggle in the top right corner).
4. Click "Load unpacked" and select the folder containing the extension files.
5. The WFH Tracker icon will appear in your browser toolbar.
