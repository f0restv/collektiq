import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const PLATFORM_URL = process.env.PLATFORM_API_URL;
const API_KEY = process.env.PLATFORM_API_KEY;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/collections/[id] - Get collection with items
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: collectionId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json({ error: 'Platform not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${PLATFORM_URL}/api/collections/${collectionId}`, {
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
    console.error('Failed to fetch collection:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

// PATCH /api/collections/[id] - Update collection
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: collectionId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json({ error: 'Platform not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${PLATFORM_URL}/api/collections/${collectionId}`, {
      method: 'PATCH',
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update collection:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

// DELETE /api/collections/[id] - Delete collection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: collectionId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!PLATFORM_URL || !API_KEY) {
    return NextResponse.json({ error: 'Platform not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${PLATFORM_URL}/api/collections/${collectionId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': API_KEY,
        'x-user-id': session.user.id || '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
