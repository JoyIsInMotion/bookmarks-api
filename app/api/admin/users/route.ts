import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/storage';
import { hashPassword } from '@/lib/encryption';
import { getAdminUser, unauthorizedResponse } from '@/lib/middleware';

type PublicUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

function serializeUser(user: { id: string; email: string; isAdmin: boolean }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  };
}

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req);

  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const db = readDatabase();
    const users = db.users
      .slice()
      .sort((a, b) => a.email.localeCompare(b.email))
      .map(serializeUser);

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);

  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { email, password, isAdmin = false } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = readDatabase();

    if (db.users.some((user) => user.email === email)) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const user = {
      id: `user-${Date.now()}`,
      email,
      password: hashPassword(password),
      isAdmin: Boolean(isAdmin),
    };

    db.users.push(user);
    writeDatabase(db);

    return NextResponse.json({ data: serializeUser(user) }, { status: 201 });
  } catch (error) {
    console.error('Admin user create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}