import { NextFunction, Request, Response } from "express";
import { LoginInput, SignupInput } from "../validators/auth.schema";
import bcrypt from "bcryptjs";
import { createUser, deleteToken, revokeAllUserTokens, findTokenByHash, findUser, findUserByEmailOrUsername, rotateRefreshToken, storeRefreshToken } from "../services/authService";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/auth';
import 'dotenv/config';
import { producer } from "../config/kafka";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import logger from "../utils/logger";

// auth/signp
export  const signup = catchAsync(async (
    req: Request<{}, {}, SignupInput>, res: Response, next: NextFunction
) => {
    const {username, email, password} = req.body

    const userExist = await findUser(email);

    if(userExist) return next(new AppError("User already exists", 409))

    
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(email, hashedPassword, username);

    try{
        await producer.send({
            topic: "user-created",
            messages: [{
                value: JSON.stringify({
                    type: "new_user",
                    data: {
                        email: email,
                        username: username,
                        timeStamp: new Date().toISOString(),
                    }
                })
            }]
        })
    }catch(err){
        logger.error("Failed to publish event to kafka", err);
    }

    return res.status(201).json({message: "User created successfully."})

});

// auth/login
export const login = catchAsync(async (req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) => {
    const { email, username, password } = req.body;

    const user = await findUserByEmailOrUsername(email, username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError("Invalid credentials", 401));
    }

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

    res.json({
        accessToken,
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
    });
});


// auth/refresh
export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.cookies; 
    
    if (!refreshToken) {
      return next(new AppError("Missing refresh token", 401));
    }

    const hashedToken = hashToken(refreshToken);
    const existingToken = await findTokenByHash(hashedToken);
      
    if (!existingToken) {
      return next(new AppError("Invalid token", 401));
    }

    // Reuse detection
    if (existingToken.replacedBy) {
      await revokeAllUserTokens(existingToken.userId);
      return next(new AppError("Refresh token reuse detected. Please login again.", 403));
    }

    // Check for Expiration
    if (new Date() > existingToken.expiresAt) {
      await deleteToken(existingToken.id)
      return next(new AppError("Token expired. Please login again.", 401));
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(existingToken.userId);
    const newRefreshToken = generateRefreshToken();
    const newHash = hashToken(newRefreshToken);

    await rotateRefreshToken(
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

    res.json({ accessToken: newAccessToken });
});



export const verifyTokenEndpoint = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(new AppError("No token provided", 401)); 
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as any;
    
    res.setHeader('X-User-Id', decoded.userId);
    res.status(200).end();
});