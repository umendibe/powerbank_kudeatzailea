import { Routes } from '@angular/router';
import { ErabiltzaileakComponent } from './erabiltzaileak-component/erabiltzaileak-component';
import { LoginComponent } from './login-component/login-component';
import { PowerbankComponent } from './powerbank-component/powerbank-component';
import { KargaguneakComponent } from './kargaguneak-component/kargaguneak-component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'erabiltzaileak',
        component: ErabiltzaileakComponent,
    },
    {
        path: 'powerbanks',
        component: PowerbankComponent,
    },
    {
        path: 'kargaguneak',
        component: KargaguneakComponent,
    }
];
