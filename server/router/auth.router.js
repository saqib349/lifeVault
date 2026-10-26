import express from "express";
import {
    changePassword,
    confirmEnableTwoFactor,
    disableTwoFactor,
    getProfile,
    login,
    requestEnableTwoFactor,
    resendLoginCode,
    signup,
    verifyLoginCode
} from "../controller/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login",login)

/*
 * Second login step when 2FA is on.
 * Body carries the tempToken returned by /login.
 */
router.post("/2fa/verify", verifyLoginCode);
router.post("/2fa/resend", resendLoginCode);

/*
 * Profile settings (signed-in user)
 */
router.get("/me", authMiddleware, getProfile);
router.put("/password", authMiddleware, changePassword);
router.post("/2fa/enable/request", authMiddleware, requestEnableTwoFactor);
router.post("/2fa/enable/confirm", authMiddleware, confirmEnableTwoFactor);
router.post("/2fa/disable", authMiddleware, disableTwoFactor);

export default router;
