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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          organization_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          organization_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          organization_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          customer_number: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          payment_terms: number | null
          phone: string | null
          status: string | null
          tax_pin: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          customer_number?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          payment_terms?: number | null
          phone?: string | null
          status?: string | null
          tax_pin?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          customer_number?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: number | null
          phone?: string | null
          status?: string | null
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
          address: string | null
          avatar_url: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          base_salary: number | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          date_of_birth: string | null
          department: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string | null
          employment_type: string | null
          first_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          last_name: string
          national_id: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          status: string | null
          tax_pin: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          base_salary?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          department?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string | null
          employment_type?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          last_name: string
          national_id?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          status?: string | null
          tax_pin?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          base_salary?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string | null
          employment_type?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          last_name?: string
          national_id?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string | null
          tax_pin?: string | null
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
          status: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
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
          status?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
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
          status?: string | null
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
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          gateway_response: Json | null
          id: string
          invoice_id: string
          payment_date: string
          payment_method: string
          payment_reference: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          gateway_response?: Json | null
          id?: string
          invoice_id: string
          payment_date?: string
          payment_method: string
          payment_reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          gateway_response?: Json | null
          id?: string
          invoice_id?: string
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          created_at: string
          currency: string | null
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          public_token: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          currency?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          public_token?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          currency?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          public_token?: string | null
          status?: string | null
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
      organization_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
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
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
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
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_started_at: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
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
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
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
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: []
      }
      payment_gateway_configs: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          is_live_mode: boolean
          organization_id: string
          provider: string
          public_key: string | null
          secret_key_hint: string | null
          updated_at: string
          webhook_secret_hint: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_live_mode?: boolean
          organization_id: string
          provider: string
          public_key?: string | null
          secret_key_hint?: string | null
          updated_at?: string
          webhook_secret_hint?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_live_mode?: boolean
          organization_id?: string
          provider?: string
          public_key?: string | null
          secret_key_hint?: string | null
          updated_at?: string
          webhook_secret_hint?: string | null
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
      payment_settings: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_enabled: boolean | null
          bank_name: string | null
          bank_swift_code: string | null
          created_at: string
          id: string
          mpesa_account_name: string | null
          mpesa_business_shortcode: string | null
          mpesa_enabled: boolean | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_enabled?: boolean | null
          bank_name?: string | null
          bank_swift_code?: string | null
          created_at?: string
          id?: string
          mpesa_account_name?: string | null
          mpesa_business_shortcode?: string | null
          mpesa_enabled?: boolean | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_enabled?: boolean | null
          bank_name?: string | null
          bank_swift_code?: string | null
          created_at?: string
          id?: string
          mpesa_account_name?: string | null
          mpesa_business_shortcode?: string | null
          mpesa_enabled?: boolean | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
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
          id: string
          net_pay: number
          nhif: number | null
          nssf: number | null
          other_allowances: number | null
          other_deductions: number | null
          paye: number | null
          payroll_run_id: string
          status: string | null
          total_deductions: number | null
          transport_allowance: number | null
        }
        Insert: {
          basic_salary: number
          created_at?: string
          employee_id: string
          gross_pay: number
          housing_allowance?: number | null
          id?: string
          net_pay: number
          nhif?: number | null
          nssf?: number | null
          other_allowances?: number | null
          other_deductions?: number | null
          paye?: number | null
          payroll_run_id: string
          status?: string | null
          total_deductions?: number | null
          transport_allowance?: number | null
        }
        Update: {
          basic_salary?: number
          created_at?: string
          employee_id?: string
          gross_pay?: number
          housing_allowance?: number | null
          id?: string
          net_pay?: number
          nhif?: number | null
          nssf?: number | null
          other_allowances?: number | null
          other_deductions?: number | null
          paye?: number | null
          payroll_run_id?: string
          status?: string | null
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
          currency: string | null
          employee_count: number | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          pay_period_end: string
          pay_period_start: string
          payment_date: string
          run_number: string
          status: string | null
          total_deductions: number | null
          total_gross: number | null
          total_net: number | null
          total_nhif: number | null
          total_nssf: number | null
          total_paye: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          employee_count?: number | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          pay_period_end: string
          pay_period_start: string
          payment_date: string
          run_number: string
          status?: string | null
          total_deductions?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_nhif?: number | null
          total_nssf?: number | null
          total_paye?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          employee_count?: number | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          pay_period_end?: string
          pay_period_start?: string
          payment_date?: string
          run_number?: string
          status?: string | null
          total_deductions?: number | null
          total_gross?: number | null
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
      subscription_payments: {
        Row: {
          amount: number
          billing_period: string | null
          created_at: string
          currency: string
          id: string
          organization_id: string
          payment_method: string | null
          payment_reference: string | null
          paystack_reference: string | null
          plan_name: string | null
          status: string
        }
        Insert: {
          amount: number
          billing_period?: string | null
          created_at?: string
          currency?: string
          id?: string
          organization_id: string
          payment_method?: string | null
          payment_reference?: string | null
          paystack_reference?: string | null
          plan_name?: string | null
          status?: string
        }
        Update: {
          amount?: number
          billing_period?: string | null
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          paystack_reference?: string | null
          plan_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      has_app_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      org_has_members: { Args: { _org_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      org_role: "owner" | "admin" | "member"
      subscription_plan: "starter" | "growth" | "pro"
      subscription_status:
        | "active"
        | "inactive"
        | "cancelled"
        | "past_due"
        | "trialing"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      org_role: ["owner", "admin", "member"],
      subscription_plan: ["starter", "growth", "pro"],
      subscription_status: [
        "active",
        "inactive",
        "cancelled",
        "past_due",
        "trialing",
      ],
    },
  },
} as const
