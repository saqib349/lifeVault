import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { VaultService } from '../../services/vault-service';
import { Item } from '../../models/item';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

type WarrantyFilter = '' | 'active' | 'expired' | 'missing';

@Component({
    selector: 'app-vault',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './vault.html',
    styleUrl: './vault.css',
})
export class Vault implements OnInit, OnDestroy {
    private vaultService = inject(VaultService);
    private authService = inject(AuthService);
    private router = inject(Router);

    /* ---- state ---- */
    items = signal<Item[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);
    total = signal(0);

    searchQuery = '';
    selectedCategory = '';
    selectedWarrantyStatus: WarrantyFilter = '';

    selectedItem = signal<Item | null>(null);

    /* pagination */
    page = signal(1);
    readonly limit = 24;
    totalPages = signal(1);

    /* search debounce */
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    readonly categories = [
        'Electronics', 'Appliances', 'Furniture',
        'Clothing', 'Vehicle', 'Subscription', 'Insurance', 'Other'
    ];

    readonly warrantyOptions: { value: WarrantyFilter; label: string }[] = [
        { value: '', label: 'All' },
        { value: 'active', label: 'Under Warranty' },
        { value: 'expired', label: 'Expired' },
        { value: 'missing', label: 'No Expiry Set' },
    ];

    ngOnInit(): void {
        if (!this.authService.islogedIn()) {
            console.log(this.authService.islogedIn())
            // this.router.navigate(['/login']);
            return;
        }
        console.log(this.authService.islogedIn())

        this.searchSubject.pipe(
            debounceTime(350),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.page.set(1);
            this.loadItems();
        });

        this.loadItems();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadItems(): void {
        this.loading.set(true);
        this.error.set(null);

        this.vaultService.getMyItems({
            search: this.searchQuery,
            category: this.selectedCategory,
            warrantyStatus: this.selectedWarrantyStatus,
            page: this.page(),
            limit: this.limit
        }).subscribe({
            next: (res) => {
                this.items.set(res.data);
                this.total.set(res.total);
                this.totalPages.set(res.totalPages);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err?.error?.message || 'Failed to load receipts.');
                this.loading.set(false);
            }
        });
    }

    onSearch(value: string): void {
        this.searchQuery = value;
        this.searchSubject.next(value);
    }

    applyFilter(): void {
        this.page.set(1);
        this.loadItems();
    }

    clearFilters(): void {
        this.searchQuery = '';
        this.selectedCategory = '';
        this.selectedWarrantyStatus = '';
        this.page.set(1);
        this.loadItems();
    }

    openDetail(item: Item): void {
        this.selectedItem.set(item);
    }

    closeDetail(): void {
        this.selectedItem.set(null);
    }

    prevPage(): void {
        if (this.page() > 1) {
            this.page.update(p => p - 1);
            this.loadItems();
        }
    }

    nextPage(): void {
        if (this.page() < this.totalPages()) {
            this.page.update(p => p + 1);
            this.loadItems();
        }
    }

    /* ---- helpers ---- */

    formatDate(value: string | null): string {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatPrice(item: Item): string {
        if (item.price == null) return '—';
        const currency = item.currency || '';
        return `${currency} ${item.price.toLocaleString()}`.trim();
    }

    warrantyBadge(item: Item): { label: string; cls: string } {
        if (!item.warrantyExpiryDate) {
            return { label: 'No Expiry', cls: 'badge-none' };
        }
        const exp = new Date(item.warrantyExpiryDate);
        const now = new Date();
        if (isNaN(exp.getTime())) return { label: 'No Expiry', cls: 'badge-none' };
        if (exp > now) {
            const days = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
            if (days <= 30) return { label: `${days}d left`, cls: 'badge-warning' };
            return { label: 'Active', cls: 'badge-active' };
        }
        return { label: 'Expired', cls: 'badge-expired' };
    }

    isImage(mimeType: string | null | undefined): boolean {
        return !!mimeType && mimeType.startsWith('image/');
    }

    previewUrl(item: Item): void {
        if (!item.documentId) return;

        this.vaultService
            .getDocument(item.documentId._id)
            .subscribe({
                next: (blob) => {
                    const url = URL.createObjectURL(blob);

                    window.open(url, '_blank');

                    // Revoke the URL after the browser has had time to load it.
                    setTimeout(() => URL.revokeObjectURL(url), 60_000);
                },
                error: (err) => {
                    console.error('Failed to open receipt:', err);
                }
            });
    }


    downloadFile(item: Item): void {
        const documentId = item.documentId?._id;

        if (!documentId) {
            console.error('Document ID is missing');
            return;
        }

        this.vaultService.getDownload(documentId).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');

                link.href = url;
                link.download = item.documentId?.originalName || 'receipt';

                document.body.appendChild(link);
                link.click();
                link.remove();

                URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Failed to download receipt:', err);
                this.error.set(
                    err?.error?.message || 'Failed to download receipt.'
                );
            }
        });
    }


    get hasActiveFilters(): boolean {
        return !!(this.searchQuery || this.selectedCategory || this.selectedWarrantyStatus);
    }

    get pageNumbers(): number[] {
        const total = this.totalPages();
        const cur = this.page();
        const result: number[] = [];
        for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) {
            result.push(i);
        }
        return result;
    }
}
