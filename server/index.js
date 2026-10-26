
// Must stay the first import (see config/env.js).
import "./config/env.js";

import express from "express";
import cors from "cors";

import { connectDB } from "./config/database.js";
import authRouter from "./router/auth.router.js";
import itemRouter from "./router/item.router.js";
import documentRouter from "./router/document.router.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const allowedOrigins = [
    "http://localhost:4200",
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use(express.json());

// Connect to MongoDB before handling requests.
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});

// for testing
app.get("/", (req, res) => {
    return res.status(200).json({
        message: "server successfully deployed"
    })
})

// Routes
app.use("/api/auth", authRouter);
app.use("/api/items", itemRouter);
app.use("/api/documents", documentRouter);

app.use("/authme", authMiddleware, (req, res) => {
    return res.status(200).json({
        message: "Successfully fetched user",
        data: req.user,
    });
});

// Centralized error handler must remain last.
app.use(errorHandler);

// Vercel imports this app to handle requests.
export default app;

// Local development only.
if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT || 8000;

    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
}
