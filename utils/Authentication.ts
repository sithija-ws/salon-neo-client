import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { RequestUserType } from "@/types/requestUser";

export async function GetUser(
  req: NextRequest,
): Promise<RequestUserType | null> {
  try {
    const loginToken = req.cookies.get("login-token")?.value;
    if (!loginToken) {
      return null;
    }

    const jwt_secret = process.env.JWT_SECRET;
    if (!jwt_secret) {
      throw new Error("JWT SECTRET is not configured!");
    }

    const secret = new TextEncoder().encode(jwt_secret);

    const { payload } = await jose.jwtVerify(loginToken, secret);

    if (
      typeof payload.email !== "string" ||
      typeof payload.firstName !== "string" ||
      typeof payload.lastName !== "string" ||
      typeof payload.role !== "string" ||
      !Array.isArray(payload.privilages) ||
      !payload.privilages.every((privilage) => typeof privilage !== "string")
    ) {
      return null;
    }

    return {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      privilages: payload.privilages,
    };
  } catch (error: unknown) {
    console.log("Get User Error: ", error);
    return null;
  }
}

export async function isPrivilaged(req: NextRequest, privilage: String) {
  try {
    const user: any = await GetUser(req);
    if (!user) {
      return NextResponse.json(
        {
          msg: "Please login first",
        },
        {
          status: 401,
        },
      );
    }

    const hasPrivilage = await user.privilages.includes(privilage);
    if (hasPrivilage) {
      return true;
    }

    return false;
  } catch (error) {
    return NextResponse.json(
      {
        msg: "Server error while processing",
      },
      {
        status: 500,
      },
    );
  }
}
