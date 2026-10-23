import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';

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

  signupForm = new FormGroup({
    username: new FormControl<string>('', {
      nonNullable:true,
      validators: [
        Validators.required,
        Validators.minLength(3)
      ]
    }),
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

  handleSignup(){
    const email=this.signupForm.controls.email.value 
    const password= this.signupForm.controls.password.value
    const username=this.signupForm.controls.username.value
    this.loading.set(true)
      this.authService.signup({username,email,password}).subscribe({
        next : (result)=>{
            console.log(result)
            this.router.navigate(['/login'])
        }
      })
    
    
  }
}
