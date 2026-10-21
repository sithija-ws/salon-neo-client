import { z } from "zod";

const UserRegistrationRequestSchema = z.object({
  email: z.email(),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional(),
});

export type UserRegistrationRequest = z.infer<
  typeof UserRegistrationRequestSchema
>;

export { UserRegistrationRequestSchema };
