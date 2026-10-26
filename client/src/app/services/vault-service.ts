import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { GetItemsResponse, GetItemResponse } from '../models/item';

export interface GetItemsParams {
    search?: string;
    merchant?: string;
    category?: string;
    warrantyStatus?: '' | 'active' | 'expired' | 'missing';
    page?: number;
    limit?: number;
}

@Injectable({ providedIn: 'root' })
export class VaultService {
    private http = inject(HttpClient);
    private readonly base = `${environment.apiUrl}/api/items`;

    getMyItems(params: GetItemsParams = {}) {
        let httpParams = new HttpParams();
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.merchant) httpParams = httpParams.set('merchant', params.merchant);
        if (params.category) httpParams = httpParams.set('category', params.category);
        if (params.warrantyStatus) httpParams = httpParams.set('warrantyStatus', params.warrantyStatus);
        if (params.page) httpParams = httpParams.set('page', String(params.page));
        if (params.limit) httpParams = httpParams.set('limit', String(params.limit));

        return this.http.get<GetItemsResponse>(this.base, { params: httpParams });
    }

    getItemById(id: string) {
        return this.http.get<GetItemResponse>(`${this.base}/${id}`);
    }

    getDocumentUrl(documentId: string): string {
        return `${environment.apiUrl}/api/documents/${documentId}`;
    }

    getDocument(documentId: string) {
        return this.http.get(
            this.getDocumentUrl(documentId),
            { responseType: 'blob' }
        );
    }

    getDownloadUrl(documentId: string) {
        return `${environment.apiUrl}/api/documents/${documentId}/download`;
    }
    getDownload(documentId: string) {
        return this.http.get(
            this.getDownloadUrl(documentId),
            { responseType: 'blob' }
        );
    }
}
