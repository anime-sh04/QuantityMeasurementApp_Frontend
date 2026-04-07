import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type MeasurementType = 'length' | 'weight' | 'volume' | 'temperature';
export type Operation = 'convert' | 'compare' | 'add' | 'subtract' | 'divide';

@Injectable({ providedIn: 'root' })
export class ConverterStateService {
  private _type = new BehaviorSubject<MeasurementType>('length');
  private _op   = new BehaviorSubject<Operation>('convert');

  type$ = this._type.asObservable();
  op$   = this._op.asObservable();

  get type(): MeasurementType { return this._type.value; }
  get op():   Operation       { return this._op.value; }

  setType(t: MeasurementType): void {
    this._type.next(t);
    // Temperature doesn't support arithmetic ops
    const arithmetic: Operation[] = ['add', 'subtract', 'divide'];
    if (t === 'temperature' && arithmetic.includes(this._op.value)) {
      this._op.next('convert');
    }
  }

  setOp(op: Operation): void {
    this._op.next(op);
  }
}
