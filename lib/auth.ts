import { jwtVerify, SignJWT } from 'jose';
import { JWTPayload } from './types';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'bookmarks-secret-key-dev-only');

export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as JWTPayload;
  } catch {
    return null;
  }
}
