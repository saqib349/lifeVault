import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMAIL_PATTERN } from '../../validators/auth-validators';

@Component({
  imports: [ReactiveFormsModule,RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  authService = inject(AuthService)
  loading= signal(false)
  router=inject(Router)
  route = inject(ActivatedRoute)
  errorMessage = signal ('')
  showPassword = signal(false)
  submitted = signal(false)

  // Shown after a successful signup redirects here.
  successMessage = signal(
    this.route.snapshot.queryParamMap.get('registered')
      ? 'Account created successfully. Please sign in.'
      : ''
  )

  loginForm = new FormGroup({
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
        Validators.required
      ]
    })
  })

  showError(name: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[name]
    return control.invalid && (control.touched || this.submitted())
  }

  getError(name: 'email' | 'password'): string {
    const errors = this.loginForm.controls[name].errors
    if (!errors) return ''

    if (errors['required']) {
      return name === 'email' ? 'Email is required.' : 'Password is required.'
    }
    if (errors['email'] || errors['pattern']) {
      return 'Enter a valid email address.'
    }
    return ''
  }

  togglePassword(){
    this.showPassword.update(show => !show)
  }

  handleLogin(){
    this.submitted.set(true)
    this.errorMessage.set('')

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched()
      return
    }

    const email=this.loginForm.controls.email.value.trim().toLowerCase()
    const password= this.loginForm.controls.password.value
    this.loading.set(true)
      this.authService.login({email,password}).subscribe({
        next : (result)=>{
           this.loading.set(false)
           this.successMessage.set('')

           if (result.twoFactorRequired && result.tempToken) {
             this.tempToken.set(result.tempToken)
             this.codeSentTo.set(result.email || 'your email')
             this.codeControl.reset()
             return
           }

            this.router.navigate(['/'])
        },
        error : (err)=>{
          this.loading.set(false)
          this.successMessage.set('')
          this.errorMessage.set(
            err?.error?.message || 'Unable to sign in. Please try again.'
          )
        }
      })
  }

  /* ---- Step 2: email verification code (only when 2FA is on) ---- */

  // Set when the password step passed and a code was emailed.
  tempToken = signal('')
  codeSentTo = signal('')
  resending = signal(false)

  codeControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)]
  })

  get codeError(): string {
    if (!this.codeControl.touched || this.codeControl.valid) return ''
    return this.codeControl.hasError('required')
      ? 'Enter the 6-digit code.'
      : 'The code must be 6 digits.'
  }

  handleVerifyCode(){
    this.errorMessage.set('')
    this.successMessage.set('')
    this.codeControl.markAsTouched()

    if (this.codeControl.invalid || this.loading()) return

    this.loading.set(true)
    this.authService.verifyTwoFactor(this.tempToken(), this.codeControl.value).subscribe({
      next: () => {
        this.loading.set(false)
        this.router.navigate(['/'])
      },
      error: (err) => {
        this.loading.set(false)
        // An expired sign-in session can't be retried with a code.
        if (err?.status === 401) {
          this.backToPassword()
        }
        this.errorMessage.set(err?.error?.message || 'Unable to verify the code. Please try again.')
      }
    })
  }

  resendCode(){
    if (this.resending()) return

    this.errorMessage.set('')
    this.successMessage.set('')
    this.resending.set(true)

    this.authService.resendTwoFactorCode(this.tempToken()).subscribe({
      next: (result) => {
        this.resending.set(false)
        this.successMessage.set(result.message)
      },
      error: (err) => {
        this.resending.set(false)
        if (err?.status === 401) {
          this.backToPassword()
        }
        this.errorMessage.set(err?.error?.message || 'Unable to send a new code.')
      }
    })
  }

  backToPassword(){
    this.tempToken.set('')
    this.codeSentTo.set('')
    this.loginForm.controls.password.reset()
  }
}
