import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const PLATFORM_URL = process.env.PLATFORM_API_URL;
const API_KEY = process.env.PLATFORM_API_KEY;

// GET /api/submissions - Get user's submissions
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json({ error: 'Platform not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const url = new URL(`${PLATFORM_URL}/api/submissions`);
    if (status) url.searchParams.set('status', status);

    const response = await fetch(url.toString(), {
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
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST /api/submissions - Create a new submission (list item for sale)
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

    const response = await fetch(`${PLATFORM_URL}/api/submissions`, {
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
    console.error('Failed to create submission:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
