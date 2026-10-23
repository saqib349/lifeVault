
import { verifyToken } from "../utils/tokens.js";

export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        console.log(authHeader)

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];
        console.log("token : ", token)

        const decoded = verifyToken(
            token,
            process.env.JWT_SECRET
        );
        console.log("decoded: ",decoded)
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}