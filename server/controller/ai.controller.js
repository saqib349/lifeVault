import Document from "../models/Document.js";
import { extractDocumentData } from "../services/gemini.service.js";
import { deleteFile } from "../utils/files.js";

export async function extractItemFromDocument(req, res, next) {
    let document = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Document file is required."
            });
        }

        const file = req.file;

        /*
         * Create Document immediately.
         *
         * It is pending until the user confirms
         * the extracted information.
         */
        document = await Document.create({
            userId: req.user._id,

            originalName: file.originalname,

            storedName: file.filename,

            mimeType: file.mimetype,

            size: file.size,

            path: file.path,

            status: "pending"
        });

        const extractedData =
            await extractDocumentData(
                file.path,
                file.mimetype
            );

        const documentId = document._id.toString();

        return res.status(200).json({
            success: true,

            message: "Document analyzed successfully.",

            data: {
                document: {
                    id: documentId,

                    originalName: document.originalName,

                    mimeType: document.mimeType,

                    size: document.size,

                    previewUrl:
                        `/api/documents/${documentId}`,

                    downloadUrl:
                        `/api/documents/${documentId}/download`
                },

                extractedData
            }
        });

    } catch (error) {

        /*
         * If Gemini fails after the file was uploaded,
         * remove both DB record and physical file.
         */
        if (document) {
            await deleteFile(document.path);
            await Document.findByIdAndDelete(document._id);
        } else if (req.file) {
            await deleteFile(req.file.path);
        }

        next(error);
    }
}