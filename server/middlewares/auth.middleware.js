
import User from "../models/User.js";
import { isTwoFactorToken, verifyToken } from "../utils/tokens.js";

function unauthorized(res, message = "Invalid or expired token") {
    return res.status(401).json({
        success: false,
        message
    });
}

export async function authMiddleware(req, res, next) {
    let decoded;

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return unauthorized(res, "Authentication required");
        }

        const token = authHeader.split(" ")[1];

        decoded = verifyToken(token);
    } catch (error) {
        return unauthorized(res);
    }

    // A pending 2FA token only proves the password step; it is not a session.
    if (isTwoFactorToken(decoded)) {
        return unauthorized(res);
    }

    try {
        const user = await User.findById(decoded._id);

        // Tokens issued before the last password change are rejected.
        // Tokens without tv predate this check and count as version 0.
        if (!user || (decoded.tv || 0) !== (user.tokenVersion || 0)) {
            return unauthorized(res, "Your session has ended. Please sign in again.");
        }

        req.user = {
            _id: user._id,
            role: user.role,
            username: user.username
        };

        next();
    } catch (error) {
        next(error);
    }
}
