import express from "express";
import {
    getDocument,
    downloadDocument
} from "../controller/document.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
    "/:id",
    authMiddleware,
    getDocument
);

router.get(
    "/:id/download",
    authMiddleware,
    downloadDocument
);

export default router;