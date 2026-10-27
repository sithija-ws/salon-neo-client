import z from "zod";
const productStatus = z.enum(["ACTIVE", "DELETED", "INACTIVE"]);
const mediaTypeEnum = z.enum(["VIDEO", "IMAGE"]);

export const ProductUpdateSchema = z.object({
  sku: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  brand: z.string().trim().min(1).max(50).optional(),
  altNames: z.array(z.string().trim().min(1).max(50)).optional(),
  model: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).max(400).optional(),
  stock: z.number().min(0).optional(),
  status: productStatus.optional(),
  price: z.number().min(0).optional(),
  compareAt: z.number().min(0).optional(),
  media: z
    .array(
      z.object({
        url: z.url(),
        type: mediaTypeEnum,
      }),
    )
    .optional(),
});
