import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { NextResponse, type NextRequest } from "next/server";
import type { Role, UserStatus } from "@prisma/client";
import { prisma } from "./prisma";

const JWT_EXPIRES_IN = "7d";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
};

type JwtPayload = {
  userId: string;
  role: Role;
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JwtPayload) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (typeof decoded === "string" || !("userId" in decoded) || !("role" in decoded)) {
    throw new AuthError("Token invalido");
  }

  return decoded as JwtPayload;
}

function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return request.cookies.get("token")?.value;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return user;
}

export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    throw new AuthError("No autenticado");
  }

  return user;
}

export async function requireRole(request: NextRequest, roles: Role | Role[]) {
  const user = await requireAuth(request);
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError("No autorizado", 403);
  }

  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
}
