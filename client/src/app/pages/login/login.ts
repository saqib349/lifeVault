import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
  errorMessage = signal ('')
  loginForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable:true,
      validators: [
        Validators.required,
        Validators.minLength(3)
      ]
    }),
    password: new FormControl<string>('', {
      nonNullable:true,
      validators: [
        Validators.required,
        Validators.minLength(3)
      ]
    })
  })

  handleLogin(){
    const email=this.loginForm.controls.email.value 
    const password= this.loginForm.controls.password.value
    console.log(email,password)
    this.loading.set(true)
      this.authService.login({email,password}).subscribe({
        next : ()=>{
           this.loading.set(false)
            this.router.navigate(['/'])
        },
        error : (err)=>{
          this.errorMessage.set(err.error.message)
        }
      })
    
    
  }
}
