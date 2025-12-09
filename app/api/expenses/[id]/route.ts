import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { updateExpenseSchema } from '@/lib/validations';
import { z } from 'zod';

// PUT /api/expenses/[id] - Update an expense
export async function PUT(
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
    const body = await request.json();
    
    // Validate input
    const validatedData = updateExpenseSchema.parse(body);

    // Update the expense
    const { data: expense, error } = await supabaseAdmin
      .from('expenses')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // If amount changed, update settlements
    if (validatedData.amount !== undefined) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')
        .is('deleted_at', null);

      if (users && users.length > 0) {
        const splitAmount = validatedData.amount / users.length;

        await supabaseAdmin
          .from('settlements')
          .update({ amount_owed: splitAmount })
          .eq('expense_id', id);
      }
    }

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in PUT /api/expenses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/expenses/[id] - Soft delete an expense
export async function DELETE(
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

    // Soft delete the expense
    const { data: expense, error } = await supabaseAdmin
      .from('expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error deleting expense:', error);
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Soft delete associated settlements
    await supabaseAdmin
      .from('settlements')
      .update({ deleted_at: new Date().toISOString() })
      .eq('expense_id', id);

    return NextResponse.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/expenses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

