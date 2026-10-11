import prisma from "@/lib/prisma";
import { GetUser } from "@/utils/Authentication";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest) {
    try {
        const user:any = await GetUser(req);
        if(!user){
            return NextResponse.json({
                success : false,
                msg : "please login in first!"
            },{
                status: 403
            });
        }

        if(!(user.role == "ADMIN" || user.privilages.includes("user:read"))){
            return NextResponse.json({
                success: false,
                msg : "You have'nt permission for this operation!"
            },{
                status : 403
            });
        }

        //retrieve users
        const users = await prisma.user.findMany();

        console.log(user);

        return NextResponse.json({
            msg: "users retrieved successfully!",
            users
        },{status: 200});

        
    } catch (error:any) {
        console.log(error.message);
        return NextResponse.json({
            success : false,
            msg : "server error while processing!"
        },{
            status: 500
        });
    }
}