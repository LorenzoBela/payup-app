import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to get untyped client for operations where types are missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;

// POST /api/settlements/[id]/pay - Mark a settlement as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Update settlement status to paid
    const { data: settlement, error } = await db
      .from('settlements')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating settlement:', error);
      return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 });
    }

    if (!settlement) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: settlement });
  } catch (error) {
    console.error('Error in POST /api/settlements/[id]/pay:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

