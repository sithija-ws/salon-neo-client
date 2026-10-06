import chalk from "chalk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
    const body = await req.json();

    let msg = "Good job " + body.name + "!";

    console.log(chalk.blue(msg));

    return NextResponse.json({
        success: true,
        msg : msg
    });
}