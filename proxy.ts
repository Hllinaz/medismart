import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const protectedPrefixes = ["/dashboard"];

const roleRoutes = [
  {
    prefix: "/dashboard/admin",
    roles: ["ADMIN"],
  },
  {
    prefix: "/dashboard/doctor",
    roles: ["MEDICO", "ADMIN"],
  },
  {
    prefix: "/dashboard/patient",
    roles: ["PACIENTE"],
  },
];

export function proxy(request: NextRequest) {
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  const matchedRoute = roleRoutes.find((route) =>
    request.nextUrl.pathname.startsWith(route.prefix),
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "");

    if (
      typeof decoded === "string" ||
      !("role" in decoded) ||
      !matchedRoute.roles.includes(String(decoded.role))
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};