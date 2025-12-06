import { Request, Response } from "express";
import { UserIdInput } from "../validators/user.schema";
import { GetUser } from "../services/userService";

export const getUser = async (
    req: Request<{id: string}, {}, {}>, res: Response
) => {
    const userId = req.params.id;

    if (userId === 'null' || userId === 'undefined') {
        return res.status(400).json({ message: "Invalid User ID format" });
    }

    try {
        const user = await GetUser(userId);
        if(!user) return res.status(400).json({message: "User Not found"});

        return res.json({user: user});

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({messge: "Internal error!"})
    }    
}