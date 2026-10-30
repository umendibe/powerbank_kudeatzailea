import { Routes } from '@angular/router';
import { ErabiltzaileakComponent } from './erabiltzaileak-component/erabiltzaileak-component';
import { LoginComponent } from './login-component/login-component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'erabiltzaileZerrenda',
        component: ErabiltzaileakComponent,
    }
];
