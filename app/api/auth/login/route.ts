import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export async function POST(req:NextRequest) {
    const body = await req.json();

    if(!body.email || !body.password){
        return NextResponse.json({
            success: false,
            msg: "Email and password required!"
        });
    }

    const user = await prisma.user.findFirst({
        where : {
            email : body.email
        }
    });

    if(!user){
        return NextResponse.json({
            success: false,
            msg: "User not found!"
        });
    }

    const isPasswordCorrect = await bcrypt.compare(body.password, user.password);

    if(!isPasswordCorrect){
        return NextResponse.json({
            success: false,
            msg : "Invalid email or password!"
        });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const token = await new jose.SignJWT({
        email : user.email,
        firstName: user.firstName,
        lastName : user.lastName,
        role: user.role,
        privilages : user.privilages
    }).setProtectedHeader({alg: "HS256"}).sign(secret); 

    let msg = "login successfully";

    console.log(token);
    const response = NextResponse.json({
        message : "Login successfully",
        role: user.role
    });

    response.cookies.set({
        name: "login-token",
        value: token,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60*60*24*7
    })

    return response;
}