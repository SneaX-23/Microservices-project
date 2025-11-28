import { Request, Response } from "express";
import { LoginInput, SignupInput } from "../validators/auth.schema";
import bcrypt from "bcryptjs";
import { createUser, deleteToken, revokeAllUserTokens, findTokenByHash, findUser, findUserByEmailOrUsername, rotateRefreshToken, storeRefreshToken } from "../services/authService";
import { v4 as uuidv4 } from 'uuid';
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/auth';
import 'dotenv/config';


// auth/signp
export  const signup = async (
    req: Request<{}, {}, SignupInput>, res: Response
) => {
    const {username, email, password} = req.body

    const userExist = await findUser(email);

    if(userExist) return res.status(409).json({error: "User already exists"});

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(email, hashedPassword, username);
        res.status(201).json({message: "User created successfull."})

    } catch (error: any) {
        console.error(error)
        res.status(500).json({error: "Internal error!"})
    }
}

// auth/login
export const login = async (req: Request<{}, {}, LoginInput>, res: Response)=> {
    const { email, username, password } = req.body;

    try {
        const user = await findUserByEmailOrUsername(email, username);

        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if(!isValid) return res.status(400).json({ error: "Invalid credentials" });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken();
        const hashedToken = hashToken(refreshToken);

        await storeRefreshToken(user.id, hashedToken);

        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,      
            secure: isProduction, 
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, 
            path: '/'
        });

        return res.json({
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
    
}

// auth/refresh
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies; 
    
    if (!refreshToken) {
      return res.status(401).json({ error: "Missing refresh token" });
    }

    const hashedToken = hashToken(refreshToken);

    const existingToken = await findTokenByHash(hashedToken);
      

    if (!existingToken) {
      return res.status(401).json({ error: "Invalid token" });
    }
    // Reuse detection
    if (existingToken.replacedBy) {
      console.log("Reuse detected! Revoking all tokens for user.");
      
      await revokeAllUserTokens(existingToken.userId);

      return res.status(403).json({ error: "Refresh token reuse detected. Please login again." });
    }

    // Check for Expiration
    if (new Date() > existingToken.expiresAt) {
      // Clean up the expired token
      await deleteToken(existingToken.id)
      return res.status(401).json({ error: "Token expired. Please login again." });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(existingToken.userId);
    const newRefreshToken = generateRefreshToken();
    const newHash = hashToken(newRefreshToken);

    // Database Transaction: Create NEW token + Invalidate OLD token
    const newTokenRecord = await rotateRefreshToken(
        existingToken.userId, 
        existingToken.id, 
        newHash
    );

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({ accessToken: newAccessToken });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



export const verifyTokenEndpoint = async (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).end(); 
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as any;
        
        // Set the header for Nginx to pick up
        res.setHeader('X-User-Id', decoded.userId);
        return res.status(200).end();

    } catch (error) {
        // Return 401 on expiration or invalid signature
        return res.status(401).end();
    }
}