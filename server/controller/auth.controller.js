import User from "../models/User.js";
import { hashingPassword, verifyPassword } from "../utils/hashing.js";
import {
    generateTwoFactorToken,
    generateUserToken,
    verifyTwoFactorToken
} from "../utils/tokens.js";
import {
    validateEmail,
    validatePassword,
    validateUsername
} from "../utils/validation.js";
import {
    checkCode,
    maskEmail,
    resendWaitSeconds,
    setCode
} from "../utils/twoFactor.js";
import {
    sendSecurityAlert,
    sendTwoFactorCode
} from "../services/email.service.js";

function fail(res, status, message) {
    return res.status(status).json({
        success: false,
        message
    });
}

function sessionResponse(res, user, message) {
    return res.status(200).json({
        message,
        data: {
            _id: user._id,
            username: user.username,
            role: user.role
        },
        token: generateUserToken(user)
    });
}

// Security alerts are best-effort: a mail failure must not undo the change.
async function trySendAlert(user, message) {
    try {
        await sendSecurityAlert(user.email, user.username, message);
    } catch (error) {
        console.error("Failed to send security alert:", error.message);
    }
}

// Saves a new code on the user and emails it.
async function issueCode(user, purpose) {
    const code = setCode(user, purpose);
    await user.save();
    await sendTwoFactorCode(user.email, user.username, code, purpose);
}

export async function signup(req, res, next) {
    try {
        const { username, email, password } = req.body;

        const validationError =
            validateUsername(username) ||
            validateEmail(email) ||
            validatePassword(password);

        if (validationError) {
            return fail(res, 400, validationError);
        }

        const hashedPassword = await hashingPassword(password);

        await User.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User registered successfully"
        });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            error.statusCode = 409;
            error.message = "Email already exists";
        }

        return next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
            return fail(res, 400, "Email and password are required.");
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() })
            .select("+password +twoFactorCode");

        if (!user || !(await verifyPassword(password, user.password))) {
            return fail(res, 401, "Invalid email or password");
        }

        if (!user.twoFactorEnabled) {
            return sessionResponse(res, user, "sucessfully login");
        }

        try {
            await issueCode(user, "login");
        } catch (error) {
            console.error("Failed to send 2FA code:", error.message);
            return fail(res, 503, "Could not send your verification code. Please try again.");
        }

        return res.status(200).json({
            message: "Verification code sent",
            twoFactorRequired: true,
            tempToken: generateTwoFactorToken(user),
            email: maskEmail(user.email)
        });
    } catch (err) {
        next(err);
    }
}

// Loads the user behind a pending-2FA token, or sends 401.
async function userFromTempToken(req, res) {
    try {
        const decoded = verifyTwoFactorToken(req.body?.tempToken);
        const user = await User.findById(decoded._id).select("+twoFactorCode");

        if (!user || !user.twoFactorEnabled) {
            fail(res, 401, "Your sign-in session has expired. Please sign in again.");
            return null;
        }

        return user;
    } catch {
        fail(res, 401, "Your sign-in session has expired. Please sign in again.");
        return null;
    }
}

export async function verifyLoginCode(req, res, next) {
    try {
        const user = await userFromTempToken(req, res);
        if (!user) return;

        const codeError = checkCode(user, req.body.code, "login");
        await user.save();

        if (codeError) {
            return fail(res, 400, codeError);
        }

        return sessionResponse(res, user, "sucessfully login");
    } catch (error) {
        next(error);
    }
}

export async function resendLoginCode(req, res, next) {
    try {
        const user = await userFromTempToken(req, res);
        if (!user) return;

        const wait = resendWaitSeconds(user);
        if (wait > 0) {
            return fail(res, 429, `Please wait ${wait} seconds before requesting a new code.`);
        }

        try {
            await issueCode(user, "login");
        } catch (error) {
            console.error("Failed to send 2FA code:", error.message);
            return fail(res, 503, "Could not send your verification code. Please try again.");
        }

        return res.status(200).json({
            success: true,
            message: "A new code has been sent."
        });
    } catch (error) {
        next(error);
    }
}

export async function getProfile(req, res, next) {
    try {
        const user = await User.findById(req.user._id);

        return res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (typeof currentPassword !== "string" || !currentPassword) {
            return fail(res, 400, "Current password is required.");
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return fail(res, 400, passwordError);
        }

        const user = await User.findById(req.user._id).select("+password");

        if (!(await verifyPassword(currentPassword, user.password))) {
            return fail(res, 400, "Current password is incorrect.");
        }

        if (await verifyPassword(newPassword, user.password)) {
            return fail(res, 400, "New password must be different from the current password.");
        }

        user.password = await hashingPassword(newPassword);
        // Invalidates every token issued before now (other devices).
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        await trySendAlert(user, "Your LifeVault password was changed. Other devices have been signed out.");

        return res.status(200).json({
            success: true,
            message: "Password changed. Other devices have been signed out.",
            token: generateUserToken(user)
        });
    } catch (error) {
        next(error);
    }
}

export async function requestEnableTwoFactor(req, res, next) {
    try {
        const user = await User.findById(req.user._id).select("+twoFactorCode");

        if (user.twoFactorEnabled) {
            return fail(res, 400, "Two-factor authentication is already on.");
        }

        const wait = resendWaitSeconds(user);
        if (wait > 0) {
            return fail(res, 429, `Please wait ${wait} seconds before requesting a new code.`);
        }

        try {
            await issueCode(user, "enable");
        } catch (error) {
            console.error("Failed to send 2FA code:", error.message);
            return fail(res, 503, "Could not send your verification code. Please try again.");
        }

        return res.status(200).json({
            success: true,
            message: `A code has been sent to ${maskEmail(user.email)}.`
        });
    } catch (error) {
        next(error);
    }
}

export async function confirmEnableTwoFactor(req, res, next) {
    try {
        const user = await User.findById(req.user._id).select("+twoFactorCode");

        if (user.twoFactorEnabled) {
            return fail(res, 400, "Two-factor authentication is already on.");
        }

        const codeError = checkCode(user, req.body.code, "enable");

        if (!codeError) {
            user.twoFactorEnabled = true;
        }

        await user.save();

        if (codeError) {
            return fail(res, 400, codeError);
        }

        await trySendAlert(user, "Two-factor authentication was turned on for your LifeVault account.");

        return res.status(200).json({
            success: true,
            message: "Two-factor authentication is now on."
        });
    } catch (error) {
        next(error);
    }
}

export async function disableTwoFactor(req, res, next) {
    try {
        const { password } = req.body;

        if (typeof password !== "string" || !password) {
            return fail(res, 400, "Password is required.");
        }

        const user = await User.findById(req.user._id).select("+password +twoFactorCode");

        if (!user.twoFactorEnabled) {
            return fail(res, 400, "Two-factor authentication is already off.");
        }

        if (!(await verifyPassword(password, user.password))) {
            return fail(res, 400, "Password is incorrect.");
        }

        user.twoFactorEnabled = false;
        user.twoFactorCode = undefined;
        await user.save();

        await trySendAlert(user, "Two-factor authentication was turned off for your LifeVault account.");

        return res.status(200).json({
            success: true,
            message: "Two-factor authentication is now off."
        });
    } catch (error) {
        next(error);
    }
}
