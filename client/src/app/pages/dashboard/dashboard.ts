import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DashboardService } from '../../services/dashboard-service';
import { ExtractedDocumentData } from '../../models/Document';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

type Stage = 'idle' | 'file-selected' | 'extracting' | 'review' | 'saving' | 'saved';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService)
  private router = inject(Router)
  private fb = inject(FormBuilder);

  selectedFile: File | null = null;
  stage = signal<Stage>('idle');
  isExtracting = signal(false);
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  extractedDocumentId: string | null = null;

  itemForm: FormGroup = this.fb.group({
    itemName: ['', Validators.required],
    merchant: [''],
    purchaseDate: [''],
    price: [null],
    currency: ['PKR'],
    category: [''],
    warrantyPeriod: [''],
    warrantyExpiryDate: [''],
    returnDeadline: [''],
  });

  get fileSizeFormatted(): string {
    if (!this.selectedFile) return '';
    const mb = this.selectedFile.size / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(this.selectedFile.size / 1024).toFixed(0)} KB`;
  }

  get currencyLabel(): string {
    return this.itemForm.get('currency')?.value || 'PKR';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    this.errorMessage = null;
    this.selectedFile = file;
    this.stage.set('file-selected');
    this.successMessage = null;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.stage.set('idle');
    this.errorMessage = null;
    this.extractedDocumentId = null;
    this.itemForm.reset({ currency: 'PKR' });
  }

  onExtract(): void {
    if (!this.selectedFile || this.isExtracting()) return;
    if (!this.authService.islogedIn()) {
      this.router.navigate(['/login'])
    }

    this.isExtracting.set(true);
    this.stage.set('extracting');
    this.errorMessage = null;

    this.dashboardService.extractData(this.selectedFile).subscribe({
      next: (response) => {
        this.isExtracting.set(false);
        this.extractedDocumentId = response.data.document._id;
        this.populateForm(response.data.extractedData);
        this.stage.set('review')
      },
      error: (err) => {
        this.isExtracting.set(false);
        this.stage.set('file-selected');
        this.errorMessage =
          err?.error?.message ||
          'Extraction failed. Please check the file and try again.';
      },
    });
  }

  private populateForm(data: ExtractedDocumentData): void {
    this.itemForm.patchValue({
      itemName: data.itemName ?? '',
      merchant: data.merchant ?? '',
      purchaseDate: this.toDateInput(data.purchaseDate),
      price: data.price ?? null,
      currency: data.currency || 'PKR',
      category: this.normalizeCategory(data.category),
      warrantyPeriod: this.normalizeWarranty(data.warrantyPeriod),
      warrantyExpiryDate: this.toDateInput(data.warrantyExpiryDate),
      returnDeadline: this.toDateInput(data.returnDeadline),
    });
  }

  private toDateInput(value: string | null | undefined): string {
    if (!value) return '';
    // Already in YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  private normalizeCategory(value: string | null | undefined): string {
    if (!value) return '';
    const map: Record<string, string> = {
      'electronics': 'Electronics',
      'appliances': 'Appliances',
      'furniture': 'Furniture',
      'clothing': 'Clothing',
      'vehicle': 'Vehicle',
      'subscription': 'Subscription',
      'insurance': 'Insurance',
      'other': 'Other',
    };
    const lower = value.toLowerCase();
    return map[lower] ?? value;
  }

  private normalizeWarranty(value: string | null | undefined): string {
    if (!value) return '';
    const lower = value.toLowerCase().replace(/\s+/g, '-');
    const options = ['none', '3-months', '6-months', '1-year', '2-years', '3-years'];
    return options.find(o => o === lower) ?? value;
  }

  onCancel(): void {
    this.selectedFile = null;
    this.stage.set('idle');
    this.errorMessage = null;
    this.successMessage = null;
    this.extractedDocumentId = null;
    this.isExtracting.set(false);
    this.isSaving = false;
    this.itemForm.reset({ currency: 'PKR' });
  }

  onSave(): void {
    if (this.itemForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.stage.set('saving');
    this.errorMessage = null;

    const v = this.itemForm.value;
    const body = {
      documentId: this.extractedDocumentId,
      itemName: v.itemName,
      merchant: v.merchant || null,
      purchaseDate: v.purchaseDate || null,
      price: v.price != null ? Number(v.price) : null,
      currency: v.currency || null,
      category: v.category || null,
      warrantyPeriod: v.warrantyPeriod || null,
      warrantyExpiryDate: v.warrantyExpiryDate || null,
      returnDeadline: v.returnDeadline || null,
    };

    this.dashboardService.saveItem(body).subscribe({
      next: () => {
        this.isSaving = false;
        this.stage.set('saved')
        this.successMessage = 'Document saved to your LifeVault successfully!';
        // Reset after brief delay so user sees the success banner
        setTimeout(() => this.onCancel(), 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.stage.set('review')
        this.errorMessage =
          err?.error?.message ||
          'Failed to save. Please try again.';
      },
    });
  }
}
