import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const PLATFORM_URL = process.env.PLATFORM_API_URL;
const API_KEY = process.env.PLATFORM_API_KEY;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/collections/[id]/items - Add item to collection
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const response = await fetch(`${PLATFORM_URL}/api/collections/${collectionId}/items`, {
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
    console.error('Failed to add item to collection:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

// DELETE /api/collections/[id]/items - Remove item from collection
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
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const response = await fetch(`${PLATFORM_URL}/api/collections/${collectionId}/items?itemId=${itemId}`, {
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
    console.error('Failed to remove item from collection:', error);
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }
}
