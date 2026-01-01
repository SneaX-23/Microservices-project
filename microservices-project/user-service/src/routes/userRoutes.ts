import { Router } from "express";
import { getUserEamil } from "../controllers/userController";
import { UserIdSchema } from "../validators/user.schema";
import { validate } from "../validators/validate";

const router = Router();

router.get("/:id", getUserEamil)

export default router;