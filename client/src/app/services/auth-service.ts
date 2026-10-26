import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
    ChangePasswordResponse,
    fetchUserResponse,
    loginResponse,
    MessageResponse,
    ProfileResponse,
    User
} from '../models/user';
import { catchError, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient)
    username = signal('')
    router = inject(Router)
    islogedIn = signal(false)

    private readonly authUrl = `${environment.apiUrl}/api/auth`

    fetchUser() {
        return this.http
            .get<fetchUserResponse>(`${environment.apiUrl}/authme`)
            .pipe(
                tap((result) => {
                    this.islogedIn.set(true);
                    this.username.set(result.data.username);
                }),
                catchError((error) => {
                    this.islogedIn.set(false);
                    this.username.set('');

                    return of(null);
                })
            );
    }

    signup(user: Omit<User, "role" | "_id">) {
        return this.http.post<{ message: string }>(`${this.authUrl}/signup`, user)
    }

    // When 2FA is on, the response has twoFactorRequired + tempToken
    // and the user is not signed in until verifyTwoFactor succeeds.
    login(user: Omit<User, "username" | "role" | "_id">) {
        return this.http
            .post<loginResponse>(`${this.authUrl}/login`, user)
            .pipe(
                tap((result) => {
                    if (result.token) {
                        this.startSession(result);
                    }
                })
            );
    }

    verifyTwoFactor(tempToken: string, code: string) {
        return this.http
            .post<loginResponse>(`${this.authUrl}/2fa/verify`, { tempToken, code })
            .pipe(
                tap((result) => this.startSession(result))
            );
    }

    resendTwoFactorCode(tempToken: string) {
        return this.http.post<MessageResponse>(`${this.authUrl}/2fa/resend`, { tempToken })
    }

    getProfile() {
        return this.http.get<ProfileResponse>(`${this.authUrl}/me`)
    }

    // The server signs out other devices and returns a new token for this one.
    changePassword(currentPassword: string, newPassword: string) {
        return this.http
            .put<ChangePasswordResponse>(`${this.authUrl}/password`, { currentPassword, newPassword })
            .pipe(
                tap((result) => localStorage.setItem('token', result.token))
            );
    }

    requestEnableTwoFactor() {
        return this.http.post<MessageResponse>(`${this.authUrl}/2fa/enable/request`, {})
    }

    confirmEnableTwoFactor(code: string) {
        return this.http.post<MessageResponse>(`${this.authUrl}/2fa/enable/confirm`, { code })
    }

    disableTwoFactor(password: string) {
        return this.http.post<MessageResponse>(`${this.authUrl}/2fa/disable`, { password })
    }

    private startSession(result: loginResponse) {
        localStorage.setItem("token", result.token!);
        this.username.set(result.data?.username || '');
        this.islogedIn.set(true)
    }

    logout(): void {
        localStorage.removeItem('token');
        this.islogedIn.set(false);
        this.username.set('');
        this.router.navigate(['/login']);
    }
}
