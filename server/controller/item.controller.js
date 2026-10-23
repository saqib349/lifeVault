import mongoose from "mongoose";
import Item from "../models/Item.js";
import Document from "../models/Document.js";
import { interpretQuery } from "../services/gemini.service.js";

export async function createItem(req, res, next) {
    try {
        const {
            documentId,
            itemName,
            merchant,
            purchaseDate,
            price,
            currency,
            category,
            warrantyPeriod,
            warrantyExpiryDate,
            returnDeadline
        } = req.body;

        if (!itemName?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Item name is required."
            });
        }

        let document = null;

        if (documentId) {
            document = await Document.findOne({
                _id: documentId,
                userId: req.user._id,
                status: "pending"
            });

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: "Pending document not found."
                });
            }
        }

        const item = await Item.create({
            userId: req.user._id,

            itemName: itemName.trim(),

            merchant:
                merchant?.trim() || null,

            purchaseDate:
                purchaseDate || null,

            price:
                price ?? null,

            currency:
                currency || null,

            category:
                category || null,

            warrantyPeriod:
                warrantyPeriod || null,

            warrantyExpiryDate:
                warrantyExpiryDate || null,

            returnDeadline:
                returnDeadline || null,

            documentId:
                document?._id || null
        });

        /*
         * Now permanently attach the document
         * to this item.
         */
        if (document) {
            document.status = "attached";
            document.itemId = item._id;

            await document.save();
        }

        const populatedItem =
            await Item.findById(item._id)
                .populate("documentId");

        return res.status(201).json({
            success: true,

            message: "Item saved successfully.",

            data: populatedItem
        });

    } catch (error) {
        next(error);
    }
}

export async function getMyItems(req, res, next) {
    try {
        const {
            search = "",
            merchant: merchantFilter = "",
            category: categoryFilter = "",
            warrantyStatus = "",
            page = "1",
            limit = "50"
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;

        /* Base filter: always constrained to the authenticated user */
        const filter = { userId: req.user._id };

        /* Free-text search across itemName and merchant */
        if (search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { itemName: regex },
                { merchant: regex }
            ];
        }

        /* Exact-ish merchant filter (case-insensitive) */
        if (merchantFilter.trim()) {
            filter.merchant = new RegExp(
                `^${merchantFilter.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                "i"
            );
        }

        /* Category filter */
        if (categoryFilter.trim()) {
            filter.category = new RegExp(
                `^${categoryFilter.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                "i"
            );
        }

        /* Warranty status filter */
        const now = new Date();
        if (warrantyStatus === "active") {
            filter.warrantyExpiryDate = { $gt: now };
        } else if (warrantyStatus === "expired") {
            filter.warrantyExpiryDate = { $lte: now, $ne: null };
        } else if (warrantyStatus === "missing") {
            filter.warrantyExpiryDate = null;
        }

        const [items, total] = await Promise.all([
            Item.find(filter)
                .populate("documentId")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Item.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            count: items.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: items
        });

    } catch (error) {
        next(error);
    }
}

export async function getItemById(req, res, next) {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate("documentId");

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: item
        });

    } catch (error) {
        next(error);
    }
}

/*
 * POST /api/items/query
 *
 * AI-assisted natural-language receipt retrieval.
 * The user's question is sent to Gemini which returns a
 * structured IntentPayload. That payload is validated
 * against an allowlist before a safe Mongoose query is built.
 * The user's ownership (userId) is ALWAYS enforced.
 */
export async function queryItems(req, res, next) {
    try {
        const { question } = req.body;

        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "A question is required."
            });
        }

        const questionStr = question.trim().slice(0, 500); // guard against huge payloads

        /* Get today's date in the server timezone */
        const todayISO = new Date().toISOString().split("T")[0];

        /* Ask Gemini to interpret intent */
        let intent;
        try {
            intent = await interpretQuery(questionStr, todayISO);
        } catch (aiError) {
            return res.status(503).json({
                success: false,
                message: "AI service is temporarily unavailable. Please try again."
            });
        }

        /* ------------------------------------------------
         * Safe query builder
         * Only allowlisted fields / operators are used.
         * Ownership is mandatory.
         * ------------------------------------------------ */
        const filter = { userId: req.user._id };

        const ALLOWED_FILTER_TYPES = new Set([
            "expiry_range",
            "no_expiry",
            "warranty_active",
            "warranty_expired",
            "text_search",
            "date_range",
            "price_sort",
            "all"
        ]);

        const ALLOWED_SEARCH_FIELDS = new Set([
            "itemName",
            "merchant",
            "category"
        ]);

        const filterType = ALLOWED_FILTER_TYPES.has(intent.filterType)
            ? intent.filterType
            : "all";

        const now = new Date();

        switch (filterType) {
            case "expiry_range": {
                const from = isValidDateStr(intent.dateRange?.from)
                    ? new Date(intent.dateRange.from)
                    : now;
                const to = isValidDateStr(intent.dateRange?.to)
                    ? new Date(intent.dateRange.to + "T23:59:59.999Z")
                    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                filter.warrantyExpiryDate = { $gte: from, $lte: to };
                break;
            }

            case "no_expiry": {
                filter.warrantyExpiryDate = null;
                break;
            }

            case "warranty_active": {
                filter.warrantyExpiryDate = { $gt: now };
                break;
            }

            case "warranty_expired": {
                filter.warrantyExpiryDate = { $lte: now, $ne: null };
                break;
            }

            case "text_search": {
                const field = ALLOWED_SEARCH_FIELDS.has(intent.searchField)
                    ? intent.searchField
                    : "itemName";
                const term = typeof intent.searchTerm === "string" && intent.searchTerm.trim()
                    ? intent.searchTerm.trim().slice(0, 200)
                    : null;
                if (term) {
                    filter[field] = new RegExp(
                        term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                        "i"
                    );
                }
                break;
            }

            case "date_range": {
                const from = isValidDateStr(intent.dateRange?.from)
                    ? new Date(intent.dateRange.from)
                    : null;
                const to = isValidDateStr(intent.dateRange?.to)
                    ? new Date(intent.dateRange.to + "T23:59:59.999Z")
                    : null;
                if (from || to) {
                    filter.purchaseDate = {};
                    if (from) filter.purchaseDate.$gte = from;
                    if (to) filter.purchaseDate.$lte = to;
                }
                break;
            }

            case "price_sort":
            case "all":
            default:
                /* No extra filter — returns all user items */
                break;
        }

        /* Sort */
        let sort = { createdAt: -1 };
        if (intent.sortByPrice === "asc") sort = { price: 1, createdAt: -1 };
        else if (intent.sortByPrice === "desc") sort = { price: -1, createdAt: -1 };

        /* Limit — cap at 50 */
        const limitNum = Math.min(
            50,
            Math.max(1, Number.isInteger(intent.limit) ? intent.limit : 20)
        );

        const items = await Item.find(filter)
            .populate("documentId")
            .sort(sort)
            .limit(limitNum);

        return res.status(200).json({
            success: true,
            count: items.length,
            explanation: typeof intent.explanation === "string"
                ? intent.explanation.slice(0, 500)
                : `Found ${items.length} receipt${items.length !== 1 ? "s" : ""} matching your query.`,
            data: items
        });

    } catch (error) {
        next(error);
    }
}

/* Helper: validate YYYY-MM-DD strings coming from Gemini */
function isValidDateStr(value) {
    if (typeof value !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value);
    return !isNaN(d.getTime());
}
