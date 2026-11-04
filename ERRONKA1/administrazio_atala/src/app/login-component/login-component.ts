import { HttpErrorResponse } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login-component',
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loading()) {
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.loginAdmin(email ?? '', password ?? '').subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/erabiltzaileak']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.resolveError(error));
      },
    });
  }

  private resolveError(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Emaila edo pasahitza okerra da.';
    }

    if (error.status === 403) {
      return 'Kontu honek ez du administrazio baimenik edo ez dago aktibo.';
    }

    if (error.status === 0) {
      return 'Ezin da zerbitzariarekin konektatu. Egiaztatu backend-a martxan dagoela.';
    }

    return 'Ezin izan da saioa hasi. Saiatu berriro.';
  }
}
