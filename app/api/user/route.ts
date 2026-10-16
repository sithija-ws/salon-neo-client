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

    //retrieve users
    const users = await prisma.user.findMany();

    return NextResponse.json(
      {
        msg: "users retrieved successfully!",
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


