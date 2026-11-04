import { Routes } from '@angular/router';
import { ErabiltzaileakComponent } from './erabiltzaileak-component/erabiltzaileak-component';
import { LoginComponent } from './login-component/login-component';
import { PowerbankComponent } from './powerbank-component/powerbank-component';
import { KargaguneakComponent } from './kargaguneak-component/kargaguneak-component';
import { ErreserbakComponent } from './erreserbak-component/erreserbak-component';
import { UdalerriakComponent } from './udalerriak-component/udalerriak-component';
import { adminAuthGuard, loginGuard, systemAdminGuard } from './auth/admin-auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [loginGuard],
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'erabiltzaileak',
    },
    {
        path: 'erabiltzaileak',
        component: ErabiltzaileakComponent,
        canActivate: [systemAdminGuard],
    },
    {
        path: 'udalerriak',
        component: UdalerriakComponent,
        canActivate: [systemAdminGuard],
    },
    {
        path: 'powerbanks',
        component: PowerbankComponent,
        canActivate: [adminAuthGuard],
    },
    {
        path: 'kargaguneak',
        component: KargaguneakComponent,
        canActivate: [adminAuthGuard],
    },
    {
        path: 'erreserbak',
        component: ErreserbakComponent,
        canActivate: [adminAuthGuard],
    },
    {
        path: '**',
        redirectTo: '',
    }
];
