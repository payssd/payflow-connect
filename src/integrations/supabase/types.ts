export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          tax_pin: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          tax_pin?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          tax_pin?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bank_account: string | null
          bank_branch: string | null
          bank_name: string | null
          base_salary: number
          created_at: string
          department: string | null
          email: string | null
          employee_number: string | null
          first_name: string
          hire_date: string | null
          housing_allowance: number | null
          id: string
          job_title: string | null
          kra_pin: string | null
          last_name: string
          mobile_money_number: string | null
          mobile_money_provider: string | null
          national_id: string | null
          nhif_number: string | null
          nssf_number: string | null
          organization_id: string
          other_allowances: number | null
          payment_method: string | null
          phone: string | null
          status: string
          termination_date: string | null
          transport_allowance: number | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          base_salary?: number
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          first_name: string
          hire_date?: string | null
          housing_allowance?: number | null
          id?: string
          job_title?: string | null
          kra_pin?: string | null
          last_name: string
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          national_id?: string | null
          nhif_number?: string | null
          nssf_number?: string | null
          organization_id: string
          other_allowances?: number | null
          payment_method?: string | null
          phone?: string | null
          status?: string
          termination_date?: string | null
          transport_allowance?: number | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          base_salary?: number
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          first_name?: string
          hire_date?: string | null
          housing_allowance?: number | null
          id?: string
          job_title?: string | null
          kra_pin?: string | null
          last_name?: string
          mobile_money_number?: string | null
          mobile_money_provider?: string | null
          national_id?: string | null
          nhif_number?: string | null
          nssf_number?: string | null
          organization_id?: string
          other_allowances?: number | null
          payment_method?: string | null
          phone?: string | null
          status?: string
          termination_date?: string | null
          transport_allowance?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_budgets: {
        Row: {
          alert_threshold: number
          category: string
          created_at: string
          id: string
          monthly_limit: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          alert_threshold?: number
          category: string
          created_at?: string
          id?: string
          monthly_limit: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          alert_threshold?: number
          category?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          created_by: string
          currency: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          organization_id: string
          receipt_url: string | null
          status: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          created_by: string
          currency?: string | null
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          organization_id: string
          receipt_url?: string | null
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          receipt_url?: string | null
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string | null
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_reference: string | null
          public_token: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_reference?: string | null
          public_token?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_reference?: string | null
          public_token?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          country: string
          created_at: string
          email: string
          id: string
          logo_url: string | null
          name: string
          paystack_customer_id: string | null
          paystack_subscription_code: string | null
          phone: string | null
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_started_at: string | null
          subscription_status: string
          tax_pin: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          country?: string
          created_at?: string
          email: string
          id?: string
          logo_url?: string | null
          name: string
          paystack_customer_id?: string | null
          paystack_subscription_code?: string | null
          phone?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          tax_pin?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          country?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          paystack_customer_id?: string | null
          paystack_subscription_code?: string | null
          phone?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          tax_pin?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_gateway_configs: {
        Row: {
          config: Json | null
          created_at: string
          gateway: string
          id: string
          is_active: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          gateway: string
          id?: string
          is_active?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          gateway?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateway_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          basic_salary: number
          created_at: string
          employee_id: string
          gross_pay: number
          housing_allowance: number | null
          housing_levy: number | null
          id: string
          net_pay: number
          nhif: number | null
          nssf: number | null
          other_allowances: number | null
          other_deductions: number | null
          paye: number | null
          payroll_run_id: string
          total_deductions: number | null
          transport_allowance: number | null
        }
        Insert: {
          basic_salary?: number
          created_at?: string
          employee_id: string
          gross_pay?: number
          housing_allowance?: number | null
          housing_levy?: number | null
          id?: string
          net_pay?: number
          nhif?: number | null
          nssf?: number | null
          other_allowances?: number | null
          other_deductions?: number | null
          paye?: number | null
          payroll_run_id: string
          total_deductions?: number | null
          transport_allowance?: number | null
        }
        Update: {
          basic_salary?: number
          created_at?: string
          employee_id?: string
          gross_pay?: number
          housing_allowance?: number | null
          housing_levy?: number | null
          id?: string
          net_pay?: number
          nhif?: number | null
          nssf?: number | null
          other_allowances?: number | null
          other_deductions?: number | null
          paye?: number | null
          payroll_run_id?: string
          total_deductions?: number | null
          transport_allowance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          employee_count: number | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          pay_period_end: string
          pay_period_start: string
          payment_date: string | null
          run_number: string
          status: string
          total_deductions: number | null
          total_gross: number | null
          total_housing_levy: number | null
          total_net: number | null
          total_nhif: number | null
          total_nssf: number | null
          total_paye: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_count?: number | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          pay_period_end: string
          pay_period_start: string
          payment_date?: string | null
          run_number: string
          status?: string
          total_deductions?: number | null
          total_gross?: number | null
          total_housing_levy?: number | null
          total_net?: number | null
          total_nhif?: number | null
          total_nssf?: number | null
          total_paye?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_count?: number | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          pay_period_end?: string
          pay_period_start?: string
          payment_date?: string | null
          run_number?: string
          status?: string
          total_deductions?: number | null
          total_gross?: number | null
          total_housing_levy?: number | null
          total_net?: number | null
          total_nhif?: number | null
          total_nssf?: number | null
          total_paye?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
