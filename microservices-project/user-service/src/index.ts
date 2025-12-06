import express, { Request, Response, NextFunction } from "express";
import os from "os";
import 'dotenv/config'
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import { globalErrorHandler } from "./controllers/errorController";
import { AppError } from "./utils/appError";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.json({ message: "User Service is Alive!", served_by: os.hostname() });
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`User server listening on port ${PORT}`);
});