
import jwt from "jsonwebtoken";

const secretKey = process.env.SECRETE_KEY;

if (!secretKey) {
    throw new Error("SECRETE_KEY is not defined");
}

export function generateToken(payload) {
    return jwt.sign(payload, secretKey, {
        expiresIn: "7d",
    });
}

export function verifyToken(token) {
    return jwt.verify(token, secretKey);
}