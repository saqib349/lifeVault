import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiService } from '../../services/ai-service';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { Item } from '../../models/item';

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    items?: Item[];
    loading?: boolean;
    error?: boolean;
}

@Component({
    selector: 'app-ai',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './ai.html',
    styleUrl: './ai.css',
})
export class Ai implements OnInit, AfterViewChecked {
    private aiService = inject(AiService);
    private authService = inject(AuthService);
    private router = inject(Router);

    @ViewChild('chatEnd') chatEnd!: ElementRef;

    messages = signal<ChatMessage[]>([]);
    question = '';
    isLoading = signal(false);

    readonly examples = [
        'Show receipts expiring this month',
        'Which products are still under warranty?',
        'Find receipts with no expiry date',
        'Show me my most expensive purchase',
        'What did I buy last month?',
        'Find my electronics receipts',
    ];

    ngOnInit(): void {
        if (!this.authService.islogedIn()) {
            this.router.navigate(['/login']);
            return;
        }
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        try {
            this.chatEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } catch { /* ignore */ }
    }

    useExample(example: string): void {
        this.question = example;
        this.send();
    }

    send(): void {
        const q = this.question.trim();
        if (!q || this.isLoading()) return;

        this.question = '';
        this.isLoading.set(true);

        /* Append user message */
        this.messages.update(msgs => [
            ...msgs,
            { role: 'user', text: q },
            { role: 'assistant', text: '', loading: true }
        ]);

        this.aiService.queryReceipts(q).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                this.messages.update(msgs => {
                    const updated = [...msgs];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                        role: 'assistant',
                        text: res.explanation,
                        items: res.data,
                        loading: false,
                        error: false
                    };
                    return updated;
                });
            },
            error: (err) => {
                this.isLoading.set(false);
                const errMsg =
                    err?.error?.message ||
                    'Something went wrong. Please try again.';
                this.messages.update(msgs => {
                    const updated = [...msgs];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                        role: 'assistant',
                        text: errMsg,
                        loading: false,
                        error: true
                    };
                    return updated;
                });
            }
        });
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.send();
        }
    }

    clearChat(): void {
        this.messages.set([]);
    }

    /* helpers */

    formatDate(value: string | null): string {
        if (!value) return '—';
        const d = new Date(value);
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatPrice(item: Item): string {
        if (item.price == null) return '';
        return `${item.currency || ''} ${item.price.toLocaleString()}`.trim();
    }

    warrantyBadge(item: Item): { label: string; cls: string } {
        if (!item.warrantyExpiryDate) return { label: 'No Expiry', cls: 'badge-none' };
        const exp = new Date(item.warrantyExpiryDate);
        if (isNaN(exp.getTime())) return { label: 'No Expiry', cls: 'badge-none' };
        const now = new Date();
        if (exp > now) {
            const days = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
            if (days <= 30) return { label: `${days}d left`, cls: 'badge-warning' };
            return { label: 'Active', cls: 'badge-active' };
        }
        return { label: 'Expired', cls: 'badge-expired' };
    }
}
