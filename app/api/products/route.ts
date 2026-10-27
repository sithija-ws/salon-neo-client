import { NextRequest, NextResponse } from "next/server";
import { GetUser, isPrivilaged } from "@/utils/Authentication";
import z, { ZodError } from "zod";
import { ProductCreateRequestSchema } from "@/types/dto/ProductCreateRequest";
import prisma from "@/lib/prisma";
import GetPaginationInfo from "@/utils/GetPaginationInfo";
import { productStatus } from "@/app/generated/prisma/enums";
import { ProductUpdateSchema } from "@/types/dto/ProductUpdateSchema";

export async function GET(req: NextRequest) {
  try {
    const user = await GetUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Please login in first" },
        { status: 401 },
      );
    }
    const isPrivilagedUser =
      (await isPrivilaged(req, "products:retrieve")) || user.role == "ADMIN";
    if (!isPrivilagedUser) {
      return NextResponse.json(
        { message: "You're not authorized to view products!" },
        { status: 403 },
      );
    }

    const { pageNumber, pageSize } = GetPaginationInfo(req);
    const productCount = await prisma.product.count();
    const pageCount = Math.ceil(productCount / pageSize);

    if (pageNumber < 1 || pageCount < pageNumber) {
      return NextResponse.json(
        { message: "Invalid page Number!" },
        { status: 400 },
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { message: "Invalid page Size!" },
        { status: 400 },
      );
    }

    const products = await prisma.product.findMany({
      skip: (pageNumber - 1) * pageSize,

      orderBy: {
        id: "desc",
      },
      take: pageSize,
      select: {
        id: true,
        sku: true,
        brand: true,
        name: true,
        altNames: true,
        model: true,
        description: true,
        stock: true,
        status: true,
        price: true,
        compareAt: true,
        media: true,
      },
    });

    return NextResponse.json({
      message: "product retrievd successfully",
      totalProducts: productCount,
      pagination: {
        pageCount: pageCount,
        pageNumber: pageNumber,
        pageSize: pageSize,
      },
      products,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error !" },
      { status: 500 },
    );
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

export async function DELETE(req: NextRequest) {
  try {
    const user = await GetUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Please sign in and continue!" },
        { status: 403 },
      );
    }

    const isPrivilagedUser =
      (await isPrivilaged(req, "products:delete")) || user.role === "ADMIN";
    if (!isPrivilagedUser) {
      return NextResponse.json(
        { message: "You're not authorized to delete products!" },
        { status: 409 },
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        {
          message: "Id of the product is required!",
        },
        {
          status: 400,
        },
      );
    }

    const IsExistingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!IsExistingProduct) {
      return NextResponse.json(
        { message: "Product Not found!" },
        { status: 400 },
      );
    }

    //update status to delete
    await prisma.product.update({
      where: { id },
      data: { status: productStatus.DELETED },
    });

    return NextResponse.json(
      { message: "Product deleted successfully!" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server Error!" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    //check is user Authorized to do the op
    const user = await GetUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Please login in and continue!" },
        { status: 401 },
      );
    }

    const isPrivilagedUser =
      (await isPrivilaged(req, "products:update")) || user.role == "ADMIN";
    if (!isPrivilagedUser) {
      return NextResponse.json(
        { message: "You're not authorized to do this operation!" },
        { status: 403 },
      );
    }

    //check is product exists
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { message: "Product id is required!" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json(
        { message: "Product is does not exists!" },
        { status: 404 },
      );
    }

    //update product
    const body = await req.json();
    const parseBody = ProductUpdateSchema.safeParse(body);

    if (!parseBody.success) {
      return NextResponse.json(
        {
          message: "Invalid product data!",
          errors: parseBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    //check is comparedAt price is greater than the actual price
    const newPrice = parseBody.data.price ?? product.price;
    const newCompareAt = parseBody.data.compareAt ?? product.compareAt;

    if (newCompareAt !== null && newCompareAt < newPrice) {
      return NextResponse.json(
        {
          message:
            "compareAt value must be greater than or equal to the price!",
        },
        { status: 400 },
      );
    }

    const normalizedAltNames =
      parseBody.data.altNames?.filter(
        (name): name is string =>
          typeof name === "string" && name.trim().length > 0,
      ) ?? product.altNames;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        sku: parseBody.data.sku,
        name: parseBody.data.name,
        brand: parseBody.data.brand,
        altNames: normalizedAltNames,
        model: parseBody.data.model,
        description: parseBody.data.description,
        stock: parseBody.data.stock,
        status: parseBody.data.status,
        price: parseBody.data.price,
        compareAt: parseBody.data.compareAt,
        media: parseBody.data.media
          ? {
              create: parseBody.data.media.map((item) => ({
                url: item.url,
                type: item.type,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(
      {
        message: "Product updated successfully",
        updatedProduct: updatedProduct,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server Error!" },
      { status: 500 },
    );
  }
}
