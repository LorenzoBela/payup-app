export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'Client' | 'SuperAdmin'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          gcash_number: string | null
          role: UserRole
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          gcash_number?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          gcash_number?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          description: string
          paid_by: string
          currency: string
          category: 'food' | 'printing' | 'supplies' | 'other'
          receipt_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          amount: number
          description: string
          paid_by: string
          currency?: string
          category: 'food' | 'printing' | 'supplies' | 'other'
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          amount?: number
          description?: string
          paid_by?: string
          currency?: string
          category?: 'food' | 'printing' | 'supplies' | 'other'
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      settlements: {
        Row: {
          id: string
          expense_id: string
          owed_by: string
          amount_owed: number
          status: 'pending' | 'paid'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          expense_id: string
          owed_by: string
          amount_owed: number
          status?: 'pending' | 'paid'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          expense_id?: string
          owed_by?: string
          amount_owed?: number
          status?: 'pending' | 'paid'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      category: 'food' | 'printing' | 'supplies' | 'other'
      status: 'pending' | 'paid'
      user_role: UserRole
    }
  }
}

