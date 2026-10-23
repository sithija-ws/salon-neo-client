import prisma from "@/lib/prisma";
import { UserRegistrationRequestSchema } from "@/types/dto/UserRegistrationRequest";
import { UserSelfUpdateSchema } from "@/types/dto/UserSelfUpdateRequest";
import { UserUpdateByAdminSchema } from "@/types/dto/UserUpdateByAdmin";
import { RequestUserType } from "@/types/requestUser";
import { GetUser, isPrivilaged } from "@/utils/Authentication";
import bcrypt from "bcryptjs";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    //"user:read",
    const user: RequestUserType | null = await GetUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized user!" },
        { status: 401 },
      );
    }

    if (!(await isPrivilaged(req, "user:read")) || user.role != "ADMIN") {
      return NextResponse.json({ message: "Unauthorized!" }, { status: 401 });
    }

    const pageNumberInString =
      req.nextUrl.searchParams.get("pageNumber") || "1";
    const pageSizeInString = req.nextUrl.searchParams.get("pageSize") || "10";

    const pageNumber = parseInt(pageNumberInString);
    const pageSize = parseInt(pageSizeInString);

    const userCount = await prisma.user.count();
    const pageCount = Math.ceil(userCount / pageSize);

    if (pageCount < pageNumber) {
      return NextResponse.json(
        { message: "Invalid page number!" },
        { status: 400 },
      );
    }

    //retrieve users
    const users = await prisma.user.findMany({
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdDate: false,
        lastLogin: false,
        status: true,
        phoneNumber: false,
        password: false,
      },
    });

    return NextResponse.json(
      {
        msg: "users retrieved successfully!",
        pagination: {
          pageNumber: pageNumber,
          pageSize: pageSize,
          userCount: userCount,
          pageCount: pageCount,
        },
        users,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.log(error.message);
    return NextResponse.json(
      {
        success: false,
        msg: "server error while processing!",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();

    const parseBody = UserRegistrationRequestSchema.safeParse(body);

    if (!parseBody.success) {
      return NextResponse.json(
        {
          Message: "Invalid registration data",
          errors: parseBody.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const { email, password, firstName, lastName, phoneNumber } =
      parseBody.data;

    //check is user already registered
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      console.log(chalk.red("User already Exists!"));
      return NextResponse.json(
        { message: "User already Exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const savedUser = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        phoneNumber: phoneNumber ?? "",
      },
    });

    return NextResponse.json(
      {
        message: "User Registration successfully!",
        user: {
          email: savedUser.email,
          fullName: `${savedUser.firstName} ${savedUser.lastName}`,
          role: savedUser.role,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.log("Registration Error: ", error);
    return NextResponse.json(
      { message: "Server error while registering user!" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "User ID is required!" },
        { status: 400 },
      );
    }

    //Auth
    const requestUser = await GetUser(req);
    if (!requestUser) {
      return NextResponse.json({ message: "please login" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }

    const body = await req.json();
    let updatedUser;

    //permission check

    const isEditingOwnAccount = requestUser.id === id;

    if (!isEditingOwnAccount) {
      const havePrivilage = await isPrivilaged(req, "user:edit");

      if (!havePrivilage) {
        return NextResponse.json(
          { message: "You're not allowed to do this work!" },
          { status: 403 },
        );
      }

      const parseBody = UserUpdateByAdminSchema.parse(body);
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          email: parseBody.email ?? user.email,
          firstName: parseBody.firstName ?? user.firstName,
          lastName: parseBody.lastName ?? user.lastName,
          phoneNumber: parseBody.phoneNumber ?? user.phoneNumber,
          profileImage: parseBody.profileImage ?? user.profileImage,
          status: parseBody.status ?? user.status,
          privilages: parseBody.privilages ?? user.privilages,
          role: parseBody.role ?? user.role,
        },
      });
    } else {
      const parseBody = UserSelfUpdateSchema.parse(body);
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          email: parseBody.email ?? user.email,
          firstName: parseBody.firstName ?? user.firstName,
          lastName: parseBody.lastName ?? user.lastName,
          phoneNumber: parseBody.phoneNumber ?? user.phoneNumber,
          profileImage: parseBody.profileImage ?? user.profileImage,
        },
      });
    }

    return NextResponse.json(
      {
        message: "User updated successfully!",
        updatedUser: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          role: updatedUser.role,
          privilages: updatedUser.privilages,
          profileImage: updatedUser.profileImage,
          status: updatedUser.status,
        },
      },
      { status: 200 },
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
      console.log(chalk.red("Server error: ", error));
      return NextResponse.json(
        { message: "Server error while processing!" },
        { status: 500 },
      );
    }
  }
}
