import prisma from "@/lib/prisma";
import { RequestUserType } from "@/types/requestUser";
import { GetUser, isPrivilaged } from "@/utils/Authentication";
import bcrypt from "bcryptjs";
import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";

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
    const body = await req.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const password = typeof body.password === "string" ? body.password : "";

    const lastName = typeof body.lastName === "string" ? body.lastName : "";

    const firstName = typeof body.firstName === "string" ? body.firstName : "";

    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber : "";

    if (!email) {
      console.log(chalk.red("email is required!"));
      return NextResponse.json(
        { message: "email is required" },
        { status: 400 },
      );
    }

    if (!password) {
      console.log(chalk.red("password is required!"));
      return NextResponse.json(
        { message: "password is required" },
        { status: 400 },
      );
    }

    if (!firstName) {
      console.log(chalk.red("first name is required!"));
      return NextResponse.json(
        { message: "first name is required!" },
        { status: 400 },
      );
    }

    if (!lastName) {
      console.log(chalk.red("last name is required!"));
      return NextResponse.json(
        { message: "email is required" },
        { status: 400 },
      );
    }

    //check is user already registered
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      console.log(chalk.red("User already Exists!"));
      return NextResponse.json(
        { message: "User already Exists" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const savedUser = await prisma.user.create({
      data: {
        email: email,
        password: passwordHash,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
      },
    });

    return NextResponse.json(
      {
        message: "User Registration successfully!",
        user: {
          email: savedUser.email,
          fullName: savedUser.firstName + " " + savedUser.lastName,
          role: savedUser.role,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.log("Server Error: ", error);
    return NextResponse.json(
      { message: "Server error while registration" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const requestUser = await GetUser(req);
    const body = await req.json();

    if (!requestUser) {
      console.log(chalk.red("please login!"));
      return NextResponse.json({ message: "please login" }, { status: 400 });
    }

    const editingUser = await prisma.user.findUnique({
      where: { id: id || "" },
    });

    if (id === requestUser?.id) {
      if (!editingUser) {
        return NextResponse.json(
          { message: "user not found want to edit" },
          { status: 400 },
        );
      }

      await prisma.user.update({
        where: {
          id: id,
        },
        data: {
          email: body.email || editingUser.email,
          firstName: body.firstName || editingUser.firstName,
          lastName: body.lastName || editingUser.lastName,
          phoneNumber: body.phoneNumber || editingUser.phoneNumber,
        },
      });

      const updatedUser = await prisma.user.findUnique({ where: { id: id } });

      if (!updatedUser) {
        return NextResponse.json(
          { message: "user not found had edited" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        message: "User updated successfully!",
        updatedUser: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          role: updatedUser.role,
          privilages: updatedUser.privilages,
        },
      });
    } else {
      const havePrivilage = await isPrivilaged(req, "user:edit");

      if (!havePrivilage) {
        return NextResponse.json(
          {
            message: "You're not allow to do this operation!",
            token: requestUser.role,
          },
          { status: 400 },
        );
      }

      const user = await prisma.user.findUnique({
        where: {
          id: id || "0000",
        },
      });

      if (!user) {
        return NextResponse.json(
          { message: "user not found want to edit" },
          { status: 404 },
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: body.email || user.email,
          firstName: body.firstName || user.firstName,
          lastName: body.lastName || user.lastName,
          phoneNumber: body.phoneNumber || user.phoneNumber,
          status: body.status || user.status,
          password: (await bcrypt.hash(body.password, 12)) || user.password,
          privilages: body.privilages || user.privilages,
          role: body.role || user.role,
          profileImage: body.profileImage || user.profileImage,
        },
      });

      return NextResponse.json(
        { message: "user updated successfully" },
        { status: 201 },
      );
    }
  } catch (error: unknown) {
    console.log(chalk.red("Server error: ", error));
    return NextResponse.json(
      { message: "Server error while processing!" },
      { status: 500 },
    );
  }
}
