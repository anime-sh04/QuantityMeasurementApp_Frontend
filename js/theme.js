/* Theme */

const savedTheme = localStorage.getItem('qm_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('qm_theme', next);
  updateThemeUI(next);
}

function updateThemeUI(t) {
  document.getElementById('themeIcon').textContent  = t === 'dark' ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
}

updateThemeUI(savedTheme);