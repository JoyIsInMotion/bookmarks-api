import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/storage';
import { hashPassword } from '@/lib/encryption';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = readDatabase();

    if (db.users.some((u) => u.email === email)) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const userId = `user-${Date.now()}`;
    const hashedPassword = hashPassword(password);

    db.users.push({
      id: userId,
      email,
      password: hashedPassword,
    });

    writeDatabase(db);

    const token = await generateToken({ userId, email });

    return NextResponse.json(
      { message: 'Registration successful', token, userId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
