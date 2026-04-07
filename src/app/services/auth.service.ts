import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  baseUrl = 'https://quantity-backend-1.onrender.com/api/auth';

  constructor(private http: HttpClient) {}

  register(data: any) {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  login(data: any) {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  getProfile(token: string) {
    return this.http.get(`${this.baseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}