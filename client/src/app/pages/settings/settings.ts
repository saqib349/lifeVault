import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { Profile } from '../../models/user';
import {
  PASSWORD_MIN_LENGTH,
  matchFields,
  passwordStrength
} from '../../validators/auth-validators';

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

// 'idle' = showing status, 'code' = waiting for the enable code,
// 'disable' = asking for the password to turn 2FA off.
type TwoFactorStep = 'idle' | 'code' | 'disable';

function errorMessage(err: any, fallback: string): string {
  return err?.error?.message || fallback;
}

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  selector: 'app-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  profile = signal<Profile | null>(null);
  loadingProfile = signal(true);
  profileError = signal('');

  /* ---- change password ---- */

  readonly passwordMinLength = PASSWORD_MIN_LENGTH;
  showPasswords = signal(false);
  passwordSubmitted = signal(false);
  savingPassword = signal(false);
  passwordError = signal('');
  passwordSuccess = signal('');

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(64),
        passwordStrength()
      ]
    }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  }, { validators: matchFields('newPassword', 'confirmPassword') });

  /* ---- two-factor ---- */

  twoFactorStep = signal<TwoFactorStep>('idle');
  twoFactorBusy = signal(false);
  twoFactorError = signal('');
  twoFactorSuccess = signal('');

  codeControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)]
  });

  disablePasswordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required]
  });

  ngOnInit(): void {
    if (!this.authService.islogedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadProfile();
  }

  loadProfile(): void {
    this.loadingProfile.set(true);
    this.profileError.set('');

    this.authService.getProfile().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.loadingProfile.set(false);
      },
      error: (err) => {
        this.loadingProfile.set(false);
        this.profileError.set(errorMessage(err, 'Failed to load your profile.'));
      }
    });
  }

  /* ---- change password ---- */

  showPasswordError(name: PasswordField): boolean {
    const control = this.passwordForm.controls[name];
    if (!control.touched && !this.passwordSubmitted()) return false;

    if (name === 'confirmPassword' && this.passwordForm.hasError('fieldsMismatch')) {
      return true;
    }
    return control.invalid;
  }

  getPasswordError(name: PasswordField): string {
    const errors = this.passwordForm.controls[name].errors;

    if (errors?.['required']) {
      const messages: Record<PasswordField, string> = {
        currentPassword: 'Current password is required.',
        newPassword: 'New password is required.',
        confirmPassword: 'Please confirm your new password.'
      };
      return messages[name];
    }

    if (name === 'newPassword') {
      if (errors?.['minlength']) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
      if (errors?.['maxlength']) return 'Password must be 64 characters or less.';
      if (errors?.['weakPassword']) return 'Password must include at least one letter and one number.';
    }

    if (name === 'confirmPassword' && this.passwordForm.hasError('fieldsMismatch')) {
      return 'Passwords do not match.';
    }

    return '';
  }

  togglePasswords(): void {
    this.showPasswords.update(show => !show);
  }

  changePassword(): void {
    this.passwordSubmitted.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.savingPassword.set(true);

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: (res) => {
        this.savingPassword.set(false);
        this.passwordSuccess.set(res.message);
        this.passwordSubmitted.set(false);
        this.passwordForm.reset();
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.passwordError.set(errorMessage(err, 'Failed to change password.'));
      }
    });
  }

  /* ---- two-factor ---- */

  private resetTwoFactorMessages(): void {
    this.twoFactorError.set('');
    this.twoFactorSuccess.set('');
  }

  // Sends the email code (also used for "Resend code").
  startEnable(): void {
    if (this.twoFactorBusy()) return;

    this.resetTwoFactorMessages();
    this.twoFactorBusy.set(true);

    this.authService.requestEnableTwoFactor().subscribe({
      next: (res) => {
        this.twoFactorBusy.set(false);
        this.twoFactorSuccess.set(res.message);
        if (this.twoFactorStep() !== 'code') {
          this.codeControl.reset();
          this.twoFactorStep.set('code');
        }
      },
      error: (err) => {
        this.twoFactorBusy.set(false);
        this.twoFactorError.set(errorMessage(err, 'Failed to send the code.'));
      }
    });
  }

  get codeError(): string {
    if (!this.codeControl.touched || this.codeControl.valid) return '';
    return this.codeControl.hasError('required')
      ? 'Enter the 6-digit code.'
      : 'The code must be 6 digits.';
  }

  confirmEnable(): void {
    this.resetTwoFactorMessages();
    this.codeControl.markAsTouched();

    if (this.codeControl.invalid || this.twoFactorBusy()) return;

    this.twoFactorBusy.set(true);

    this.authService.confirmEnableTwoFactor(this.codeControl.value).subscribe({
      next: (res) => {
        this.twoFactorBusy.set(false);
        this.twoFactorSuccess.set(res.message);
        this.twoFactorStep.set('idle');
        this.setTwoFactorEnabled(true);
      },
      error: (err) => {
        this.twoFactorBusy.set(false);
        this.twoFactorError.set(errorMessage(err, 'Failed to verify the code.'));
      }
    });
  }

  startDisable(): void {
    this.resetTwoFactorMessages();
    this.disablePasswordControl.reset();
    this.twoFactorStep.set('disable');
  }

  confirmDisable(): void {
    this.resetTwoFactorMessages();
    this.disablePasswordControl.markAsTouched();

    if (this.disablePasswordControl.invalid || this.twoFactorBusy()) return;

    this.twoFactorBusy.set(true);

    this.authService.disableTwoFactor(this.disablePasswordControl.value).subscribe({
      next: (res) => {
        this.twoFactorBusy.set(false);
        this.twoFactorSuccess.set(res.message);
        this.twoFactorStep.set('idle');
        this.setTwoFactorEnabled(false);
      },
      error: (err) => {
        this.twoFactorBusy.set(false);
        this.twoFactorError.set(errorMessage(err, 'Failed to turn off two-factor authentication.'));
      }
    });
  }

  cancelTwoFactor(): void {
    this.resetTwoFactorMessages();
    this.twoFactorStep.set('idle');
  }

  private setTwoFactorEnabled(enabled: boolean): void {
    const current = this.profile();
    if (current) {
      this.profile.set({ ...current, twoFactorEnabled: enabled });
    }
  }
}
