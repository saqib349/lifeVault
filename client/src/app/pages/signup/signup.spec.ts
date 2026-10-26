import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject a weak password and mismatched confirmation', () => {
    component.signupForm.setValue({
      username: 'saqib',
      email: 'saqib@example.com',
      password: 'abcdefgh',
      confirmPassword: 'different1',
    });
    component.handleSignup();

    expect(component.getError('password')).toContain('letter and one number');
    expect(component.getError('confirmPassword')).toBe('Passwords do not match.');
    expect(component.loading()).toBe(false);
  });

  it('should reject an email without a domain extension', () => {
    component.signupForm.controls.email.setValue('saqib@example');
    expect(component.signupForm.controls.email.valid).toBe(false);
  });

  it('should accept valid details', () => {
    component.signupForm.setValue({
      username: 'saqib',
      email: 'saqib@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    expect(component.signupForm.valid).toBe(true);
  });
});
