import { NextRequest, NextResponse } from "next/server";
import { GetUser, isPrivilaged } from "@/utils/Authentication";
import z, { ZodError } from "zod";
import { ProductCreateRequestSchema } from "@/types/dto/ProductCreateRequest";
import { parse } from "path";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await GetUser(req);
    if (!user) {
      return NextResponse.json({
        success: false,
        msg: "Unauthorized!",
      });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      msg: "Server Error While Processing!",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isPrivilagedUser = await isPrivilaged(req, "products:add");

    if (!isPrivilagedUser) {
      return NextResponse.json(
        { message: "You haven't access to add products!" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parseBody = ProductCreateRequestSchema.safeParse(body);

    if (!parseBody.success) {
      return NextResponse.json(
        {
          Message: "Invalid Input data!",
          errors: parseBody.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const {
      sku,
      name,
      brand,
      altNames,
      model,
      description,
      stock,
      status,
      price,
      compareAt,
      media,
    } = parseBody.data;

    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return NextResponse.json(
        { message: "Product is already exists!" },
        { status: 409 },
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        sku,
        name,
        brand,
        altNames,
        model: model ?? "",
        description,
        stock,
        status,
        price,
        compareAt,
        media: media
          ? {
              create: media.map((item) => ({
                url: item.url,
                type: item.type,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(
      { success: true, product: newProduct },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: error.issues[0]?.message ?? "Invalid Input!",
        },
        {
          status: 400,
        },
      );
    } else {
      return NextResponse.json(
      { message: "Server error while creating product!" },
      { status: 500 },
    );
    }
    
  }
}
