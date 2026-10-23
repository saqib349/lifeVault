import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Service, signal } from '@angular/core';
import { fetchUserResponse, loginResponse, User } from '../models/user';
import { catchError, of, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient)
    username = signal('')
    router = inject(Router)
    islogedIn = signal(false)
    // constructor() {
    //     this.fetchUser()
    //     console.log("auth service run")
    // }

    fetchUser() {
        return this.http
            .get<fetchUserResponse>('https://life-vault-2up2.vercel.app/authme')
            .pipe(
                tap((result) => {
                    this.islogedIn.set(true);
                    this.username.set(result.data.username);

                    console.log(
                        'In fetchUser, login status:',
                        this.islogedIn()
                    );
                }),
                catchError((error) => {
                    this.islogedIn.set(false);
                    this.username.set('');

                    return of(null);
                })
            );
    }

    signup(user: Omit<User, "role" | "_id">) {
        return this.http.post<{ message: string }>("https://life-vault-2up2.vercel.app/api/auth/signup", user)
    }

    login(user: Omit<User, "username" | "role" | "_id">) {
        return this.http
            .post<loginResponse>(
                "https://life-vault-2up2.vercel.app/api/auth/login",
                user
            )
            .pipe(
                tap((result) => {
                    this.username.set(result.data.username);
                    localStorage.setItem("token", result.token);
                    this.islogedIn.set(true)
                })
            );
    }
    logout(): void {
        localStorage.removeItem('token');
        this.islogedIn.set(false);
        this.username.set('');
        this.router.navigate(['/login']);
    }
}
