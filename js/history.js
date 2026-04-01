/* History */

function initHistory() {
  if (!authToken) {
    document.getElementById('history-gate').style.display    = '';
    document.getElementById('history-content').style.display = 'none';
  } else {
    document.getElementById('history-gate').style.display    = 'none';
    document.getElementById('history-content').style.display = '';
    loadHistory();
    loadStats();
  }
}

async function loadStats() {
  try {
    const { ok, data } = await apiFetch('/api/quantity/stats');
    if (ok) {
      document.getElementById('stat-total').textContent = data.totalRecords ?? '—';
      document.getElementById('stat-last').textContent  = '—'; // updated by loadHistory
    }
  } catch {}
}

async function loadHistory() {
  if (!authToken) return;
  const op   = document.getElementById('filterOp')?.value  || '';
  const type = document.getElementById('filterType')?.value || '';

  let url = '/api/quantity/history';
  if (op)   url = `/api/quantity/history/operation/${op}`;
  if (type) url = `/api/quantity/history/type/${type}`;

  const wrap = document.getElementById('historyTable');
  wrap.innerHTML = `<div class="empty-state"><div class="icon"><span class="spinner spinner-dk"></span></div><p>Loading…</p></div>`;

  try {
    const { ok, data } = await apiFetch(url);
    if (!ok) {
      wrap.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>Failed to load history.</p></div>`;
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    document.getElementById('stat-last').textContent = rows.length > 0 ? (rows[0].operationType || '—') : '—';

    if (rows.length === 0) {
      wrap.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>No history records found.</p></div>`;
      return;
    }

    wrap.innerHTML = `
      <table class="history-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Operation</th>
            <th>Type</th>
            <th>Expression</th>
            <th>Result</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r, i) => {
            // Resolve expression from all possible field names the backend may return
            const expr = r.expression || r.inputExpression || r.expressionString || '—';
            // Resolve result value
            const result = r.resultValue != null
              ? `${formatNum(r.resultValue)} ${r.resultUnit || ''}`.trim()
              : (r.result || '—');

            return `
            <tr>
              <td style="color:var(--muted);font-family:var(--font-mono)">${i + 1}</td>
              <td><span class="badge badge-op">${r.operationType || '—'}</span></td>
              <td><span class="badge badge-${(r.measurementType || '').toLowerCase()}">${r.measurementType || '—'}</span></td>
              <td style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text2);max-width:220px;word-break:break-word">${expr}</td>
              <td style="color:var(--accent);font-family:var(--font-disp);font-weight:600">${result}</td>
              <td style="color:var(--muted);font-size:0.74rem;font-family:var(--font-mono)">${formatDate(r.createdAt || r.timestamp)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  } catch {
    wrap.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>Network error. Is the backend running?</p></div>`;
  }
}

async function clearHistory() {
  if (!confirm('Delete all history? This cannot be undone.')) return;
  try {
    const { ok, data } = await apiFetch('/api/quantity/history', { method: 'DELETE' });
    if (ok) {
      showToast(data.message || 'History cleared', 'success');
      loadHistory();
      loadStats();
    } else {
      showToast(data.message || 'Failed to clear', 'error');
    }
  } catch { showToast('Network error', 'error'); }
}