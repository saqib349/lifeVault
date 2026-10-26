
import jwt from "jsonwebtoken";

const secretKey = process.env.SECRETE_KEY;

if (!secretKey) {
    throw new Error("SECRETE_KEY is not defined");
}

const TWO_FACTOR_PURPOSE = "2fa-pending";

export function generateToken(payload) {
    return jwt.sign(payload, secretKey, {
        expiresIn: "7d",
    });
}

// Full session token for a user document.
// tv (token version) lets a password change invalidate older tokens.
export function generateUserToken(user) {
    return generateToken({
        _id: user._id,
        role: user.role,
        username: user.username,
        tv: user.tokenVersion || 0
    });
}

// Short-lived token proving the password step of a 2FA login passed.
// It can only be used on the 2FA verify/resend endpoints.
export function generateTwoFactorToken(user) {
    return jwt.sign(
        { _id: user._id, purpose: TWO_FACTOR_PURPOSE },
        secretKey,
        { expiresIn: "10m" }
    );
}

export function verifyToken(token) {
    return jwt.verify(token, secretKey);
}

export function verifyTwoFactorToken(token) {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.purpose !== TWO_FACTOR_PURPOSE) {
        throw new Error("Invalid verification token");
    }

    return decoded;
}

export function isTwoFactorToken(decoded) {
    return decoded?.purpose === TWO_FACTOR_PURPOSE;
}
