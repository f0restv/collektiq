import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const PLATFORM_URL = process.env.PLATFORM_API_URL;
const API_KEY = process.env.PLATFORM_API_KEY;

// GET /api/collections - Get user's collections
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json({ error: 'Platform not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${PLATFORM_URL}/api/collections`, {
      headers: {
        'x-api-key': API_KEY,
        'x-user-id': session.user.id || '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json({ error: 'Platform not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${PLATFORM_URL}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-user-id': session.user.id || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Failed to create collection:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
