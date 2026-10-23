process.loadEnvFile()

import express from "express"
import cors from "cors"

import { connectDB } from "./config/database.js"
import authRouter from "./router/auth.router.js"
import itemRouter from "./router/item.router.js"
import documentRouter from "./router/document.router.js"
import { authMiddleware } from "./middlewares/auth.middleware.js"
import { errorHandler } from "./middlewares/errorHandler.js"

const app = express()
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200',
}))

app.use('/api/auth', authRouter)
app.use("/api/items", itemRouter)
app.use("/api/documents", documentRouter)
app.use('/authme', authMiddleware, (req, res) => {
    return res.status(200).json({
        message: "sucessfully fetch user",
        data: req.user
    })
})

app.use(errorHandler)

const startServer = async () => {
    await connectDB()
    app.listen(process.env.PORT, () => {
        console.log("server is listening on port, ", process.env.PORT)
    })
}
await startServer()