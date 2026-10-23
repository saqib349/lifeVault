import fs from "fs";
import path from "path";
import Document from "../models/Document.js";

export async function getDocument(req, res, next) {
    try {
        const { id } = req.params;

        const document = await Document.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        if (!fs.existsSync(document.path)) {
            return res.status(404).json({
                success: false,
                message: "Document file is missing."
            });
        }

        res.setHeader(
            "Content-Type",
            document.mimeType
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${encodeURIComponent(
                document.originalName
            )}"`
        );

        const stream = fs.createReadStream(
            path.resolve(document.path)
        );

        stream.on("error", next);

        stream.pipe(res);

    } catch (error) {
        next(error);
    }
}


export async function downloadDocument(req, res, next) {
    try {
        const { id } = req.params;

        const document = await Document.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found."
            });
        }

        if (!fs.existsSync(document.path)) {
            return res.status(404).json({
                success: false,
                message: "Document file is missing."
            });
        }

        return res.download(
            path.resolve(document.path),
            document.originalName
        );

    } catch (error) {
        next(error);
    }
}