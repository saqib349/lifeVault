import fs from "fs/promises";

export async function deleteFile(filePath) {
    if (!filePath) {
        return;
    }

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error(
                "Failed to delete file:",
                error.message
            );
        }
    }
}