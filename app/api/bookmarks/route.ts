import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/storage';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware';

const ITEMS_PER_PAGE = 5;

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

    const db = readDatabase();
    const userBookmarks = db.bookmarks
      .filter((bm) => bm.userId === user.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = userBookmarks.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const items = userBookmarks.slice(start, start + ITEMS_PER_PAGE);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        pageSize: ITEMS_PER_PAGE,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse();
    }

    const { url, description } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const bookmark = {
      id: `bm-${Date.now()}`,
      userId: user.userId,
      url,
      description: description || undefined,
      createdAt: new Date().toISOString(),
    };

    db.bookmarks.push(bookmark);
    writeDatabase(db);

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error('Create bookmark error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
