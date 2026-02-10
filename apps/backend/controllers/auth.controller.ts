import { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, OtpModel } from "@airmeet/models";
import { EmailService } from "../services/email.service";

export class AuthController {

    static async register(req: Request, res: Response) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ message: "Please add all fields" });
            }

            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ message: "User already exists" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = await User.create({
                name,
                email,
                password: hashedPassword,
            });

            return res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: AuthController.generateToken(user.id),
            });

        } catch (e) {
            return res.status(500).json({ message: "Registration failed" });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password required" });
            }

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const passwordMatch = await bcrypt.compare(
                password,
                user.password as string
            );

            if (!passwordMatch) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            return res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: AuthController.generateToken(user.id),
            });

        } catch (e) {
            return res.status(500).json({ message: "Login failed" });
        }
    }

    static generateToken(id: string) {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not configured");
        }

        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });
    }

    static async generateOtp(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(200).json({
                    message: "If email exists, OTP sent"
                });
            }

            const otp = Math.floor(100000 + Math.random() * 900000);

            await OtpModel.findOneAndUpdate(
                { email },
                {
                    otp,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                },
                { upsert: true, new: true }
            );
            await EmailService.sendMail(email, "OTP for Forgot Password", `Your verification code for AirMeet is ${otp}`);

            return res.status(200).json({
                message: "If email exists, OTP sent"
            });

        } catch (e: any) {
            return res.status(500).json({
                message: "Failed to generate OTP",
                error: e
            });
        }
    }

    static async verifyOtp(req: Request, res: Response) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({
                    message: "Email and otp are required"
                });
            }

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({
                    message: "Invalid email or OTP"
                });
            }

            const storedOtp = await OtpModel.findOne({
                email,
                otp: Number(otp),
            });

            if (!storedOtp || storedOtp.expiresAt < new Date()) {
                return res.status(400).json({
                    message: "Otp invalid or expired"
                });
            }

            return res.status(200).json({
                message: "Otp verified successfully"
            });

        } catch (e) {
            return res.status(500).json({
                message: "Failed to verify OTP"
            });
        }
    }

    static async changePassword(req: Request, res: Response) {
        try {
            const { email, password, otp } = req.body;

            if (!email || !password || !otp) {
                return res.status(400).json({
                    message: "Email, password and otp are required"
                });
            }

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({
                    message: "Invalid email or OTP"
                });
            }

            const storedOtp = await OtpModel.findOne({
                email,
                otp: Number(otp),
            });

            if (!storedOtp || storedOtp.expiresAt < new Date()) {
                return res.status(400).json({
                    message: "Otp invalid or expired"
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user.password = hashedPassword;
            await user.save();

            await storedOtp.deleteOne();

            return res.status(200).json({
                message: "Password changed successfully"
            });

        } catch (e) {
            return res.status(500).json({
                message: "Failed to change password"
            });
        }
    }
}
