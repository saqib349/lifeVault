import express from "express";

import {
    createItem,
    getMyItems,
    getItemById,
    queryItems
} from "../controller/item.controller.js";

import {
    extractItemFromDocument
} from "../controller/ai.controller.js";

import { uploadDocument } from "../middlewares/upload.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();


/*
 * AI extraction
 *
 * POST /api/items/extract
 */
router.post(
    "/extract",
    authMiddleware,
    uploadDocument.single("document"),
    extractItemFromDocument
);


/*
 * AI Assistant — natural-language query
 *
 * POST /api/items/query
 *
 * IMPORTANT: must be declared before /:id
 * so "query" is not treated as an id param.
 */
router.post(
    "/query",
    authMiddleware,
    queryItems
);


/*
 * Save reviewed item
 *
 * POST /api/items
 */
router.post(
    "/",
    authMiddleware,
    createItem
);


/*
 * My Vault — list all user items
 *
 * GET /api/items?search=&merchant=&category=&warrantyStatus=&page=&limit=
 */
router.get(
    "/",
    authMiddleware,
    getMyItems
);


/*
 * Item detail
 *
 * GET /api/items/:id
 */
router.get(
    "/:id",
    authMiddleware,
    getItemById
);


export default router;