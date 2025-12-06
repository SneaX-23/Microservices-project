import { Router } from "express";
import { getUser } from "../controllers/userController";
import { UserIdSchema } from "../validators/user.schema";
import { validate } from "../validators/validate";

const router = Router();

router.get("/:id", getUser)

export default router;