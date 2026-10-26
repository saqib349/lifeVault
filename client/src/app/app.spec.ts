import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the header and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });
});

describe('Routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('should show the About page at /about', async () => {
    const harness = await RouterTestingHarness.create('/about');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Never lose a receipt'
    );
  });

  it('should show the Privacy Policy at /privacy', async () => {
    const harness = await RouterTestingHarness.create('/privacy');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Privacy Policy');
  });

  it('should show the Terms of Use at /terms', async () => {
    const harness = await RouterTestingHarness.create('/terms');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Terms of Use');
  });

  it('should show Not Found for unknown URLs', async () => {
    const harness = await RouterTestingHarness.create('/does-not-exist');
    expect(harness.routeNativeElement?.textContent).toContain('Page Not Found');
  });
});
