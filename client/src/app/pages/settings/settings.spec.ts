import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Settings } from './settings';
import { AuthService } from '../../services/auth-service';
import { environment } from '../../../environments/environment';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api/auth`;

  const profile = {
    _id: '1',
    username: 'saqib',
    email: 'saqib@example.com',
    role: 'user',
    twoFactorEnabled: false,
    createdAt: '2026-10-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    localStorage.removeItem('token');

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    TestBed.inject(AuthService).islogedIn.set(true);
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();

    http.expectOne(`${api}/me`).flush({ success: true, data: profile });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('token');
  });

  it('should show the account details', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('saqib@example.com');
    expect(el.querySelector('.badge')?.textContent?.trim()).toBe('Off');
  });

  it('should validate the change password form before sending', () => {
    component.passwordForm.setValue({
      currentPassword: 'secret123',
      newPassword: 'short',
      confirmPassword: 'other',
    });
    component.changePassword();

    expect(component.getPasswordError('newPassword')).toContain('at least 8 characters');
    expect(component.getPasswordError('confirmPassword')).toBe('Passwords do not match.');
    http.expectNone(`${api}/password`);
  });

  it('should change the password and keep the new token', () => {
    component.passwordForm.setValue({
      currentPassword: 'secret123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });
    component.changePassword();

    const req = http.expectOne(`${api}/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ currentPassword: 'secret123', newPassword: 'newpass123' });
    req.flush({ success: true, message: 'Password changed.', token: 'new-token' });

    expect(localStorage.getItem('token')).toBe('new-token');
    expect(component.passwordSuccess()).toBe('Password changed.');
  });

  it('should show the server error when the current password is wrong', () => {
    component.passwordForm.setValue({
      currentPassword: 'wrong123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });
    component.changePassword();

    http.expectOne(`${api}/password`).flush(
      { success: false, message: 'Current password is incorrect.' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.passwordError()).toBe('Current password is incorrect.');
  });

  it('should turn on 2FA with the emailed code', () => {
    component.startEnable();
    http.expectOne(`${api}/2fa/enable/request`).flush({ success: true, message: 'Code sent.' });
    expect(component.twoFactorStep()).toBe('code');

    component.codeControl.setValue('123456');
    component.confirmEnable();
    const req = http.expectOne(`${api}/2fa/enable/confirm`);
    expect(req.request.body).toEqual({ code: '123456' });
    req.flush({ success: true, message: 'Two-factor authentication is now on.' });

    expect(component.twoFactorStep()).toBe('idle');
    expect(component.profile()?.twoFactorEnabled).toBe(true);
  });

  it('should turn off 2FA with the password', () => {
    component.profile.set({ ...profile, twoFactorEnabled: true });

    component.startDisable();
    component.confirmDisable();
    http.expectNone(`${api}/2fa/disable`);

    component.disablePasswordControl.setValue('secret123');
    component.confirmDisable();
    http.expectOne(`${api}/2fa/disable`).flush({ success: true, message: 'Two-factor authentication is now off.' });

    expect(component.profile()?.twoFactorEnabled).toBe(false);
  });
});
