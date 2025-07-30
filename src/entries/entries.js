// entries.js
// Handles rendering and managing the large table view of time entries.
;(function () {
  const tableBody = document.getElementById('entriesTableBody');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const exportBtn = document.getElementById('exportBtn');

  let autoRefreshInterval = null;

  /**
   * Format duration in milliseconds into HH:MM:SS.
   * @param {number} ms
   * @returns {string}
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
   * Render the table rows based on the provided entries.
   * @param {Array<Object>} entries
   */
  function renderTable(entries, runningEntry) {
    tableBody.innerHTML = '';
    let allEntries = entries.slice();
    if (runningEntry) {
      // Add a pseudo-entry for the running timer
      allEntries.unshift({
        id: runningEntry.id,
        taskName: runningEntry.taskName,
        startTime: runningEntry.startTime,
        endTime: Date.now(),
        duration: Date.now() - runningEntry.startTime,
        isRunning: true
      });
    }
    if (!allEntries || allEntries.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No entries yet.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }
    const groups = {};
    allEntries.forEach((e) => {
      if (!groups[e.taskName]) groups[e.taskName] = [];
      groups[e.taskName].push(e);
    });
    Object.keys(groups).forEach((task) => {
      const groupEntries = groups[task];
      const total = groupEntries.reduce((acc, e) => acc + e.duration, 0);
      const headerTr = document.createElement('tr');
      headerTr.className = 'group-header';
      const taskHeaderTd = document.createElement('td');
      taskHeaderTd.textContent = task;
      const durationHeaderTd = document.createElement('td');
      durationHeaderTd.textContent = formatTime(total);
      const emptyStartTd = document.createElement('td');
      const emptyEndTd = document.createElement('td');
      const emptyActionsTd = document.createElement('td');
      headerTr.appendChild(taskHeaderTd);
      headerTr.appendChild(durationHeaderTd);
      headerTr.appendChild(emptyStartTd);
      headerTr.appendChild(emptyEndTd);
      headerTr.appendChild(emptyActionsTd);
      tableBody.appendChild(headerTr);
      groupEntries.forEach((entry) => {
        const tr = document.createElement('tr');
        const taskTd = document.createElement('td');
        taskTd.textContent = entry.taskName;
        const durationTd = document.createElement('td');
        durationTd.textContent = formatTime(entry.duration);
        if (entry.isRunning) durationTd.classList.add('live-timer');
        const startTd = document.createElement('td');
        const startDate = new Date(entry.startTime);
        startTd.textContent = startDate.toLocaleString();
        const endTd = document.createElement('td');
        if (entry.isRunning) {
          endTd.textContent = '...';
        } else {
          const endDate = new Date(entry.endTime);
          endTd.textContent = endDate.toLocaleString();
        }
        const actionsTd = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'table-actions';
        // Resume button
        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'table-action-btn resume';
        resumeBtn.textContent = 'Resume';
        resumeBtn.addEventListener('click', () => {
          handleResumeEntry(entry.taskName);
        });
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'table-action-btn edit';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
          handleEditEntry(entry.id);
        });
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'table-action-btn delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
          handleDeleteEntry(entry.id);
        });
        actionsDiv.appendChild(resumeBtn);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        actionsTd.appendChild(actionsDiv);
        tr.appendChild(taskTd);
        tr.appendChild(durationTd);
        tr.appendChild(startTd);
        tr.appendChild(endTd);
        tr.appendChild(actionsTd);
        tableBody.appendChild(tr);
      });
    });
  }

  /**
   * Persist a task name to suggestions in popup. This is called when editing/resuming.
   * @param {string} name
   */
  function persistTaskName(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    chrome.storage.local.get('taskNames', (data) => {
      let names = data.taskNames || [];
      if (!names.includes(trimmed)) {
        names.push(trimmed);
        chrome.storage.local.set({ taskNames: names });
      }
    });
  }

  /**
   * Load entries and theme state from storage.
   */
  function loadState() {
    chrome.storage.local.get(['timeEntries', 'darkMode', 'runningEntry'], (data) => {
      const entries = data.timeEntries || [];
      const dark = data.darkMode || false;
      const runningEntry = data.runningEntry || null;
      renderTable(entries, runningEntry);
      if (dark) {
        document.body.classList.add('dark');
        themeToggleBtn.textContent = '☀️';
      } else {
        document.body.classList.remove('dark');
        themeToggleBtn.textContent = '🌙';
      }
    });
  }

  /**
   * Delete an entry by id and refresh the table.
   * @param {number|string} id
   */
  function handleDeleteEntry(id) {
    if (!confirm('Delete this entry?')) return;
    chrome.storage.local.get('timeEntries', (data) => {
      let entries = data.timeEntries || [];
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      entries = entries.filter((e) => e.id !== numericId);
      chrome.storage.local.set({ timeEntries: entries }, () => {
        renderTable(entries);
      });
    });
  }

  /**
   * Edit an entry's task name using a prompt and persist changes.
   * @param {number|string} id
   */
  function handleEditEntry(id) {
    chrome.storage.local.get('timeEntries', (data) => {
      const entries = data.timeEntries || [];
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const entry = entries.find((e) => e.id === numericId);
      if (!entry) return;
      const newName = prompt('Edit task name:', entry.taskName);
      if (newName === null) return;
      const trimmed = newName.trim();
      if (trimmed) {
        entry.taskName = trimmed;
      }
      chrome.storage.local.set({ timeEntries: entries }, () => {
        renderTable(entries);
        persistTaskName(entry.taskName);
      });
    });
  }

  /**
   * Resume an entry by starting a new timer with the same task name.
   * If a timer is already running, stop it first.
   * @param {string} taskName
   */
  function handleResumeEntry(taskName) {
    chrome.storage.local.get('runningEntry', (data) => {
      if (data.runningEntry) {
        // We need to stop the running entry and then start a new one.
        stopTimer(() => startNewTimer(taskName));
      } else {
        startNewTimer(taskName);
      }
    });
  }

  /**
   * Helper: start a new timer with given task name and persist suggestions.
   * @param {string} taskName
   */
  function startNewTimer(taskName) {
    const name = taskName.trim();
    if (!name) return;
    const now = Date.now();
    const newEntry = {
      id: now,
      taskName: name,
      startTime: now,
    };
    chrome.storage.local.set({ runningEntry: newEntry }, () => {
      persistTaskName(name);
    });
  }

  /**
   * Stop the currently running timer and persist the entry. Accepts callback.
   * @param {Function} cb
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
      const entries = data.timeEntries || [];
      entries.unshift(completed);
      chrome.storage.local.set({ runningEntry: null, timeEntries: entries }, () => {
        persistTaskName(completed.taskName);
        if (typeof cb === 'function') cb();
      });
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
   * Export entries as a CSV file and trigger download.
   */
  function exportCSV() {
    chrome.storage.local.get('timeEntries', (data) => {
      const entries = data.timeEntries || [];
      if (!entries.length) return;
      const lines = ['Task,Start,End,Duration'];
      entries.forEach((e) => {
        const start = new Date(e.startTime).toISOString();
        const end = new Date(e.endTime).toISOString();
        const task = e.taskName.replace(/"/g, '""');
        lines.push(`"${task}",${start},${end},${formatTime(e.duration)}`);
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wfh-entries.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  function startAutoRefresh() {
    if (autoRefreshInterval) return;
    autoRefreshInterval = setInterval(loadState, 1000);
  }

  function stopAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  }

  // Event listeners
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    startAutoRefresh();
  });
  window.addEventListener('beforeunload', stopAutoRefresh);
  themeToggleBtn.addEventListener('click', toggleTheme);
  if (exportBtn) exportBtn.addEventListener('click', exportCSV);
})();