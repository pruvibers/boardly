import { NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/demo-session";

export async function POST() {
  const response = NextResponse.redirect("http://localhost:3000/", 303);
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
