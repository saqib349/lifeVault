import { DocumentInfo } from './Document';

export interface Item {
    _id: string;
    userId: string;
    itemName: string;
    merchant: string | null;
    purchaseDate: string | null;
    price: number | null;
    currency: string | null;
    category: string | null;
    warrantyPeriod: string | null;
    warrantyExpiryDate: string | null;
    returnDeadline: string | null;
    documentId: DocumentInfo | null;
    createdAt: string;
    updatedAt: string;
}

export interface GetItemsResponse {
    success: boolean;
    count: number;
    total: number;
    page: number;
    totalPages: number;
    data: Item[];
}

export interface GetItemResponse {
    success: boolean;
    data: Item;
}

export interface QueryItemsResponse {
    success: boolean;
    count: number;
    explanation: string;
    data: Item[];
}
