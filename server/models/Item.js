import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        itemName: {
            type: String,
            required: true,
            trim: true
        },

        merchant: {
            type: String,
            default: null,
            trim: true
        },

        purchaseDate: {
            type: Date,
            default: null
        },

        price: {
            type: Number,
            default: null
        },

        currency: {
            type: String,
            default: "PKR"
        },

        category: {
            type: String,
            default: null
        },

        warrantyPeriod: {
            type: String,
            default: null
        },

        warrantyExpiryDate: {
            type: Date,
            default: null
        },

        returnDeadline: {
            type: Date,
            default: null
        },

        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            default: null
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Item", itemSchema);