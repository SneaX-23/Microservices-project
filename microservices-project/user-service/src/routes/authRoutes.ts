import { Router, Request, Response, NextFunction } from "express";
import { SignupSchema, LoginSchema } from "../validators/auth.schema";
import { validate } from "../validators/validate";
import { signup, login, refreshToken, verifyTokenEndpoint } from "../controllers/authController";

const router = Router();


router.get("/verify", verifyTokenEndpoint)
router.post("/signup", validate(SignupSchema),signup)
router.post("/login", validate(LoginSchema), login)
router.post("/refresh", refreshToken)

export default router;