import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { GetUser } from "@/utils/Authentication";

export async function GET(req:NextRequest) {
    try {
        const user = await GetUser(req);
        if(!user){
            return NextResponse.json({
                success: false,
                msg: "Unauthorized!"
            });
        }

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