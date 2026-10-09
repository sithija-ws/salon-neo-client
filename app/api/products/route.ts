import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export async function GET(req:NextRequest) {
    try {
        const loginToken:any = req.cookies.get("login-token")?.value;

        const secret = await new TextEncoder().encode(process.env.JWT_SECRET);

        const user = await jose.jwtVerify(loginToken,secret);

        return NextResponse.json({
            success: true,
            user
        });
    } catch (error:any) {
        return NextResponse.json({
            success: false,
            msg : "Server Error While Processing!"
        });
    }
}