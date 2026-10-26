import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { NotFound } from './components/not-found/not-found';
import { Vault } from './pages/vault/vault';
import { Ai } from './pages/ai/ai';
import { Legal } from './pages/legal/legal';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
    {
        path: "",
        component: Dashboard,
        pathMatch: 'full'
    },
    {
        path: "dashboard",
        redirectTo: ""
    },
    {
        path: "vault",
        component: Vault
    },
    {
        path: "ai",
        component: Ai
    },
    {
        path: "settings",
        component: Settings
    },
    {

        path: "login",
        component: Login
    },
    {
        path: "signup",
        component: Signup
    },
    {
        path: "privacy",
        component: Legal,
        data: { page: 'privacy' }
    },
    {
        path: "terms",
        component: Legal,
        data: { page: 'terms' }
    },
    {
        path: "**",
        component: NotFound
    }
];
