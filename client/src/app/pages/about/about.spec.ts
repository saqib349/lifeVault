import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { About } from './about';
import { AuthService } from '../../services/auth-service';

describe('About', () => {
  let fixture: ComponentFixture<About>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    await fixture.whenStable();
  });

  it('should list the three steps and four features', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.steps li').length).toBe(3);
    expect(el.querySelectorAll('.features .card').length).toBe(4);
  });

  it('should invite guests to sign up', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.primary-button')?.getAttribute('href')).toBe('/signup');
  });

  it('should send logged-in users to upload', async () => {
    TestBed.inject(AuthService).islogedIn.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.primary-button')?.getAttribute('href')).toBe('/');
  });
});
