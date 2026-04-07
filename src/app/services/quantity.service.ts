import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuantityService {

  baseUrl = 'https://quantity-backend-1.onrender.com/api/quantity';

  constructor(private http: HttpClient) {}

  convert(data: any) {
    return this.http.post(`${this.baseUrl}/convert`, data);
  }

  add(data: any) {
    return this.http.post(`${this.baseUrl}/add`, data);
  }

  subtract(data: any) {
    return this.http.post(`${this.baseUrl}/subtract`, data);
  }

  divide(data: any) {
    return this.http.post(`${this.baseUrl}/divide`, data);
  }

  compare(data: any) {
    return this.http.post(`${this.baseUrl}/compare`, data);
  }
}