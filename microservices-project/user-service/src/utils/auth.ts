import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import 'dotenv/config';

export const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: '15m', 
    });
};


export const generateRefreshToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

export const hashToken = (token: string) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};