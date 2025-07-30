# WFH Tracker

<p align="center">
  <img src="assets/logo.svg" alt="WFH Tracker Logo" width="128" height="128" />
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

## Project Structure
```
wfhtracker/
├── manifest.json                    # Extension configuration
├── README.md                        # Project documentation
├── src/                            # Source code
│   ├── popup/                      # Main popup interface
│   │   ├── popup.html             # Popup HTML structure
│   │   └── popup.js               # Popup logic and functionality
│   ├── entries/                    # Entries management page
│   │   ├── entries.html           # Entries page HTML structure
│   │   └── entries.js             # Entries page logic
│   └── styles/                     # Stylesheets
│       └── styles.css             # Main stylesheet
└── assets/                         # Static assets
    ├── logo.svg                   # Extension and branding logo
    └── icons/                     # Extension icons
        ├── icon16.png            # 16x16 icon
        ├── icon48.png            # 48x48 icon
        └── icon128.png           # 128x128 icon
```

## Requirements
- Chromium-based browser (e.g., Chrome, Edge)

## Installation
1. Download or clone this repository to your computer.
2. Open your Chromium-based browser and go to the Extensions page (`chrome://extensions` or `edge://extensions`).
3. Enable "Developer mode" (toggle in the top right corner).
4. Click "Load unpacked" and select the folder containing the extension files.
5. The WFH Tracker icon will appear in your browser toolbar.
