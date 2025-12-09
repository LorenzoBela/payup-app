import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/settlements/[id]/pay - Mark a settlement as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check disabled for demo - enable when Auth0 is configured
    // const session = await getSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { id } = await params;

    // Update settlement status to paid
    const { data: settlement, error } = await supabaseAdmin
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

