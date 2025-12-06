import express from "express";
import os from "os";
import 'dotenv/config'
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.json({ message: "User Service is Alive!", served_by: os.hostname() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`User server listening on port ${PORT}`);
});

