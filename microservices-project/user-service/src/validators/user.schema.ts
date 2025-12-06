import {z} from "zod";

export const UserIdSchema = z.object({
    userId: z.string(),
}).strict();

export type UserIdInput = z.infer<typeof UserIdSchema>;