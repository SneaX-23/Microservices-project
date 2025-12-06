import { Request, Response, NextFunction } from "express";
import { GetUser } from "../services/userService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";

export const getUser = catchAsync(async (req: Request<{id: string}>, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    if (userId === 'null' || userId === 'undefined') {
        return next(new AppError("Invalid User ID format", 400));
    }

    const user = await GetUser(userId);
    
    if(!user) {
        return next(new AppError("User Not found", 404));
    }

    res.json({user: user});
});