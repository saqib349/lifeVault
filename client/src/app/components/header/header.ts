import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  authService = inject(AuthService)
  private elementRef = inject(ElementRef)

  menuOpen = signal(false)

  displayName = computed(() => this.authService.username() || 'User')

  initials = computed(() => {
    const parts = this.displayName().trim().split(/\s+/)
    const letters = parts.length > 1
      ? parts[0].charAt(0) + parts[1].charAt(0)
      : parts[0].charAt(0)
    return letters.toUpperCase() || 'U'
  })

  toggleMenu(): void {
    this.menuOpen.update(open => !open)
  }

  closeMenu(): void {
    this.menuOpen.set(false)
  }

  // Close the profile menu when clicking anywhere outside the header.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu()
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu()
  }

  logout(): void {
    this.closeMenu()
    this.authService.logout();
  }
}
