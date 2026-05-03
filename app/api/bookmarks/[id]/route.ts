import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/storage';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const db = readDatabase();
    const bookmark = db.bookmarks.find((bm) => bm.id === id);

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    if (bookmark.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Get bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const { url, description } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const bookmarkIndex = db.bookmarks.findIndex((bm) => bm.id === id);

    if (bookmarkIndex === -1) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    if (db.bookmarks[bookmarkIndex].userId !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    db.bookmarks[bookmarkIndex].url = url;
    db.bookmarks[bookmarkIndex].description = description || undefined;

    writeDatabase(db);

    return NextResponse.json(db.bookmarks[bookmarkIndex]);
  } catch (error) {
    console.error('Update bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const db = readDatabase();
    const bookmarkIndex = db.bookmarks.findIndex((bm) => bm.id === id);

    if (bookmarkIndex === -1) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    if (db.bookmarks[bookmarkIndex].userId !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const deleted = db.bookmarks.splice(bookmarkIndex, 1)[0];
    writeDatabase(db);

    return NextResponse.json(deleted);
  } catch (error) {
    console.error('Delete bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
