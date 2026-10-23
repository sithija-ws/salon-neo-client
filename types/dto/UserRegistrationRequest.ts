import { z } from "zod";

const UserRegistrationRequestSchema = z.object({
  email: z.email(),
  password: z.string(),
  firstName: z.string().max(20),
  lastName: z.string().max(20),
  phoneNumber: z.string().optional(),
  privilages: z.never().optional(),
  role: z.never().optional(),
  lastLogin: z.never().optional(),
  status: z.never().optional(),
  createdDate: z.never().optional(),
  id: z.never().optional(),
});

export type UserRegistrationRequest = z.infer<
  typeof UserRegistrationRequestSchema
>;

export { UserRegistrationRequestSchema };
