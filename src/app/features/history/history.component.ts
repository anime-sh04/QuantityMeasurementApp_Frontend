import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../auth/auth-modal/auth-modal.service';
import { QuantityService } from '../../core/services/quantity.service';
import { ToastService } from '../../core/services/toast.service';

function formatNum(n: any): string {
  if (n == null) return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return String(n);
  return num % 1 === 0 ? num.toLocaleString() : parseFloat(num.toFixed(6)).toLocaleString();
}

function formatDate(d: any): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule],
  template: `
    <!-- Auth gate -->
    <div class="access-gate" *ngIf="!auth.loggedIn">
      <div class="lock-icon">🔒</div>
      <h3>Login Required</h3>
      <p>History is only available to logged-in users.<br>Please sign in to view your calculation history.</p>
      <button class="btn btn-primary" (click)="modal.open('login')">Login to View History</button>
    </div>

    <!-- History content -->
    <div *ngIf="auth.loggedIn">
      <div class="page-header">
        <div>
          <div class="page-h1">History</div>
          <p class="page-sub">Your recent calculation history</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost btn-sm" (click)="loadHistory()">↺ Refresh</button>
          <button class="btn btn-danger btn-sm" (click)="clearHistory()">✕ Clear All</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-val">{{ statTotal }}</div>
          <div class="stat-lbl">Total Records</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ statLast }}</div>
          <div class="stat-lbl">Last Operation</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="history-filters">
        <select class="filter-select" [(ngModel)]="filterOp" (change)="loadHistory()">
          <option value="">All Operations</option>
          <option value="convert">Convert</option>
          <option value="compare">Compare</option>
          <option value="add">Add</option>
          <option value="subtract">Subtract</option>
          <option value="divide">Divide</option>
        </select>
        <select class="filter-select" [(ngModel)]="filterType" (change)="loadHistory()">
          <option value="">All Types</option>
          <option value="length">Length</option>
          <option value="weight">Weight</option>
          <option value="volume">Volume</option>
          <option value="temperature">Temperature</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-wrap">

        <!-- Loading -->
        <div class="empty-state" *ngIf="loading">
          <div class="icon"><span class="spinner spinner-dk"></span></div>
          <p>Loading…</p>
        </div>

        <!-- Error -->
        <div class="empty-state" *ngIf="!loading && error">
          <div class="icon">⚠️</div>
          <p>{{ error }}</p>
        </div>

        <!-- Empty -->
        <div class="empty-state" *ngIf="!loading && !error && rows.length === 0">
          <div class="icon">📭</div>
          <p>No history records found.</p>
        </div>

        <!-- Rows -->
        <div class="table-scroll">
        <table class="history-table" *ngIf="!loading && !error && rows.length > 0">
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
            <tr *ngFor="let r of rows; let i = index">
              <td style="color:var(--muted);font-family:var(--font-mono)">{{ i + 1 }}</td>
              <td><span class="badge badge-op">{{ r.operationType || '—' }}</span></td>
              <td>
                <span class="badge" [ngClass]="'badge-' + (r.measurementType || '').toLowerCase()">
                  {{ r.measurementType || '—' }}
                </span>
              </td>
              <td style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text2);max-width:220px;word-break:break-word">
                {{ r.expression || r.inputExpression || r.expressionString || '—' }}
              </td>
              <td style="color:var(--accent);font-family:var(--font-disp);font-weight:600">
                {{ getResult(r) }}
              </td>
              <td style="color:var(--muted);font-size:0.74rem;font-family:var(--font-mono)">
                {{ formatDate(r.createdAt || r.timestamp) }}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  rows:      any[]   = [];
  loading    = false;
  error      = '';
  statTotal: string | number = '—';
  statLast   = '—';
  filterOp   = '';
  filterType = '';

  formatDate = formatDate;

  constructor(
    public  auth:     AuthService,
    public  modal:    AuthModalService,
    private quantity: QuantityService,
    private toast:    ToastService
  ) {}

  ngOnInit(): void {
    if (this.auth.loggedIn) {
      this.loadHistory();
      this.loadStats();
    }
  }

  async loadStats(): Promise<void> {
    const r = await this.quantity.getStats();
    if (r.ok) {
      this.statTotal = r.data.totalRecords ?? '—';
    }
  }

  async loadHistory(): Promise<void> {
    if (!this.auth.loggedIn) return;
    this.loading = true;
    this.error   = '';
    const r = await this.quantity.getHistory(this.filterOp, this.filterType);
    this.loading = false;
    if (!r.ok) {
      this.error = r.message || 'Failed to load history.';
      return;
    }
    this.rows    = Array.isArray(r.data) ? r.data : [];
    this.statLast = this.rows.length > 0 ? (this.rows[0].operationType || '—') : '—';
  }

  async clearHistory(): Promise<void> {
    if (!confirm('Delete all history? This cannot be undone.')) return;
    const r = await this.quantity.clearHistory();
    if (r.ok) {
      this.toast.show(r.data.message || 'History cleared');
      this.loadHistory();
      this.loadStats();
    } else {
      this.toast.show(r.message || 'Failed to clear', 'error');
    }
  }

  getResult(r: any): string {
    if (r.resultValue != null) {
      return `${formatNum(r.resultValue)} ${r.resultUnit || ''}`.trim();
    }
    return r.result || '—';
  }
}
