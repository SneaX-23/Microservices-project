import { z } from "zod";

export const SignupSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
}).strict();

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
    password: z.string(),
    email: z.string().email().optional(),
    username: z.string().optional(),
})
.strict()
.refine((data) => data.email || data.username, {
    message: "You must provide either an email or a username to login",
    path: ["email"], 
});

export type LoginInput = z.infer<typeof LoginSchema>;