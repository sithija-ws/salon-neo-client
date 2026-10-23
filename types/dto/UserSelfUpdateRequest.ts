import z from "zod";

export const UserSelfUpdateSchema = z.object({
  firstName: z.string().max(20).optional(),
  lastName: z.string().max(20).optional(),
  phoneNumber: z.string(),
  email: z.string(),
  profileImage: z.string().optional(),
  id: z.never().optional(),
  createdDate: z.never().optional(),
  lastLogin: z.never().optional(),
  status: z.never().optional(),
  password: z.never().optional(),
  privilages: z.never().optional(),
  role: z.never().optional(),
});

export type UserSelfUpdateRequest = z.infer<typeof UserSelfUpdateSchema>;
