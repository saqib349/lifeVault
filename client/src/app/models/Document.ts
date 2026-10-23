
export interface ExtractDocumentResponse {
  success: boolean;
  message: string;
  data: {
    document: DocumentInfo;
    extractedData: ExtractedDocumentData;
  };
}


export interface DocumentInfo {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  previewUrl: string;
  downloadUrl: string;
}


export interface ExtractedDocumentData {
  itemName: string | null;
  merchant: string | null;
  purchaseDate: string | null;
  price: number | null;
  currency: string | null;
  category: string | null;
  warrantyPeriod: string | null;
  warrantyExpiryDate: string | null;
  returnDeadline: string | null;
}


export interface SaveItemRequest {
  documentId: string | null;
  itemName: string;
  merchant: string | null;
  purchaseDate: string | null;
  price: number | null;
  currency: string | null;
  category: string | null;
  warrantyPeriod: string | null;
  warrantyExpiryDate: string | null;
  returnDeadline: string | null;
}


export interface SaveItemResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}
