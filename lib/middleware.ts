import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import type { JWTPayload } from '@/lib/types';

export async function getAuthenticatedUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    return payload;
  } catch {
    return null;
  }
}

export async function getAdminUser(req: NextRequest) {
  const user = (await getAuthenticatedUser(req)) as JWTPayload | null;

  if (!user || !user.isAdmin) {
    return null;
  }

  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  );
}
