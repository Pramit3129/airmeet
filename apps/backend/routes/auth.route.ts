import express from "express";
import { AuthController } from "../controllers/auth.controller.ts";

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/generate-otp", AuthController.generateOtp);
router.post("/veritfy-otp", AuthController.verifyOtp);
router.post("/change-password", AuthController.changePassword);
export default router;
