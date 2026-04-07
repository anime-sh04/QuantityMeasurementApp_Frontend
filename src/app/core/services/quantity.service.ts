import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Quantity {
  value: number;
  unit: string;
  measurementType: string;
}

export interface ApiResult {
  ok:      boolean;
  data:    any;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class QuantityService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private async call(path: string, body: any): Promise<ApiResult> {
    try {
      const data = await firstValueFrom(
        this.http.post<any>(`${this.api}${path}`, body)
      );
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, data: null, message: err?.error?.message || 'Network error' };
    }
  }

  convert(source: Quantity, targetUnit: string) {
    return this.call('/api/quantity/convert', { source, targetUnit });
  }

  compare(quantityOne: Quantity, quantityTwo: Quantity) {
    return this.call('/api/quantity/compare', { quantityOne, quantityTwo });
  }

  add(quantityOne: Quantity, quantityTwo: Quantity, targetUnit: string) {
    return this.call('/api/quantity/add', { quantityOne, quantityTwo, targetUnit });
  }

  subtract(quantityOne: Quantity, quantityTwo: Quantity, targetUnit: string) {
    return this.call('/api/quantity/subtract', { quantityOne, quantityTwo, targetUnit });
  }

  divide(quantityOne: Quantity, quantityTwo: Quantity) {
    return this.call('/api/quantity/divide', { quantityOne, quantityTwo });
  }

  async getHistory(op?: string, type?: string): Promise<ApiResult> {
    let path = '/api/quantity/history';
    if (op)   path = `/api/quantity/history/operation/${op}`;
    if (type) path = `/api/quantity/history/type/${type}`;
    try {
      const data = await firstValueFrom(this.http.get<any>(this.api + path));
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, data: null, message: err?.error?.message || 'Network error' };
    }
  }

  async getStats(): Promise<ApiResult> {
    try {
      const data = await firstValueFrom(this.http.get<any>(`${this.api}/api/quantity/stats`));
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, data: null, message: err?.error?.message || 'Network error' };
    }
  }

  async clearHistory(): Promise<ApiResult> {
    try {
      const data = await firstValueFrom(this.http.delete<any>(`${this.api}/api/quantity/history`));
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, data: null, message: err?.error?.message || 'Network error' };
    }
  }
}
