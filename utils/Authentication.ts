import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export async function GetUser(req:NextRequest){
    try {
        const loginToken = req.cookies.get("login-token")?.value;
        if(!loginToken){
            return null;
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);

        const {payload} = await jose.jwtVerify(loginToken, secret);
        return payload;
    } catch (error:any) {
        console.log(error.message);
        return NextResponse.json({
            success: false,
            msg: "Server error while processing!"
        });
    }
}