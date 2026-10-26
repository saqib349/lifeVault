import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { QueryItemsResponse } from '../models/item';

@Injectable({ providedIn: 'root' })
export class AiService {
    private http = inject(HttpClient);
    private readonly base = `${environment.apiUrl}/api/items`;

    queryReceipts(question: string) {
        return this.http.post<QueryItemsResponse>(`${this.base}/query`, { question });
    }
}
