// popup.js
// Handles the user interface and storage for the Time Tracker extension.
;(function () {
  const taskInput = document.getElementById('taskName');
  const timerDisplay = document.getElementById('timerDisplay');
  const startStopBtn = document.getElementById('startStopBtn');
  const openTableBtn = document.getElementById('openTableBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const entriesList = document.getElementById('entriesList');

  let timerInterval = null;

  /**
   * Convert a duration in milliseconds into a HH:MM:SS string.
   * @param {number} ms Duration in milliseconds.
   * @returns {string} Formatted time string.
   */
  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  /**
   * Populate the datalist for task names.
   * @param {Array<string>} names
   */
  function updateTaskDatalist(names) {
    const list = document.getElementById('taskNamesList');
    if (!list) return;
    list.innerHTML = '';
    names.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      list.appendChild(option);
    });
  }

  /**
   * Render the list of completed time entries into the DOM.
   * Adds action buttons to each entry for editing, deleting and resuming.
   * @param {Array<Object>} entries Array of time entry objects.
   */
  function renderEntries(entries) {
    entriesList.innerHTML = '';
    if (!entries || entries.length === 0) {
      const li = document.createElement('li');
      li.className = 'entry';
      li.textContent = 'No entries yet.';
      entriesList.appendChild(li);
      return;
    }
    entries.forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'entry';
      li.dataset.entryId = String(entry.id);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'entry-content';

      const taskDiv = document.createElement('div');
      taskDiv.className = 'entry-task';
      taskDiv.textContent = entry.taskName;

      const timeDiv = document.createElement('div');
      timeDiv.className = 'entry-time';
      timeDiv.textContent = formatTime(entry.duration);

      const periodDiv = document.createElement('div');
      periodDiv.className = 'entry-period';
      const startDate = new Date(entry.startTime);
      const endDate = new Date(entry.endTime);
      periodDiv.textContent = `${startDate.toLocaleString()} – ${endDate.toLocaleString()}`;

      contentDiv.appendChild(taskDiv);
      contentDiv.appendChild(timeDiv);
      contentDiv.appendChild(periodDiv);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'entry-actions';

      // Resume button
      const resumeBtn = document.createElement('button');
      resumeBtn.className = 'entry-action-btn resume-btn';
      resumeBtn.textContent = 'Resume';
      resumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleResumeEntry(entry.taskName);
      });

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'entry-action-btn edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleEditEntry(entry.id);
      });

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'entry-action-btn delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteEntry(entry.id);
      });

      actionsDiv.appendChild(resumeBtn);
      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(contentDiv);
      li.appendChild(actionsDiv);
      entriesList.appendChild(li);
    });
  }

  /**
   * Update the running timer display based on the provided entry.
   * @param {Object} runningEntry The currently running time entry.
   */
  function updateTimer(runningEntry) {
    const elapsed = Date.now() - runningEntry.startTime;
    timerDisplay.textContent = formatTime(elapsed);
  }

  /**
   * Load the current state from chrome.storage and initialise the UI accordingly.
   */
  function loadState() {
    chrome.storage.local.get(['runningEntry', 'timeEntries', 'taskNames', 'darkMode'], (data) => {
      const runningEntry = data.runningEntry;
      const timeEntries = data.timeEntries || [];
      const taskNames = data.taskNames || [];
      const darkMode = data.darkMode || false;
      // Render entries and tasks list
      renderEntries(timeEntries);
      updateTaskDatalist(taskNames);
      // Set dark mode
      if (darkMode) {
        document.body.classList.add('dark');
        if (themeToggleBtn) themeToggleBtn.textContent = '☀️';
      } else {
        document.body.classList.remove('dark');
        if (themeToggleBtn) themeToggleBtn.textContent = '🌙';
      }
      if (runningEntry) {
        // There is an active timer.
        startStopBtn.textContent = 'Stop';
        taskInput.value = runningEntry.taskName;
        // Update the timer immediately and then every second.
        updateTimer(runningEntry);
        timerInterval = setInterval(() => updateTimer(runningEntry), 1000);
      } else {
        // No active timer.
        timerDisplay.textContent = '00:00:00';
        startStopBtn.textContent = 'Start';
      }
    });
  }

  /**
   * Persist a new task name into the taskNames array if it doesn't already exist.
   * @param {string} name
   */
  function persistTaskName(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    chrome.storage.local.get('taskNames', (data) => {
      let names = data.taskNames || [];
      if (!names.includes(trimmed)) {
        names.push(trimmed);
        chrome.storage.local.set({ taskNames: names }, () => {
          updateTaskDatalist(names);
        });
      }
    });
  }

  /**
   * Start a new timer for the task specified in the input field.
   */
  function startTimer() {
    const taskName = taskInput.value.trim();
    if (!taskName) {
      alert('Please enter a task name.');
      return;
    }
    chrome.storage.local.get('runningEntry', (data) => {
      if (data.runningEntry) {
        // A timer is already running. Do not start another.
        return;
      }
      const now = Date.now();
      const newEntry = {
        id: now,
        taskName: taskName,
        startTime: now,
      };
      chrome.storage.local.set({ runningEntry: newEntry }, () => {
        // Persist task name to suggestions
        persistTaskName(taskName);
        startStopBtn.textContent = 'Stop';
        timerDisplay.textContent = '00:00:00';
        updateTimer(newEntry);
        timerInterval = setInterval(() => updateTimer(newEntry), 1000);
      });
    });
  }

  /**
   * Stop the currently running timer and persist the completed entry.
   * Accepts an optional callback executed once the entry is stored and UI updated.
   * @param {Function} [cb]
   */
  function stopTimer(cb) {
    chrome.storage.local.get(['runningEntry', 'timeEntries'], (data) => {
      const runningEntry = data.runningEntry;
      if (!runningEntry) {
        if (typeof cb === 'function') cb();
        return;
      }
      const endTime = Date.now();
      const duration = endTime - runningEntry.startTime;
      const completed = {
        id: runningEntry.id,
        taskName: runningEntry.taskName,
        startTime: runningEntry.startTime,
        endTime: endTime,
        duration: duration,
      };
      const timeEntries = data.timeEntries || [];
      // Prepend the new entry to show most recent first.
      timeEntries.unshift(completed);
      chrome.storage.local.set({ runningEntry: null, timeEntries: timeEntries }, () => {
        // Persist task name suggestion
        persistTaskName(completed.taskName);
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        timerDisplay.textContent = '00:00:00';
        startStopBtn.textContent = 'Start';
        taskInput.value = '';
        renderEntries(timeEntries);
        if (typeof cb === 'function') cb();
      });
    });
  }

  /**
   * Event handler for the Start/Stop button. Delegates to startTimer or stopTimer.
   */
  function toggleTimer() {
    chrome.storage.local.get('runningEntry', (data) => {
      if (data.runningEntry) {
        stopTimer();
      } else {
        startTimer();
      }
    });
  }

  /**
   * Handle deletion of a time entry by id.
   * @param {number|string} id
   */
  function handleDeleteEntry(id) {
    chrome.storage.local.get('timeEntries', (data) => {
      let entries = data.timeEntries || [];
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      entries = entries.filter((e) => e.id !== numericId);
      chrome.storage.local.set({ timeEntries: entries }, () => {
        renderEntries(entries);
      });
    });
  }

  /**
   * Handle editing of a time entry. Prompts the user for a new task name.
   * @param {number|string} id
   */
  function handleEditEntry(id) {
    chrome.storage.local.get('timeEntries', (data) => {
      const entries = data.timeEntries || [];
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const entry = entries.find((e) => e.id === numericId);
      if (!entry) return;
      const newName = prompt('Edit task name:', entry.taskName);
      if (newName === null) {
        return;
      }
      const trimmed = newName.trim();
      if (trimmed) {
        entry.taskName = trimmed;
      }
      chrome.storage.local.set({ timeEntries: entries }, () => {
        renderEntries(entries);
        // Persist the edited name to suggestions
        persistTaskName(entry.taskName);
      });
    });
  }

  /**
   * Handle resuming a time entry. Starts a new timer with the same task name.
   * If a timer is running, stop it first.
   * @param {string} taskName
   */
  function handleResumeEntry(taskName) {
    chrome.storage.local.get('runningEntry', (data) => {
      if (data.runningEntry) {
        // Stop current timer then start new one
        stopTimer(() => {
          taskInput.value = taskName;
          startTimer();
        });
      } else {
        taskInput.value = taskName;
        startTimer();
      }
    });
  }

  /**
   * Toggle dark/light mode and persist preference.
   */
  function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    const newDark = !isDark;
    if (newDark) {
      document.body.classList.add('dark');
      themeToggleBtn.textContent = '☀️';
    } else {
      document.body.classList.remove('dark');
      themeToggleBtn.textContent = '🌙';
    }
    chrome.storage.local.set({ darkMode: newDark });
  }

  /**
   * Open the big table view in a new tab.
   */
  function openTable() {
    const url = chrome.runtime.getURL('entries.html');
    chrome.tabs.create({ url });
  }

  // Attach event listeners.
  startStopBtn.addEventListener('click', toggleTimer);
  if (openTableBtn) openTableBtn.addEventListener('click', openTable);
  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  document.addEventListener('DOMContentLoaded', loadState);
})();