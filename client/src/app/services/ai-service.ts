import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { QueryItemsResponse } from '../models/item';

@Injectable({ providedIn: 'root' })
export class AiService {
    private http = inject(HttpClient);
    private readonly base = 'https://life-vault-2up2.vercel.app/api/items';

    queryReceipts(question: string) {
        return this.http.post<QueryItemsResponse>(`${this.base}/query`, { question });
    }
}
