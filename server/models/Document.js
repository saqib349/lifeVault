import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // required: true,
            index: true
        },

        originalName: {
            type: String,
            // required: true,
            trim: true
        },

        storedName: {
            type: String,
            required: true,
            unique: true
        },

        mimeType: {
            type: String,
            required: true
        },

        size: {
            type: Number,
            required: true
        },

        path: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "attached"],
            default: "pending"
        },

        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            default: null
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Document", documentSchema);