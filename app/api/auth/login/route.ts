import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { use } from "react";
import chalk from "chalk";

export async function POST(req:NextRequest) {
    try {
        const body = await req.json();

        if(!body.email || !body.password){
            return NextResponse.json({
                success: false,
                msg: "Email and password required!"
            },
        {
            status: 403
        }
        );
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
            },{
                status: 403
            });
        }

        const isPasswordCorrect = await bcrypt.compare(body.password, user.password);

        if(!isPasswordCorrect){
            return NextResponse.json({
                success: false,
                msg : "Invalid email or password!"
            },{
                status: 403
            });
        }

        if(user.status != "ACTIVE"){
            return NextResponse.json({
                success: false,
                msg: "Your account is disabled! please contact Administrator!"
            }, {
                status: 401
            });
        }

        //update last login
        await prisma.user.update({
            where : {
                id : user.id
            },
            data : {
                lastLogin : new Date()
            }
        });

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
    } catch (error:any) {
        console.log(error.message);
        return NextResponse.json({
            msg: "Server error while processing!"
        },
            {
                status: 500
            }
        );
    }
    
}