import { Resend } from "resend";
import dotenv from "dotenv";
import "dotenv/config"
dotenv.config();

export const resend = new Resend(process.env.RESEND_API_KEY);