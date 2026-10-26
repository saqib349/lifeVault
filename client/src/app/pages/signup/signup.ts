import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import {
  EMAIL_PATTERN,
  PASSWORD_MIN_LENGTH,
  USERNAME_PATTERN,
  matchFields,
  passwordStrength
} from '../../validators/auth-validators';

type SignupField = 'username' | 'email' | 'password' | 'confirmPassword';

@Component({
  imports: [ReactiveFormsModule,RouterLink],
  selector: 'app-signup',
  styleUrl: './signup.css',
  templateUrl: './signup.html',
})
export class Signup {
  authService = inject(AuthService)
  loading= signal(false)
  router=inject(Router)
  errorMessage = signal('')
  showPassword = signal(false)
  submitted = signal(false)

  readonly passwordMinLength = PASSWORD_MIN_LENGTH

  signupForm = new FormGroup({
    username: new FormControl<string>('', {
      nonNullable:true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(USERNAME_PATTERN)
      ]
    }),
    email: new FormControl<string>('', {
      nonNullable:true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.pattern(EMAIL_PATTERN)
      ]
    }),
    password: new FormControl<string>('', {
      nonNullable:true,
      validators: [
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(64),
        passwordStrength()
      ]
    }),
    confirmPassword: new FormControl<string>('', {
      nonNullable:true,
      validators: [
        Validators.required
      ]
    })
  }, { validators: matchFields('password', 'confirmPassword') })

  showError(name: SignupField): boolean {
    const control = this.signupForm.controls[name]
    if (!control.touched && !this.submitted()) return false

    if (name === 'confirmPassword' && this.signupForm.hasError('fieldsMismatch')) {
      return true
    }
    return control.invalid
  }

  getError(name: SignupField): string {
    const errors = this.signupForm.controls[name].errors

    if (errors?.['required']) {
      const messages: Record<SignupField, string> = {
        username: 'Username is required.',
        email: 'Email is required.',
        password: 'Password is required.',
        confirmPassword: 'Please confirm your password.'
      }
      return messages[name]
    }

    switch (name) {
      case 'username':
        if (errors?.['minlength']) return 'Username must be at least 3 characters.'
        if (errors?.['maxlength']) return 'Username must be 30 characters or less.'
        if (errors?.['pattern']) return 'Use only letters, numbers, spaces, dots or underscores.'
        break
      case 'email':
        if (errors?.['email'] || errors?.['pattern']) return 'Enter a valid email address.'
        break
      case 'password':
        if (errors?.['minlength']) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
        if (errors?.['maxlength']) return 'Password must be 64 characters or less.'
        if (errors?.['weakPassword']) return 'Password must include at least one letter and one number.'
        break
      case 'confirmPassword':
        if (this.signupForm.hasError('fieldsMismatch')) return 'Passwords do not match.'
        break
    }
    return ''
  }

  togglePassword(){
    this.showPassword.update(show => !show)
  }

  handleSignup(){
    this.submitted.set(true)
    this.errorMessage.set('')

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched()
      return
    }

    const email=this.signupForm.controls.email.value.trim().toLowerCase()
    const password= this.signupForm.controls.password.value
    const username=this.signupForm.controls.username.value.trim()
    this.loading.set(true)
      this.authService.signup({username,email,password}).subscribe({
        next : ()=>{
            this.loading.set(false)
            this.router.navigate(['/login'], { queryParams: { registered: 1 } })
        },
        error : (err)=>{
          this.loading.set(false)
          this.errorMessage.set(
            err?.error?.message || 'Unable to create account. Please try again.'
          )
        }
      })
  }
}
