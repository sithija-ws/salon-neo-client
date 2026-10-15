import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import prisma from "@/lib/prisma";

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


export async function isPrivilaged(req: NextRequest, privilage : String){
    try {
        const user:any = await GetUser(req);
        if(!user){
            return NextResponse.json({
                msg : "Please login first"
            },
            {
                status : 401
            }
        )}

        const hasPrivilage = await user.privilages.includes(privilage);
        if(hasPrivilage){
            return true;
        }

        return false;

    } catch (error) {
        return NextResponse.json(
        {
            msg : "Server error while processing"
        },
        {
            status: 500
        }
    );
    }
}