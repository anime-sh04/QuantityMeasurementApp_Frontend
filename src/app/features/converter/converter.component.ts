import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ConverterStateService, MeasurementType, Operation } from '../../core/services/converter-state.service';
import { QuantityService } from '../../core/services/quantity.service';
import { ToastService } from '../../core/services/toast.service';
import { UNITS, OPERATIONS } from '../../core/constants';

interface ResultCard {
  state:  'idle' | 'success' | 'error' | 'equal' | 'notequal';
  label:  string;
  value:  string;
  expr:   string;
}

function emptyCard(): ResultCard {
  return { state: 'idle', label: '', value: '', expr: '' };
}

function formatNum(n: any): string {
  if (n == null) return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return String(n);
  return num % 1 === 0 ? num.toLocaleString() : parseFloat(num.toFixed(6)).toLocaleString();
}

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgTemplateOutlet, FormsModule],
  template: `
    <!-- Op Strip -->
    <div class="op-strip">
      <button class="op-strip-tab"
        *ngFor="let o of ops"
        [ngClass]="{ active: currentOp === o.value }"
        [style.display]="isOpHidden(o.value) ? 'none' : ''"
        (click)="setOp(o.value)">
        {{ o.icon }} {{ o.label }}
      </button>
    </div>

    <div class="content">

      <!-- CONVERT -->
      <div [hidden]="currentOp !== 'convert'" class="split-layout">
        <div class="form-panel">
          <div class="panel-title">
            <span class="panel-title-num">1</span> What are you converting?
          </div>
          <div class="stagger-row stagger-row-single">
            <div class="form-group">
              <label class="form-label">Value</label>
              <input class="form-input" type="number" [(ngModel)]="cvt.val"
                placeholder="Enter a number…" style="font-size:1.1rem;padding:14px;" />
            </div>
          </div>
          <div class="stagger-row stagger-row-even">
            <div class="form-group">
              <label class="form-label">From unit</label>
              <select class="form-select" [(ngModel)]="cvt.from">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">To unit</label>
              <select class="form-select" [(ngModel)]="cvt.to">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" [disabled]="cvt.loading" (click)="doConvert()">
              <span *ngIf="cvt.loading" class="spinner"></span>
              <span *ngIf="!cvt.loading">Convert →</span>
            </button>
          </div>
        </div>
        <div class="result-panel">
          <ng-container *ngTemplateOutlet="resultCard; context: { card: results.convert, sym: '=' }"></ng-container>
        </div>
      </div>

      <!-- COMPARE -->
      <div [hidden]="currentOp !== 'compare'" class="split-layout">
        <div class="form-panel">
          <div class="panel-title"><span class="panel-title-num">A</span> First quantity</div>
          <div class="stagger-row stagger-row-half">
            <div class="form-group">
              <label class="form-label">Value A</label>
              <input class="form-input" type="number" [(ngModel)]="cmp.v1" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <select class="form-select" [(ngModel)]="cmp.u1">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="op-sep">
            <div class="op-sep-line"></div><div class="op-sep-badge">=</div><div class="op-sep-line"></div>
          </div>
          <div class="panel-title"><span class="panel-title-num">B</span> Second quantity</div>
          <div class="stagger-row stagger-row-half">
            <div class="form-group">
              <label class="form-label">Value B</label>
              <input class="form-input" type="number" [(ngModel)]="cmp.v2" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <select class="form-select" [(ngModel)]="cmp.u2">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" [disabled]="cmp.loading" (click)="doCompare()">
              <span *ngIf="cmp.loading" class="spinner"></span>
              <span *ngIf="!cmp.loading">Compare →</span>
            </button>
          </div>
        </div>
        <div class="result-panel">
          <ng-container *ngTemplateOutlet="resultCard; context: { card: results.compare, sym: '≈' }"></ng-container>
        </div>
      </div>

      <!-- ADD -->
      <div [hidden]="currentOp !== 'add'" class="split-layout">
        <div class="form-panel">
          <div class="panel-title"><span class="panel-title-num">A</span> First quantity</div>
          <div class="stagger-row stagger-row-half">
            <div class="form-group">
              <label class="form-label">Value A</label>
              <input class="form-input" type="number" [(ngModel)]="add.v1" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <select class="form-select" [(ngModel)]="add.u1">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="op-sep">
            <div class="op-sep-line"></div><div class="op-sep-badge">+</div><div class="op-sep-line"></div>
          </div>
          <div class="panel-title"><span class="panel-title-num">B</span> Second quantity</div>
          <div class="stagger-row stagger-row-half">
            <div class="form-group">
              <label class="form-label">Value B</label>
              <input class="form-input" type="number" [(ngModel)]="add.v2" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <select class="form-select" [(ngModel)]="add.u2">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="result-unit-row" style="margin-top:1rem;">
            <label class="form-label" style="white-space:nowrap">Result unit</label>
            <select class="form-select" [(ngModel)]="add.target">
              <option *ngFor="let u of units" [value]="u">{{ u }}</option>
            </select>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" [disabled]="add.loading" (click)="doAdd()">
              <span *ngIf="add.loading" class="spinner"></span>
              <span *ngIf="!add.loading">Add →</span>
            </button>
          </div>
        </div>
        <div class="result-panel">
          <ng-container *ngTemplateOutlet="resultCard; context: { card: results.add, sym: '+' }"></ng-container>
        </div>
      </div>

      <!-- SUBTRACT -->
      <div [hidden]="currentOp !== 'subtract'" class="split-layout">
        <div class="form-panel">
          <div class="panel-title"><span class="panel-title-num">A</span> First quantity</div>
          <div class="stagger-row stagger-row-half">
            <div class="form-group">
              <label class="form-label">Value A</label>
              <input class="form-input" type="number" [(ngModel)]="sub.v1" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <select class="form-select" [(ngModel)]="sub.u1">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="op-sep">
            <div class="op-sep-line"></div><div class="op-sep-badge">−</div><div class="op-sep-line"></div>
          </div>
          <div class="panel-title"><span class="panel-title-num">B</span> Second quantity</div>
          <div class="stagger-row stagger-row-half">
            <div class="form-group">
              <label class="form-label">Value B</label>
              <input class="form-input" type="number" [(ngModel)]="sub.v2" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <select class="form-select" [(ngModel)]="sub.u2">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="result-unit-row" style="margin-top:1rem;">
            <label class="form-label" style="white-space:nowrap">Result unit</label>
            <select class="form-select" [(ngModel)]="sub.target">
              <option *ngFor="let u of units" [value]="u">{{ u }}</option>
            </select>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" [disabled]="sub.loading" (click)="doSubtract()">
              <span *ngIf="sub.loading" class="spinner"></span>
              <span *ngIf="!sub.loading">Subtract →</span>
            </button>
          </div>
        </div>
        <div class="result-panel">
          <ng-container *ngTemplateOutlet="resultCard; context: { card: results.subtract, sym: '−' }"></ng-container>
        </div>
      </div>

      <!-- DIVIDE -->
      <div [hidden]="currentOp !== 'divide'" class="split-layout">
        <div class="form-panel">
          <div class="panel-title"><span class="panel-title-num">↑</span> Numerator</div>
          <div class="stagger-row stagger-row-half">
            <div class="form-group">
              <label class="form-label">Value</label>
              <input class="form-input" type="number" [(ngModel)]="div.v1" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <select class="form-select" [(ngModel)]="div.u1">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="op-sep">
            <div class="op-sep-line"></div><div class="op-sep-badge">÷</div><div class="op-sep-line"></div>
          </div>
          <div class="panel-title"><span class="panel-title-num">↓</span> Denominator</div>
          <div class="stagger-row stagger-row-half">
            <div class="form-group">
              <label class="form-label">Value</label>
              <input class="form-input" type="number" [(ngModel)]="div.v2" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Unit</label>
              <select class="form-select" [(ngModel)]="div.u2">
                <option *ngFor="let u of units" [value]="u">{{ u }}</option>
              </select>
            </div>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" [disabled]="div.loading" (click)="doDivide()">
              <span *ngIf="div.loading" class="spinner"></span>
              <span *ngIf="!div.loading">Calculate Ratio →</span>
            </button>
          </div>
        </div>
        <div class="result-panel">
          <ng-container *ngTemplateOutlet="resultCard; context: { card: results.divide, sym: '÷' }"></ng-container>
        </div>
      </div>

    </div>

    <!-- Shared Result Card Template -->
    <ng-template #resultCard let-card="card" let-sym="sym">
      <div class="result-card" [ngClass]="{
        'active-success':  card.state === 'success',
        'active-error':    card.state === 'error',
        'active-equal':    card.state === 'equal',
        'active-notequal': card.state === 'notequal'
      }">
        <ng-container *ngIf="card.state === 'idle'; else filled">
          <div class="result-placeholder">
            <div class="big-symbol">{{ sym }}</div>
            <p>Result will appear here</p>
          </div>
        </ng-container>
        <ng-template #filled>
          <div class="result-card-label">{{ card.label }}</div>
          <div class="result-big">{{ card.value }}</div>
          <div class="result-expr" *ngIf="card.expr">{{ card.expr }}</div>
        </ng-template>
      </div>
    </ng-template>
  `
})
export class ConverterComponent implements OnInit, OnDestroy {
  private typeSub!: Subscription;

  currentOp:  Operation       = 'convert';
  currentType: MeasurementType = 'length';
  units: string[] = [];

  ops = [
    { value: 'convert'  as Operation, icon: '⇄', label: 'CONVERT'  },
    { value: 'compare'  as Operation, icon: '=', label: 'COMPARE'  },
    { value: 'add'      as Operation, icon: '+', label: 'ADD'      },
    { value: 'subtract' as Operation, icon: '−', label: 'SUBTRACT' },
    { value: 'divide'   as Operation, icon: '÷', label: 'DIVIDE'   }
  ];

  // Form models
  cvt = { val: null as number | null, from: '', to: '', loading: false };
  cmp = { v1: null as number | null, u1: '', v2: null as number | null, u2: '', loading: false };
  add = { v1: null as number | null, u1: '', v2: null as number | null, u2: '', target: '', loading: false };
  sub = { v1: null as number | null, u1: '', v2: null as number | null, u2: '', target: '', loading: false };
  div = { v1: null as number | null, u1: '', v2: null as number | null, u2: '', loading: false };

  results = {
    convert:  emptyCard(),
    compare:  emptyCard(),
    add:      emptyCard(),
    subtract: emptyCard(),
    divide:   emptyCard()
  };

  constructor(
    private state:    ConverterStateService,
    private quantity: QuantityService,
    private toast:    ToastService,
    private cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.typeSub = this.state.type$.subscribe(t => {
      this.currentType = t;
      this.units = UNITS[t] || [];
      // Set default unit selections
      this.cvt.from = this.units[0] || '';
      this.cvt.to   = this.units[1] || this.units[0] || '';
      ['cmp', 'add', 'sub', 'div'].forEach(k => {
        (this as any)[k].u1 = this.units[0] || '';
        (this as any)[k].u2 = this.units[0] || '';
      });
      this.add.target = this.units[0] || '';
      this.sub.target = this.units[0] || '';
      // Only clear results when measurement TYPE changes — not on op switch
      this.results = {
        convert:  emptyCard(),
        compare:  emptyCard(),
        add:      emptyCard(),
        subtract: emptyCard(),
        divide:   emptyCard()
      };
      this.cdr.detectChanges();
    });

    this.state.op$.subscribe(op => {
      this.currentOp = op;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void { this.typeSub?.unsubscribe(); }

  setOp(op: Operation): void { this.state.setOp(op); }

  isOpHidden(op: Operation): boolean {
    const arithmetic: Operation[] = ['add', 'subtract', 'divide'];
    return this.currentType === 'temperature' && arithmetic.includes(op);
  }

  private qty(value: number | null, unit: string) {
    return { value: value as number, unit, measurementType: this.currentType };
  }

  async doConvert(): Promise<void> {
    if (this.cvt.val == null || isNaN(this.cvt.val)) {
      this.toast.show('Enter a value', 'error'); return;
    }
    this.cvt = { ...this.cvt, loading: true };
    const r = await this.quantity.convert(this.qty(this.cvt.val, this.cvt.from), this.cvt.to);
    this.cvt = { ...this.cvt, loading: false };
    if (r.ok) {
      this.results = { ...this.results, convert: { state: 'success', label: 'Result', value: `${formatNum(r.data.value)} ${r.data.unit}`, expr: r.data.expression || '' } };
    } else {
      this.results = { ...this.results, convert: { state: 'error', label: '⚠ Error', value: r.message || 'Something went wrong', expr: '' } };
    }
    this.cdr.detectChanges();
  }

  async doCompare(): Promise<void> {
    if (this.cmp.v1 == null || this.cmp.v2 == null) {
      this.toast.show('Enter both values', 'error'); return;
    }
    this.cmp = { ...this.cmp, loading: true };
    const r = await this.quantity.compare(this.qty(this.cmp.v1, this.cmp.u1), this.qty(this.cmp.v2, this.cmp.u2));
    this.cmp = { ...this.cmp, loading: false };
    if (r.ok) {
      const eq = r.data.equal;
      this.results = { ...this.results, compare: {
        state: eq ? 'equal' : 'notequal',
        label: eq ? '✓ Equal' : '≠ Not Equal',
        value: r.data.message,
        expr:  `${r.data.first}  vs  ${r.data.second}`
      }};
    } else {
      this.results = { ...this.results, compare: { state: 'error', label: '⚠ Error', value: r.message || 'Something went wrong', expr: '' } };
    }
    this.cdr.detectChanges();
  }

  async doAdd(): Promise<void> {
    if (this.add.v1 == null || this.add.v2 == null) {
      this.toast.show('Enter both values', 'error'); return;
    }
    this.add = { ...this.add, loading: true };
    const r = await this.quantity.add(this.qty(this.add.v1, this.add.u1), this.qty(this.add.v2, this.add.u2), this.add.target);
    this.add = { ...this.add, loading: false };
    if (r.ok) {
      this.results = { ...this.results, add: { state: 'success', label: 'Sum', value: `${formatNum(r.data.value)} ${r.data.unit}`, expr: r.data.expression || '' } };
    } else {
      this.results = { ...this.results, add: { state: 'error', label: '⚠ Error', value: r.message || 'Something went wrong', expr: '' } };
    }
    this.cdr.detectChanges();
  }

  async doSubtract(): Promise<void> {
    if (this.sub.v1 == null || this.sub.v2 == null) {
      this.toast.show('Enter both values', 'error'); return;
    }
    this.sub = { ...this.sub, loading: true };
    const r = await this.quantity.subtract(this.qty(this.sub.v1, this.sub.u1), this.qty(this.sub.v2, this.sub.u2), this.sub.target);
    this.sub = { ...this.sub, loading: false };
    if (r.ok) {
      this.results = { ...this.results, subtract: { state: 'success', label: 'Difference', value: `${formatNum(r.data.value)} ${r.data.unit}`, expr: r.data.expression || '' } };
    } else {
      this.results = { ...this.results, subtract: { state: 'error', label: '⚠ Error', value: r.message || 'Something went wrong', expr: '' } };
    }
    this.cdr.detectChanges();
  }

  async doDivide(): Promise<void> {
    if (this.div.v1 == null || this.div.v2 == null) {
      this.toast.show('Enter both values', 'error'); return;
    }
    this.div = { ...this.div, loading: true };
    const r = await this.quantity.divide(this.qty(this.div.v1, this.div.u1), this.qty(this.div.v2, this.div.u2));
    this.div = { ...this.div, loading: false };
    if (r.ok) {
      this.results = { ...this.results, divide: { state: 'success', label: 'Ratio', value: formatNum(r.data.value), expr: r.data.expression || '' } };
    } else {
      this.results = { ...this.results, divide: { state: 'error', label: '⚠ Error', value: r.message || 'Something went wrong', expr: '' } };
    }
    this.cdr.detectChanges();
  }
}
