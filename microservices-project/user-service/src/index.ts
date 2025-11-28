import express from "express";
import os from "os";
import authRoutes from "./routes/authRoutes"
import 'dotenv/config'
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes)

app.get("/", (req, res) => {
    res.json({ message: "User Service is Alive!", served_by: os.hostname() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`User server listening on port ${PORT}`);
});

