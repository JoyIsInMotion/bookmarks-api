import { NextRequest, NextResponse } from 'next/server';
import { readDatabase } from '@/lib/storage';
import { verifyPassword } from '@/lib/encryption';
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
    const user = db.users.find((u) => u.email === email);

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await generateToken({ userId: user.id, email: user.email });

    return NextResponse.json(
      { message: 'Login successful', token, userId: user.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
