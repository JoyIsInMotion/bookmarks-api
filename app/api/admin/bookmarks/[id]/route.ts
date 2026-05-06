import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/storage';
import { getAdminUser, unauthorizedResponse } from '@/lib/middleware';
import type { Bookmark } from '@/lib/types';

function serializeBookmark(db: ReturnType<typeof readDatabase>, bookmark: Bookmark) {
  return {
    ...bookmark,
    userEmail: db.users.find((user) => user.id === bookmark.userId)?.email || '',
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
    const bookmark = db.bookmarks.find((item) => item.id === id);

    if (!bookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    return NextResponse.json(serializeBookmark(db, bookmark));
  } catch (error) {
    console.error('Admin bookmark get error:', error);
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
    const { url, description, userId } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const db = readDatabase();
    const bookmarkIndex = db.bookmarks.findIndex((item) => item.id === id);

    if (bookmarkIndex === -1) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    const nextUserId = userId || db.bookmarks[bookmarkIndex].userId;
    const nextUser = db.users.find((candidate) => candidate.id === nextUserId);

    if (!nextUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    db.bookmarks[bookmarkIndex].url = url;
    db.bookmarks[bookmarkIndex].description = description || undefined;
    db.bookmarks[bookmarkIndex].userId = nextUserId;

    writeDatabase(db);

    return NextResponse.json(serializeBookmark(db, db.bookmarks[bookmarkIndex]));
  } catch (error) {
    console.error('Admin bookmark update error:', error);
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
    const bookmarkIndex = db.bookmarks.findIndex((item) => item.id === id);

    if (bookmarkIndex === -1) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 });
    }

    const deleted = db.bookmarks.splice(bookmarkIndex, 1)[0];
    writeDatabase(db);

    return NextResponse.json(serializeBookmark(db, deleted));
  } catch (error) {
    console.error('Admin bookmark delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}