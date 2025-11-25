import express from "express";
import os from "os";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./db/index.js";

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

const initDB = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table is ready");
  } catch (err) {
    console.error("DB Init Failed:", err);
  }
};

app.post("/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, hashedPassword]);
        res.status(201).json({ message: "User created successfully" });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ error: "User already exists" });
        }
        res.status(500).json({ error: "Internal error" });
    }
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: "Internal error" });
    }
});

app.get("/auth/verify", (req, res) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) return res.sendStatus(401);

    const token = authHeader.split(' ')[1];

    try {
        jwt.verify(token, JWT_SECRET);
        res.sendStatus(200); 
    } catch (error) {
        res.sendStatus(401);
    }
});

app.get("/", (req, res) => {
    res.json({ message: "User Service is Alive!", served_by: os.hostname() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await initDB();
    console.log(`User server listening on port ${PORT}`);
});