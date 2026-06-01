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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: number
          created_at: string | null
          entity_id: number | null
          entity_type: string
          id: number
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: number
          created_at?: string | null
          entity_id?: number | null
          entity_type: string
          id?: number
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: number
          created_at?: string | null
          entity_id?: number | null
          entity_type?: string
          id?: number
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_user_id: number
          created_at: string | null
          expires_at: string
          id: number
          ip_address: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: number
          created_at?: string | null
          expires_at: string
          id?: number
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: number
          created_at?: string | null
          expires_at?: string
          id?: number
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: number
          is_active: boolean | null
          last_login_at: string | null
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: number
          is_active?: boolean | null
          last_login_at?: string | null
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: number
          is_active?: boolean | null
          last_login_at?: string | null
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      affiliate_sessions: {
        Row: {
          affiliate_id: number
          created_at: string | null
          expires_at: string
          id: number
          ip_address: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          affiliate_id: number
          created_at?: string | null
          expires_at: string
          id?: number
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: number
          created_at?: string | null
          expires_at?: string
          id?: number
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sessions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_stats: {
        Row: {
          available_balance: number | null
          created_at: string | null
          frozen_balance: number | null
          id: number
          monthly_points: number | null
          points_balance: number | null
          referral_code: string
          total_earnings: number | null
          total_withdrawals: number | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          available_balance?: number | null
          created_at?: string | null
          frozen_balance?: number | null
          id?: never
          monthly_points?: number | null
          points_balance?: number | null
          referral_code: string
          total_earnings?: number | null
          total_withdrawals?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          available_balance?: number | null
          created_at?: string | null
          frozen_balance?: number | null
          id?: never
          monthly_points?: number | null
          points_balance?: number | null
          referral_code?: string
          total_earnings?: number | null
          total_withdrawals?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          cpf: string
          created_at: string | null
          email: string
          full_name: string
          id: number
          is_active: boolean | null
          is_verified: boolean | null
          last_access_at: string | null
          password_hash: string
          phone: string | null
          position_slot: number | null
          referral_code: string
          sponsor_id: number | null
          updated_at: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          email: string
          full_name: string
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          last_access_at?: string | null
          password_hash: string
          phone?: string | null
          position_slot?: number | null
          referral_code: string
          sponsor_id?: number | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          last_access_at?: string | null
          password_hash?: string
          phone?: string | null
          position_slot?: number | null
          referral_code?: string
          sponsor_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_config: {
        Row: {
          amount: number
          commission_type: string | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          level: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          commission_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          level: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          commission_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          level?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      cashier_sessions: {
        Row: {
          cashier_id: number
          created_at: string | null
          expires_at: string
          id: number
          session_token: string
        }
        Insert: {
          cashier_id: number
          created_at?: string | null
          expires_at: string
          id?: number
          session_token: string
        }
        Update: {
          cashier_id?: number
          created_at?: string | null
          expires_at?: string
          id?: number
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashier_sessions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "company_cashiers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      commission_distributions: {
        Row: {
          affiliate_id: number
          base_cashback: number
          commission_amount: number
          commission_percentage: number
          created_at: string | null
          id: number
          is_blocked: boolean | null
          level: number
          purchase_id: number
          released_at: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id: number
          base_cashback: number
          commission_amount: number
          commission_percentage: number
          created_at?: string | null
          id?: number
          is_blocked?: boolean | null
          level: number
          purchase_id: number
          released_at?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: number
          base_cashback?: number
          commission_amount?: number
          commission_percentage?: number
          created_at?: string | null
          id?: number
          is_blocked?: boolean | null
          level?: number
          purchase_id?: number
          released_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_distributions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_distributions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "company_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          affiliate_id: number | null
          amount: number
          created_at: string | null
          id: number
          level: number | null
          order_id: number | null
          released_at: string | null
          status: string | null
        }
        Insert: {
          affiliate_id?: number | null
          amount: number
          created_at?: string | null
          id?: never
          level?: number | null
          order_id?: number | null
          released_at?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: number | null
          amount?: number
          created_at?: string | null
          id?: never
          level?: number | null
          order_id?: number | null
          released_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          id: number
          course_id: number | null
          title: string
          order_index: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          course_id?: number | null
          title: string
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          course_id?: number | null
          title?: string
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: number
          title: string
          description: string | null
          thumbnail_url: string | null
          category: string | null
          points: number | null
          instructor_id: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          thumbnail_url?: string | null
          category?: string | null
          points?: number | null
          instructor_id?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          category?: string | null
          points?: number | null
          instructor_id?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      companies: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cnpj: string
          created_at: string | null
          description: string | null
          email: string
          endereco: string | null
          id: number
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          nome_fantasia: string
          razao_social: string
          responsavel: string
          senha_hash: string
          site_instagram: string | null
          telefone: string
          thumbnail_url: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj: string
          created_at?: string | null
          description?: string | null
          email: string
          endereco?: string | null
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          nome_fantasia: string
          razao_social: string
          responsavel: string
          senha_hash: string
          site_instagram?: string | null
          telefone: string
          thumbnail_url?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string
          created_at?: string | null
          description?: string | null
          email?: string
          endereco?: string | null
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          nome_fantasia?: string
          razao_social?: string
          responsavel?: string
          senha_hash?: string
          site_instagram?: string | null
          telefone?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      company_cashback_config: {
        Row: {
          cashback_percentage: number
          company_id: number
          created_at: string | null
          id: number
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          cashback_percentage?: number
          company_id: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cashback_percentage?: number
          company_id?: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_cashback_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_cashiers: {
        Row: {
          company_id: number
          cpf: string
          created_at: string | null
          id: number
          is_active: boolean | null
          last_access_at: string | null
          name: string | null
          password_hash: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          company_id: number
          cpf: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_access_at?: string | null
          name?: string | null
          password_hash: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          company_id?: number
          cpf?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_access_at?: string | null
          name?: string | null
          password_hash?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_cashiers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_cashiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_categories: {
        Row: {
          category_id: string
          company_id: number
        }
        Insert: {
          category_id: string
          company_id: number
        }
        Update: {
          category_id?: string
          company_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_images: {
        Row: {
          company_id: number | null
          created_at: string | null
          id: string
          image_url: string
          order_index: number | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string | null
          id?: string
          image_url: string
          order_index?: number | null
        }
        Update: {
          company_id?: number | null
          created_at?: string | null
          id?: string
          image_url?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_images_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_purchases: {
        Row: {
          cashback_generated: number
          cashback_percentage: number
          cashier_cpf: string
          cashier_id: number
          company_id: number
          created_at: string | null
          customer_coupon: string
          customer_coupon_id: number
          id: number
          purchase_date: string
          purchase_time: string
          purchase_value: number
          updated_at: string | null
        }
        Insert: {
          cashback_generated: number
          cashback_percentage: number
          cashier_cpf: string
          cashier_id: number
          company_id: number
          created_at?: string | null
          customer_coupon: string
          customer_coupon_id: number
          id?: number
          purchase_date: string
          purchase_time: string
          purchase_value: number
          updated_at?: string | null
        }
        Update: {
          cashback_generated?: number
          cashback_percentage?: number
          cashier_cpf?: string
          cashier_id?: number
          company_id?: number
          created_at?: string | null
          customer_coupon?: string
          customer_coupon_id?: number
          id?: number
          purchase_date?: string
          purchase_time?: string
          purchase_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_purchases_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "company_cashiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_purchases_customer_coupon_id_fkey"
            columns: ["customer_coupon_id"]
            isOneToOne: false
            referencedRelation: "customer_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      company_reviews: {
        Row: {
          comment: string | null
          company_id: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          rating: number | null
          user_id: number | null
        }
        Insert: {
          comment?: string | null
          company_id?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rating?: number | null
          user_id?: number | null
        }
        Update: {
          comment?: string | null
          company_id?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rating?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sessions: {
        Row: {
          company_id: number
          created_at: string | null
          expires_at: string
          id: number
          session_token: string
        }
        Insert: {
          company_id: number
          created_at?: string | null
          expires_at: string
          id?: number
          session_token: string
        }
        Update: {
          company_id?: number
          created_at?: string | null
          expires_at?: string
          id?: number
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_coupons: {
        Row: {
          affiliate_id: number | null
          coupon_code: string
          cpf: string
          created_at: string | null
          id: number
          is_active: boolean | null
          last_used_at: string | null
          total_usage_count: number | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          affiliate_id?: number | null
          coupon_code: string
          cpf: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_used_at?: string | null
          total_usage_count?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          affiliate_id?: number | null
          coupon_code?: string
          cpf?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_used_at?: string | null
          total_usage_count?: number | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_coupons_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_comments: {
        Row: {
          id: number
          lesson_id: number | null
          user_id: number | null
          content: string
          is_approved: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          lesson_id?: number | null
          user_id?: number | null
          content: string
          is_approved?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          lesson_id?: number | null
          user_id?: number | null
          content?: string
          is_approved?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lesson_materials: {
        Row: {
          id: number
          lesson_id: number | null
          title: string
          file_url: string
          file_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          lesson_id?: number | null
          title: string
          file_url: string
          file_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          lesson_id?: number | null
          title?: string
          file_url?: string
          file_type?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      lessons: {
        Row: {
          id: number
          course_id: number | null
          module_id: number | null
          title: string
          description: string | null
          video_url: string | null
          thumbnail_url: string | null
          duration: string | null
          order_index: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          course_id?: number | null
          module_id?: number | null
          title: string
          description?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          course_id?: number | null
          module_id?: number | null
          title?: string
          description?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          duration?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      marketing_materials: {
        Row: {
          category: string | null
          created_at: string | null
          file_url: string | null
          format: string | null
          id: number
          size: string | null
          thumbnail_url: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_url?: string | null
          format?: string | null
          id?: never
          size?: string | null
          thumbnail_url?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_url?: string | null
          format?: string | null
          id?: never
          size?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      network_structure: {
        Row: {
          created_at: string | null
          id: number
          is_active_this_month: boolean | null
          last_purchase_date: string | null
          level: number
          sponsor_id: number
          updated_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active_this_month?: boolean | null
          last_purchase_date?: string | null
          level: number
          sponsor_id: number
          updated_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active_this_month?: boolean | null
          last_purchase_date?: string | null
          level?: number
          sponsor_id?: number
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "network_structure_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_structure_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: number
          order_id: number | null
          points_at_purchase: number | null
          price_at_purchase: number
          product_id: number | null
          quantity: number
        }
        Insert: {
          id?: never
          order_id?: number | null
          points_at_purchase?: number | null
          price_at_purchase: number
          product_id?: number | null
          quantity: number
        }
        Update: {
          id?: never
          order_id?: number | null
          points_at_purchase?: number | null
          price_at_purchase?: number
          product_id?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          affiliate_id: number | null
          created_at: string | null
          id: number
          payment_method: string | null
          payout_date: string | null
          payout_receipt_url: string | null
          payout_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          shipping_method: string | null
          status: string | null
          total_amount: number
          tracking_code: string | null
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          affiliate_id?: number | null
          created_at?: string | null
          id?: never
          payment_method?: string | null
          payout_date?: string | null
          payout_receipt_url?: string | null
          payout_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string | null
          total_amount: number
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          affiliate_id?: number | null
          created_at?: string | null
          id?: never
          payment_method?: string | null
          payout_date?: string | null
          payout_receipt_url?: string | null
          payout_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string | null
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          company_id: number
          created_at: string | null
          expires_at: string
          id: number
          token: string
          used: boolean | null
        }
        Insert: {
          company_id: number
          created_at?: string | null
          expires_at: string
          id?: number
          token: string
          used?: boolean | null
        }
        Update: {
          company_id?: number
          created_at?: string | null
          expires_at?: string
          id?: number
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: never
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: number
          image_url: string
          order_index: number | null
          product_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          image_url: string
          order_index?: number | null
          product_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: never
          image_url?: string
          order_index?: number | null
          product_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subcategories: {
        Row: {
          category_id: number | null
          created_at: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_price: number | null
          category_id: number | null
          created_at: string | null
          description: string | null
          features: string[] | null
          height: number | null
          id: number
          is_active: boolean | null
          length: number | null
          main_image_url: string | null
          name: string
          points: number | null
          price: number
          rating: number | null
          stock_quantity: number | null
          subcategory_id: number | null
          tags: string[] | null
          updated_at: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          affiliate_price?: number | null
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          height?: number | null
          id?: never
          is_active?: boolean | null
          length?: number | null
          main_image_url?: string | null
          name: string
          points?: number | null
          price: number
          rating?: number | null
          stock_quantity?: number | null
          subcategory_id?: number | null
          tags?: string[] | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          affiliate_price?: number | null
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          height?: number | null
          id?: never
          is_active?: boolean | null
          length?: number | null
          main_image_url?: string | null
          name?: string
          points?: number | null
          price?: number
          rating?: number | null
          stock_quantity?: number | null
          subcategory_id?: number | null
          tags?: string[] | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: number
          status: string | null
          type: string
          updated_at: string | null
          user_id: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: never
          status?: string | null
          type: string
          updated_at?: string | null
          user_id?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: never
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          cep: string | null
          city: string | null
          company_name: string | null
          complement: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: number
          is_active: boolean | null
          mocha_user_id: string
          neighborhood: string | null
          number: string | null
          phone: string | null
          pix_key: string | null
          pix_type: string | null
          referral_code: string | null
          role: string
          sponsor_id: number | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          company_name?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: number
          is_active?: boolean | null
          mocha_user_id: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          pix_key?: string | null
          pix_type?: string | null
          referral_code?: string | null
          role?: string
          sponsor_id?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          company_name?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: number
          is_active?: boolean | null
          mocha_user_id?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          pix_key?: string | null
          pix_type?: string | null
          referral_code?: string | null
          role?: string
          sponsor_id?: number | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          id: number
          user_id: number | null
          course_id: number | null
          lesson_id: number | null
          completed: boolean | null
          completed_at: string | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          course_id?: number | null
          lesson_id?: number | null
          completed?: boolean | null
          completed_at?: string | null
        }
        Update: {
          id?: number
          user_id?: number | null
          course_id?: number | null
          lesson_id?: number | null
          completed?: boolean | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          }
        ]
      }
      user_notifications: {
        Row: {
          id: number
          user_id: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          available_balance: number | null
          created_at: string | null
          frozen_balance: number | null
          id: number
          is_active_this_month: boolean | null
          leg_preference: string | null
          pix_key: string | null
          total_earnings: number | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          available_balance?: number | null
          created_at?: string | null
          frozen_balance?: number | null
          id?: number
          is_active_this_month?: boolean | null
          leg_preference?: string | null
          pix_key?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          available_balance?: number | null
          created_at?: string | null
          frozen_balance?: number | null
          id?: number
          is_active_this_month?: boolean | null
          leg_preference?: string | null
          pix_key?: string | null
          total_earnings?: number | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      videos_feed: {
        Row: {
          comments_count: number | null
          created_at: string
          description: string | null
          id: number
          likes_count: number | null
          thumbnail_url: string | null
          type: string
          user_id: number | null
          video_url: string
          target_states: string[] | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: number
          likes_count?: number | null
          thumbnail_url?: string | null
          type: string
          user_id?: number | null
          video_url: string
          target_states?: string[] | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string
          description?: string | null
          id?: number
          likes_count?: number | null
          thumbnail_url?: string | null
          type?: string
          user_id?: number | null
          video_url?: string
          target_states?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      video_comments: {
        Row: {
          id: number
          video_id: number
          user_id: number
          content: string
          is_approved: boolean | null
          created_at: string
        }
        Insert: {
          id?: number
          video_id: number
          user_id: number
          content: string
          is_approved?: boolean | null
          created_at?: string
        }
        Update: {
          id?: number
          video_id?: number
          user_id?: number
          content?: string
          is_approved?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      video_views_logs: {
        Row: {
          id: number
          video_id: number
          affiliate_id: number | null
          viewer_ip: string
          created_at: string
        }
        Insert: {
          id?: number
          video_id: number
          affiliate_id?: number | null
          viewer_ip: string
          created_at?: string
        }
        Update: {
          id?: number
          video_id?: number
          affiliate_id?: number | null
          viewer_ip?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_views_logs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_views_logs_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      withdrawals: {
        Row: {
          amount_requested: number
          created_at: string | null
          fee_amount: number
          id: number
          net_amount: number
          pix_key: string
          processed_at: string | null
          status: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          amount_requested: number
          created_at?: string | null
          fee_amount: number
          id?: number
          net_amount: number
          pix_key: string
          processed_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          amount_requested?: number
          created_at?: string | null
          fee_amount?: number
          id?: number
          net_amount?: number
          pix_key?: string
          processed_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_auth: {
        Args: { p_email?: string; p_password?: string; p_user_id: string }
        Returns: undefined
      }
      create_checkout_order: {
        Args: {
          p_items: Json
          p_shipping_address: Json
          p_shipping_cost: number
          p_shipping_method: string
          p_total_amount: number
          p_user_id: number
        }
        Returns: Json
      }
      create_checkout_v3: { Args: { payload: Json }; Returns: Json }
      get_affiliate_stats: { Args: { p_affiliate_id: number }; Returns: Json }
      like_video: { Args: { video_id: number }; Returns: unknown }
      unlike_video: { Args: { video_id: number }; Returns: unknown }
      get_all_profiles: { Args: never; Returns: Json }
      get_all_profiles_safe: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: number
          is_active: boolean
          sponsor_id: number
        }[]
      }
      get_dashboard_data: { Args: { auth_user_id: string }; Returns: Json }
      get_network_data: { Args: { auth_user_id: string }; Returns: Json }
      get_network_direct: {
        Args: { p_auth_id: string; p_email: string }
        Returns: Json
      }
      get_network_light: { Args: { auth_user_id: string }; Returns: Json }
      get_network_members_recursive: {
        Args: { p_sponsor_id: number }
        Returns: {
          cpf: string
          created_at: string
          email: string
          full_name: string
          id: number
          is_active: boolean
          level: number
          sponsor_path: number[]
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      login_affiliate: {
        Args: { p_cpf: string; p_password: string }
        Returns: {
          cpf: string
          created_at: string | null
          email: string
          full_name: string
          id: number
          is_active: boolean | null
          is_verified: boolean | null
          last_access_at: string | null
          password_hash: string
          phone: string | null
          position_slot: number | null
          referral_code: string
          sponsor_id: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "affiliates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      register_affiliate_v2: {
        Args: {
          p_cpf: string
          p_email: string
          p_full_name: string
          p_password_hash: string
          p_phone: string
          p_position_slot?: number
          p_referral_code?: string
        }
        Returns: {
          cpf: string
          created_at: string | null
          email: string
          full_name: string
          id: number
          is_active: boolean | null
          is_verified: boolean | null
          last_access_at: string | null
          password_hash: string
          phone: string | null
          position_slot: number | null
          referral_code: string
          sponsor_id: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "affiliates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      register_affiliate_v3: {
        Args: {
          p_cpf: string
          p_email: string
          p_full_name: string
          p_password_hash: string
          p_phone: string
          p_position_slot: number
          p_referral_code?: string
          p_sponsor_id: number
        }
        Returns: {
          cpf: string
          created_at: string | null
          email: string
          full_name: string
          id: number
          is_active: boolean | null
          is_verified: boolean | null
          last_access_at: string | null
          password_hash: string
          phone: string | null
          position_slot: number | null
          referral_code: string
          sponsor_id: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "affiliates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      update_order_payout: { Args: { payload: Json }; Returns: undefined }
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
