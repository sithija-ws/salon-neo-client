import z from "zod";

export const UserUpdateByAdminSchema = z.object({
  firstName: z.string().max(20).optional(),
  lastName: z.string().max(20).optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  profileImage: z.string().optional(),
  id: z.never().optional(),
  createdDate: z.never().optional(),
  lastLogin: z.never().optional(),
  status: z.string().optional(),
  password: z.never().optional(),
  privilages: z.array(z.string()).optional(),
  role: z.string().optional(),
});

export type UserUpdateByAdminRequest = z.infer<typeof UserUpdateByAdminSchema>;
