import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { expenseSchema } from '@/lib/validations';
import { z } from 'zod';

// GET /api/expenses - List all expenses
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const filterUserId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('expenses')
      .select(`
        *,
        paid_by_user:users!expenses_paid_by_fkey(id, name, email),
        settlements(*)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (filterUserId) {
      query = query.eq('paid_by', filterUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in GET /api/expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/expenses - Add a new expense
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = expenseSchema.parse(body);

    // Get all users to split the expense
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .is('deleted_at', null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = usersData as any[];

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 400 });
    }

    // Create expense
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert({
        amount: validatedData.amount,
        description: validatedData.description,
        paid_by: validatedData.paid_by,
        category: validatedData.category,
        currency: validatedData.currency || 'USD',
        receipt_url: validatedData.receipt_url,
      } as any)
      .select()
      .single();

    if (expenseError || !expense) {
      console.error('Error creating expense:', expenseError);
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }

    // Calculate split amount (equal split among all users except the payer)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdExpense = expense as any;
    const splitAmount = createdExpense.amount / users.length;

    // Create settlements for each user except the one who paid
    const settlements = users
      .filter((user) => user.id !== createdExpense.paid_by)
      .map((user) => ({
        expense_id: createdExpense.id,
        owed_by: user.id,
        amount_owed: splitAmount,
        status: 'pending' as const,
      }));

    if (settlements.length > 0) {
      const { error: settlementsError } = await supabaseAdmin
        .from('settlements')
        .insert(settlements as any);

      if (settlementsError) {
        console.error('Error creating settlements:', settlementsError);
        // Note: We don't fail the request if settlements fail, but log it
      }
    }

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

