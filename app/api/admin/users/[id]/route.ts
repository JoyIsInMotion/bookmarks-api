import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/storage';
import { hashPassword } from '@/lib/encryption';
import { getAdminUser, unauthorizedResponse } from '@/lib/middleware';

function serializeUser(user: { id: string; email: string; isAdmin: boolean }) {
  return {
    id: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(req);

  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const db = readDatabase();
    const user = db.users.find((item) => item.id === id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: serializeUser(user) });
  } catch (error) {
    console.error('Admin user get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(req);

  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const { email, password, isAdmin } = await req.json();

    const db = readDatabase();
    const userIndex = db.users.findIndex((item) => item.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = db.users[userIndex];
    const nextEmail = email || currentUser.email;

    if (nextEmail !== currentUser.email && db.users.some((item) => item.email === nextEmail)) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    currentUser.email = nextEmail;
    if (typeof password === 'string' && password.length > 0) {
      currentUser.password = hashPassword(password);
    }
    if (typeof isAdmin === 'boolean') {
      currentUser.isAdmin = isAdmin;
    }

    writeDatabase(db);

    return NextResponse.json({ data: serializeUser(currentUser) });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(req);

  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const db = readDatabase();
    const userIndex = db.users.findIndex((item) => item.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deleted = db.users.splice(userIndex, 1)[0];
    db.bookmarks = db.bookmarks.filter((bookmark) => bookmark.userId !== deleted.id);
    writeDatabase(db);

    return NextResponse.json({ data: serializeUser(deleted) });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}