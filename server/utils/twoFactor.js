import crypto from "node:crypto";

export const CODE_TTL_MINUTES = 10;
export const MAX_CODE_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;

export function generateCode() {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(code) {
    return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function codesMatch(code, hash) {
    const a = Buffer.from(hashCode(code), "hex");
    const b = Buffer.from(hash || "", "hex");

    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Stores a fresh code on the user (caller saves the document).
export function setCode(user, purpose) {
    const code = generateCode();
    const now = new Date();

    user.twoFactorCode = {
        hash: hashCode(code),
        purpose,
        expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000),
        attempts: 0,
        sentAt: now
    };

    return code;
}

export function clearCode(user) {
    user.twoFactorCode = undefined;
}

// Seconds until another code may be sent, or 0.
export function resendWaitSeconds(user) {
    const sentAt = user.twoFactorCode?.sentAt;
    if (!sentAt) return 0;

    const elapsed = (Date.now() - new Date(sentAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
}

/*
 * Checks a submitted code. Returns null when valid, otherwise an
 * error message. Counts failed attempts (caller saves the document).
 */
export function checkCode(user, code, purpose) {
    const stored = user.twoFactorCode;

    if (!stored?.hash || stored.purpose !== purpose) {
        return "No verification code was requested. Please request a new code.";
    }

    if (new Date(stored.expiresAt).getTime() < Date.now()) {
        clearCode(user);
        return "This code has expired. Please request a new code.";
    }

    if ((stored.attempts || 0) >= MAX_CODE_ATTEMPTS) {
        clearCode(user);
        return "Too many wrong attempts. Please request a new code.";
    }

    if (typeof code !== "string" || !/^\d{6}$/.test(code.trim()) || !codesMatch(code.trim(), stored.hash)) {
        stored.attempts = (stored.attempts || 0) + 1;
        return "The code is incorrect.";
    }

    clearCode(user);
    return null;
}

// "saqib@example.com" -> "sa***@example.com"
export function maskEmail(email) {
    const [name, domain] = String(email).split("@");
    if (!domain) return email;

    return `${name.slice(0, 2)}***@${domain}`;
}
