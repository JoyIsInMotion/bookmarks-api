import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/storage';
import { getAdminUser, unauthorizedResponse } from '@/lib/middleware';

const ITEMS_PER_PAGE = 20;

function findUserEmail(db: ReturnType<typeof readDatabase>, userId: string) {
  return db.users.find((user) => user.id === userId)?.email || '';
}

export async function GET(req: NextRequest) {
  const admin = await getAdminUser(req);

  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

    const db = readDatabase();
    const allBookmarks = db.bookmarks
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((bookmark) => ({
        ...bookmark,
        userEmail: findUserEmail(db, bookmark.userId),
      }));

    const total = allBookmarks.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const data = allBookmarks.slice(start, start + ITEMS_PER_PAGE);

    return NextResponse.json({
      data,
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
    console.error('Admin bookmarks list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser(req);

  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { url, description, userId } = await req.json();

    if (!url || !userId) {
      return NextResponse.json({ error: 'URL and userId are required' }, { status: 400 });
    }

    const db = readDatabase();
    const user = db.users.find((candidate) => candidate.id === userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const bookmark = {
      id: `bm-${Date.now()}`,
      userId,
      url,
      description: description || undefined,
      createdAt: new Date().toISOString(),
    };

    db.bookmarks.push(bookmark);
    writeDatabase(db);

    return NextResponse.json(
      {
        ...bookmark,
        userEmail: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin bookmark create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}