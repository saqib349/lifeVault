import fs from "fs/promises";
import gemini from "../config/gemini.js";

/* ============================================================
   EXTRACTION — existing functionality
   ============================================================ */

const extractionSchema = {
    type: "object",

    properties: {
        itemName: {
            type: "string",
            nullable: true
        },

        merchant: {
            type: "string",
            nullable: true
        },

        purchaseDate: {
            type: "string",
            nullable: true
        },

        price: {
            type: "number",
            nullable: true
        },

        currency: {
            type: "string",
            nullable: true
        },

        category: {
            type: "string",
            nullable: true
        },

        warrantyPeriod: {
            type: "string",
            nullable: true
        },

        warrantyExpiryDate: {
            type: "string",
            nullable: true
        },

        returnDeadline: {
            type: "string",
            nullable: true
        }
    },

    required: [
        "itemName",
        "merchant",
        "purchaseDate",
        "price",
        "currency",
        "category",
        "warrantyPeriod",
        "warrantyExpiryDate",
        "returnDeadline"
    ]
};

const extractionPrompt = `
You are an expert document extraction system for LifeVault.

Analyze the uploaded receipt, invoice, warranty card, or purchase document.

Extract only information that is actually present in the document.

IMPORTANT RULES:

1. Never invent information.
2. If a field is not present or cannot be determined, return null.
3. Do not guess warranty information.
4. Do not guess dates.
5. Do not guess prices.
6. Convert dates into YYYY-MM-DD when possible.
7. For currency, use the currency code such as PKR, USD, EUR.
8. category should be a simple category such as:
   Electronics, Appliances, Furniture, Clothing,
   Vehicle, Subscription, Insurance, Other.
9. warrantyExpiryDate should only be returned if it is explicitly
   present OR can be reliably calculated from an explicitly stated
   purchase date and warranty period.
10. returnDeadline should only be returned if present or reliably
    calculated from an explicitly stated return period.
11. The output must follow the provided JSON schema.
`;

export async function extractDocumentData(filePath, mimeType) {
    const fileBuffer = await fs.readFile(filePath);

    const base64Data = fileBuffer.toString("base64");

    const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash-lite",

        contents: [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType,
                            data: base64Data
                        }
                    },
                    {
                        text: extractionPrompt
                    }
                ]
            }
        ],

        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    });

    if (!response.text) {
        throw new Error("Gemini returned an empty response.");
    }

    try {
        return JSON.parse(response.text);
    } catch {
        throw new Error(
            "Gemini returned invalid structured data."
        );
    }
}


/* ============================================================
   QUERY INTERPRETATION — AI Assistant
   ============================================================ */

const intentSchema = {
    type: "object",

    properties: {
        filterType: {
            type: "string"
        },
        dateRange: {
            type: "object",
            nullable: true,
            properties: {
                from: { type: "string", nullable: true },
                to: { type: "string", nullable: true }
            }
        },
        searchField: {
            type: "string",
            nullable: true
        },
        searchTerm: {
            type: "string",
            nullable: true
        },
        sortByPrice: {
            type: "string",
            nullable: true
        },
        limit: {
            type: "number",
            nullable: true
        },
        explanation: {
            type: "string"
        }
    },

    required: [
        "filterType",
        "dateRange",
        "searchField",
        "searchTerm",
        "sortByPrice",
        "limit",
        "explanation"
    ]
};

export async function interpretQuery(question, currentDateISO) {
    const prompt = `
You are the AI query interpreter for LifeVault, a personal receipt and warranty manager.

Today's date is: ${currentDateISO}

The user asked: "${question}"

Based on the question, produce a structured JSON response that describes what receipts to search for.

RULES:
1. filterType must be exactly one of:
   - "expiry_range"    : warranty/expiry date within a date range
   - "no_expiry"       : items that have no expiry date set
   - "warranty_active" : items whose warrantyExpiryDate is in the future
   - "warranty_expired": items whose warrantyExpiryDate has already passed
   - "text_search"     : search by product name, merchant, or category
   - "date_range"      : filter by purchaseDate within a range
   - "price_sort"      : return all items sorted by price
   - "all"             : no specific filter (return all)

2. dateRange: if applicable, provide { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }.
   - "tomorrow" means from ${getDateOffset(currentDateISO, 1)} to ${getDateOffset(currentDateISO, 1)}
   - "this week" means from ${getWeekStart(currentDateISO)} to ${getWeekEnd(currentDateISO)}
   - "this month" means from ${getMonthStart(currentDateISO)} to ${getMonthEnd(currentDateISO)}
   - "last month" means from ${getLastMonthStart(currentDateISO)} to ${getLastMonthEnd(currentDateISO)}
   - Otherwise calculate the range accurately based on today's date.
   - Set to null if not applicable.

3. searchField: one of "itemName", "merchant", "category", or null.

4. searchTerm: the text to search for, or null.

5. sortByPrice: "asc", "desc", or null.

6. limit: number of results to return (default 20, max 50).

7. explanation: a short, friendly one-sentence explanation of what you are searching for.
   Example: "Showing receipts whose warranty expires tomorrow."
   If the question is not about receipts or is too vague, set filterType to "all" and 
   explain that you're showing all receipts.

Output only valid JSON matching the schema. Do not add extra fields.
`;

    const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash-lite",

        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],

        config: {
            responseMimeType: "application/json",
            responseSchema: intentSchema
        }
    });

    if (!response.text) {
        throw new Error("Gemini returned an empty query interpretation.");
    }

    try {
        return JSON.parse(response.text);
    } catch {
        throw new Error("Gemini returned invalid intent JSON.");
    }
}


/* ============================================================
   Date helpers injected into prompt (computed server-side
   to avoid asking Gemini to calculate dates unreliably)
   ============================================================ */

function getDateOffset(isoDate, days) {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
}

function getWeekStart(isoDate) {
    const d = new Date(isoDate);
    const day = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - day);
    return d.toISOString().split("T")[0];
}

function getWeekEnd(isoDate) {
    const d = new Date(isoDate);
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day));
    return d.toISOString().split("T")[0];
}

function getMonthStart(isoDate) {
    const d = new Date(isoDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getMonthEnd(isoDate) {
    const d = new Date(isoDate);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return last.toISOString().split("T")[0];
}

function getLastMonthStart(isoDate) {
    const d = new Date(isoDate);
    const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    return first.toISOString().split("T")[0];
}

function getLastMonthEnd(isoDate) {
    const d = new Date(isoDate);
    const last = new Date(d.getFullYear(), d.getMonth(), 0);
    return last.toISOString().split("T")[0];
}