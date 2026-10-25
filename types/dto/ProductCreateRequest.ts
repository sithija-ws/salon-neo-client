import z from "zod";

const productStatusEnum = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);
const mediaTypeEnum = z.enum(["VIDEO", "IMAGE"])

export const ProductCreateRequestSchema = z.object({
  sku: z.string().max(80).min(1),
  name: z.string().max(100).min(1),
  brand: z.string().max(100).min(1).optional(),
  altNames: z.array(z.string().max(100).min(1)).optional().default([]),
  model: z.string().max(100).optional(),
  description: z.string().max(400),
  stock: z.number().min(0),
  status: productStatusEnum.optional().default("ACTIVE"),
  price: z.number().min(0),
  compareAt : z.number().min(0).optional(),
  media : z.array(
    z.object({
      url : z.url(),
      type : mediaTypeEnum
    })
  )
});
