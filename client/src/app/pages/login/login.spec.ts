import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Login } from './login';
import { AuthService } from '../../services/auth-service';
import { environment } from '../../../environments/environment';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api/auth`;

  beforeEach(async () => {
    localStorage.removeItem('token');

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('token');
  });

  function submitPassword() {
    component.loginForm.setValue({ email: 'saqib@example.com', password: 'secret123' });
    component.handleLogin();
    return http.expectOne(`${api}/login`);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show required errors when submitted empty', () => {
    component.handleLogin();
    expect(component.showError('email')).toBe(true);
    expect(component.getError('email')).toBe('Email is required.');
    expect(component.getError('password')).toBe('Password is required.');
    expect(component.loading()).toBe(false);
  });

  it('should sign in directly when 2FA is off', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    submitPassword().flush({
      message: 'ok',
      data: { _id: '1', username: 'saqib', role: 'user' },
      token: 'session-token',
    });

    expect(localStorage.getItem('token')).toBe('session-token');
    expect(TestBed.inject(AuthService).islogedIn()).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('should ask for the email code when 2FA is on', async () => {
    submitPassword().flush({
      message: 'Verification code sent',
      twoFactorRequired: true,
      tempToken: 'temp-token',
      email: 'sa***@example.com',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(localStorage.getItem('token')).toBeNull();
    expect(TestBed.inject(AuthService).islogedIn()).toBe(false);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#code')).toBeTruthy();
    expect(el.textContent).toContain('sa***@example.com');
  });

  it('should finish signing in with a valid code', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    submitPassword().flush({ message: 'sent', twoFactorRequired: true, tempToken: 'temp-token' });

    component.codeControl.setValue('12345');
    component.handleVerifyCode();
    expect(component.codeError).toBe('The code must be 6 digits.');
    http.expectNone(`${api}/2fa/verify`);

    component.codeControl.setValue('123456');
    component.handleVerifyCode();
    const req = http.expectOne(`${api}/2fa/verify`);
    expect(req.request.body).toEqual({ tempToken: 'temp-token', code: '123456' });
    req.flush({ message: 'ok', data: { _id: '1', username: 'saqib', role: 'user' }, token: 'session-token' });

    expect(localStorage.getItem('token')).toBe('session-token');
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('should go back to the password step when the code session expired', () => {
    submitPassword().flush({ message: 'sent', twoFactorRequired: true, tempToken: 'temp-token' });

    component.codeControl.setValue('123456');
    component.handleVerifyCode();
    http.expectOne(`${api}/2fa/verify`).flush(
      { message: 'Your sign-in session has expired. Please sign in again.' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(component.tempToken()).toBe('');
    expect(component.errorMessage()).toContain('expired');
  });
});
