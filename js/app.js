/* Config*/
const API = 'http://localhost:5001';

const UNITS = {
  length:      ['Feet', 'Inches', 'Yards', 'Centimeters'],
  weight:      ['Kilogram', 'Gram', 'Pound'],
  volume:      ['Litre', 'Millilitre', 'Gallon'],
  temperature: ['Celsius', 'Fahrenheit', 'Kelvin']
};

const OP_TITLES = {
  convert:  'Convert a quantity',
  compare:  'Compare two quantities',
  add:      'Add two quantities',
  subtract: 'Subtract quantities',
  divide:   'Calculate a ratio'
};


let currentType = 'length';
let currentOp   = 'convert';
let authToken   = localStorage.getItem('qm_token') || null;
let currentUser = JSON.parse(localStorage.getItem('qm_user') || 'null');

/*  Navigation  */
function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.querySelectorAll('.nav-item[id]').forEach(b => b.classList.remove('active'));
  document.getElementById(`nav-${name}`).classList.add('active');
  document.getElementById('opStrip').style.display = name === 'converter' ? '' : 'none';
  if (name === 'history') initHistory();
}

function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });

  // Temperature does not support arithmetic operations
  const arithmetic = ['add', 'subtract', 'divide'];
  const isTemp = type === 'temperature';
  document.querySelectorAll('.op-strip-tab').forEach(t => {
    if (arithmetic.includes(t.dataset.op)) t.style.display = isTemp ? 'none' : '';
  });
  if (isTemp && arithmetic.includes(currentOp)) setOp('convert');

  populateSelects();
  clearResults();
}

function setOp(op) {
  currentOp = op;
  document.querySelectorAll('.op-strip-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.op === op);
  });
  ['convert', 'compare', 'add', 'subtract', 'divide'].forEach(o => {
    const el = document.getElementById(`op-${o}`);
    if (el) el.style.display = o === op ? '' : 'none';
  });
  document.getElementById('topbarTitle').textContent = OP_TITLES[op] || '';
  clearResults();
}

/*  Select population ─ */
function populateSelects() {
  const units = UNITS[currentType] || [];
  ['cvt-from', 'cvt-to', 'cmp-u1', 'cmp-u2',
   'add-u1', 'add-u2', 'add-target',
   'sub-u1', 'sub-u2', 'sub-target',
   'div-u1', 'div-u2'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    if (prev && units.includes(prev)) el.value = prev;
  });
  // Default "to" to second unit for convert
  const cvtTo = document.getElementById('cvt-to');
  if (cvtTo && units.length > 1) cvtTo.value = units[1];
}

/*  Result helpers  */
function clearResults() {
  const symbols = { convert: '=', compare: '≈', add: '+', subtract: '−', divide: '÷' };
  const labels  = {
    convert:  'Result will appear here',
    compare:  'Comparison result here',
    add:      'Sum will appear here',
    subtract: 'Difference will appear here',
    divide:   'Ratio will appear here'
  };
  ['convert', 'compare', 'add', 'subtract', 'divide'].forEach(id => {
    const card = document.getElementById(`res-${id}-card`);
    if (card) {
      card.className = 'result-card';
      card.innerHTML = `<div class="result-placeholder">
        <div class="big-symbol">${symbols[id]}</div>
        <p>${labels[id]}</p>
      </div>`;
    }
  });
}

function setResultCard(id, type, label, value, expr) {
  const card = document.getElementById(`res-${id}-card`);
  const cls  = { success: 'active-success', error: 'active-error', equal: 'active-equal', notequal: 'active-notequal' }[type] || '';
  card.className = `result-card ${cls}`;
  card.innerHTML = `
    <div class="result-card-label">${label}</div>
    <div class="result-big">${value}</div>
    ${expr ? `<div class="result-expr">${expr}</div>` : ''}`;
}

function setResultError(id, msg) {
  setResultCard(id, 'error', '⚠ Error', msg || 'Something went wrong', '');
}

/*  API helper  */
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res  = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/*  Operations  */
async function doConvert() {
  const val  = parseFloat(document.getElementById('cvt-val').value);
  const from = document.getElementById('cvt-from').value;
  const to   = document.getElementById('cvt-to').value;
  if (isNaN(val)) { showToast('Enter a value', 'error'); return; }
  const btn = document.getElementById('btn-convert');
  setLoading(btn, true);
  try {
    const { ok, data } = await apiFetch('/api/quantity/convert', {
      method: 'POST',
      body: JSON.stringify({ source: { value: val, unit: from, measurementType: currentType }, targetUnit: to })
    });
    if (ok) setResultCard('convert', 'success', 'Result', `${formatNum(data.value)} ${data.unit}`, data.expression);
    else    setResultError('convert', data.message);
  } catch { setResultError('convert', 'Network error — backend not reachable at ' + API); }
  setLoading(btn, false, 'Convert →');
}

async function doCompare() {
  const v1 = parseFloat(document.getElementById('cmp-v1').value);
  const u1 = document.getElementById('cmp-u1').value;
  const v2 = parseFloat(document.getElementById('cmp-v2').value);
  const u2 = document.getElementById('cmp-u2').value;
  if (isNaN(v1) || isNaN(v2)) { showToast('Enter both values', 'error'); return; }
  const btn = document.querySelector('#op-compare .btn-primary');
  setLoading(btn, true);
  try {
    const { ok, data } = await apiFetch('/api/quantity/compare', {
      method: 'POST',
      body: JSON.stringify({
        quantityOne: { value: v1, unit: u1, measurementType: currentType },
        quantityTwo: { value: v2, unit: u2, measurementType: currentType }
      })
    });
    if (ok) setResultCard('compare', data.equal ? 'equal' : 'notequal', data.equal ? '✓ Equal' : '≠ Not Equal', data.message, `${data.first}  vs  ${data.second}`);
    else    setResultError('compare', data.message);
  } catch { setResultError('compare', 'Network error'); }
  setLoading(btn, false, 'Compare →');
}

async function doAdd() {
  const v1  = parseFloat(document.getElementById('add-v1').value);
  const u1  = document.getElementById('add-u1').value;
  const v2  = parseFloat(document.getElementById('add-v2').value);
  const u2  = document.getElementById('add-u2').value;
  const tgt = document.getElementById('add-target').value;
  if (isNaN(v1) || isNaN(v2)) { showToast('Enter both values', 'error'); return; }
  const btn = document.querySelector('#op-add .btn-primary');
  setLoading(btn, true);
  try {
    const { ok, data } = await apiFetch('/api/quantity/add', {
      method: 'POST',
      body: JSON.stringify({
        quantityOne: { value: v1, unit: u1, measurementType: currentType },
        quantityTwo: { value: v2, unit: u2, measurementType: currentType },
        targetUnit: tgt
      })
    });
    if (ok) setResultCard('add', 'success', 'Sum', `${formatNum(data.value)} ${data.unit}`, data.expression);
    else    setResultError('add', data.message);
  } catch { setResultError('add', 'Network error'); }
  setLoading(btn, false, 'Add →');
}

async function doSubtract() {
  const v1  = parseFloat(document.getElementById('sub-v1').value);
  const u1  = document.getElementById('sub-u1').value;
  const v2  = parseFloat(document.getElementById('sub-v2').value);
  const u2  = document.getElementById('sub-u2').value;
  const tgt = document.getElementById('sub-target').value;
  if (isNaN(v1) || isNaN(v2)) { showToast('Enter both values', 'error'); return; }
  const btn = document.querySelector('#op-subtract .btn-primary');
  setLoading(btn, true);
  try {
    const { ok, data } = await apiFetch('/api/quantity/subtract', {
      method: 'POST',
      body: JSON.stringify({
        quantityOne: { value: v1, unit: u1, measurementType: currentType },
        quantityTwo: { value: v2, unit: u2, measurementType: currentType },
        targetUnit: tgt
      })
    });
    if (ok) setResultCard('subtract', 'success', 'Difference', `${formatNum(data.value)} ${data.unit}`, data.expression);
    else    setResultError('subtract', data.message);
  } catch { setResultError('subtract', 'Network error'); }
  setLoading(btn, false, 'Subtract →');
}

async function doDivide() {
  const v1 = parseFloat(document.getElementById('div-v1').value);
  const u1 = document.getElementById('div-u1').value;
  const v2 = parseFloat(document.getElementById('div-v2').value);
  const u2 = document.getElementById('div-u2').value;
  if (isNaN(v1) || isNaN(v2)) { showToast('Enter both values', 'error'); return; }
  const btn = document.querySelector('#op-divide .btn-primary');
  setLoading(btn, true);
  try {
    const { ok, data } = await apiFetch('/api/quantity/divide', {
      method: 'POST',
      body: JSON.stringify({
        quantityOne: { value: v1, unit: u1, measurementType: currentType },
        quantityTwo: { value: v2, unit: u2, measurementType: currentType }
      })
    });
    if (ok) setResultCard('divide', 'success', 'Ratio', `${formatNum(data.value)}`, data.expression);
    else    setResultError('divide', data.message);
  } catch { setResultError('divide', 'Network error'); }
  setLoading(btn, false, 'Calculate Ratio →');
}

/*  Utilities ─ */
function formatNum(n) {
  if (n == null) return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return n;
  return num % 1 === 0 ? num.toLocaleString() : parseFloat(num.toFixed(6)).toLocaleString();
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

function setLoading(btn, loading, orig) {
  if (loading) {
    btn._orig    = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
  } else {
    btn.disabled  = false;
    btn.textContent = orig || btn._orig || 'Submit';
  }
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span style="color:var(--${type === 'success' ? 'success' : 'error'})">${type === 'success' ? '✓' : '⚠'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity    = '0';
    t.style.transition = 'opacity 0.3s';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

document.getElementById('authModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

populateSelects();
updateAuth();