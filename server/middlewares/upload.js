import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = process.env.UPLOAD_DIR || "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);

        const uniqueName =
            `${Date.now()}-${Math.random().toString(36).slice(2)}` +
            extension;

        cb(null, uniqueName);
    }
});

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
];

const fileFilter = (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
            new Error(
                "Only JPG, PNG, WEBP and PDF files are allowed."
            ),
            false
        );
    }

    cb(null, true);
};

const maxSize =
    Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024;

export const uploadDocument = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: maxSize
    }
});