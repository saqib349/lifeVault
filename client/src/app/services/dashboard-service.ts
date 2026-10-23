import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ExtractDocumentResponse, SaveItemRequest, SaveItemResponse } from '../models/Document';

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
    private http = inject(HttpClient);

    extractData(file: File) {
        const formData = new FormData();
        formData.append('document', file);
        return this.http.post<ExtractDocumentResponse>(
            'http://localhost:8000/api/items/extract',
            formData
        );
    }

    saveItem(body: SaveItemRequest) {
        return this.http.post<SaveItemResponse>(
            'http://localhost:8000/api/items',
            body
        );
    }
}
