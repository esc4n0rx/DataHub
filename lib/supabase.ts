import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Configurar usuário atual para RLS
export const setCurrentUser = (userId: string) => {
  return supabase.rpc('set_config', {
    setting_name: 'app.current_user_id',
    setting_value: userId,
    is_local: false
  })
}

export type Database = {
  public: {
    Tables: {
      datasets: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          file_name: string
          file_size: number
          total_rows: number
          total_columns: number
          status: 'analyzing' | 'pending_adjustment' | 'confirmed' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['datasets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['datasets']['Insert']>
      }
      dataset_columns: {
        Row: {
          id: string
          dataset_id: string
          column_name: string
          column_index: number
          data_type: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'phone'
          is_required: boolean
          sample_values: string[] | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['dataset_columns']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['dataset_columns']['Insert']>
      }
      dataset_rows: {
        Row: {
          id: string
          dataset_id: string
          row_index: number
          data: Record<string, any>
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['dataset_rows']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['dataset_rows']['Insert']>
      }
      upload_logs: {
        Row: {
          id: string
          dataset_id: string
          level: 'info' | 'warning' | 'error'
          message: string
          details: Record<string, any> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['upload_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['upload_logs']['Insert']>
      }
    }
  }
}