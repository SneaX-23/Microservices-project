import express, { Request, Response, NextFunction } from "express";
import os from "os";
import 'dotenv/config'
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import { globalErrorHandler } from "./controllers/errorController";
import { AppError } from "./utils/appError";
import { requestLogger } from "./middleware/requestLogger";

const app = express();
app.use(express.json());
app.use(cookieParser());

// http logger
app.use(requestLogger);

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/users", userRoutes);

// health check
app.get("/", (req, res) => {
    res.json({ message: "User Service is Alive!", served_by: os.hostname() });
});

// 404 error
app.all("*", (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`User server listening on port ${PORT}`);
});