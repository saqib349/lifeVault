// Mirrors client/src/app/validators/auth-validators.ts so the API
// enforces the same rules when called directly.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9 _.]+$/;

export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

export function validateUsername(username) {
    if (typeof username !== "string" || !username.trim()) {
        return "Username is required.";
    }

    const value = username.trim();

    if (value.length < 3) return "Username must be at least 3 characters.";
    if (value.length > 30) return "Username must be 30 characters or less.";
    if (!USERNAME_PATTERN.test(value)) {
        return "Username can only contain letters, numbers, spaces, dots or underscores.";
    }

    return null;
}

export function validateEmail(email) {
    if (typeof email !== "string" || !email.trim()) {
        return "Email is required.";
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
        return "Enter a valid email address.";
    }

    return null;
}

export function validatePassword(password) {
    if (typeof password !== "string" || !password) {
        return "Password is required.";
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        return `Password must be ${PASSWORD_MAX_LENGTH} characters or less.`;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return "Password must include at least one letter and one number.";
    }

    return null;
}
