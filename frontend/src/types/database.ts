// Database types (replacement for Supabase generated types)
export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string | null;
          role: string;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          full_name?: string | null;
          role?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          full_name?: string | null;
          role?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          shuttle_number: number;
          contact_email: string | null;
          contact_phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          shuttle_number: number;
          contact_email?: string | null;
          contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          shuttle_number?: number;
          contact_email?: string | null;
          contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      shuttles: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          shuttle_number: number;
          capacity: number;
          status: string;
          is_active: boolean;
          csv_file_path: string | null;
          csv_uploaded_at: string | null;
          csv_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          shuttle_number: number;
          capacity?: number;
          status?: string;
          is_active?: boolean;
          csv_file_path?: string | null;
          csv_uploaded_at?: string | null;
          csv_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          shuttle_number?: number;
          capacity?: number;
          status?: string;
          is_active?: boolean;
          csv_file_path?: string | null;
          csv_uploaded_at?: string | null;
          csv_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      shuttle_schedules: {
        Row: {
          id: string;
          shuttle_id: string;
          time_slot: string;
          route_description: string;
          route_type: string;
          direction: string;
          departure_time: string;
          arrival_time: string | null;
          days_of_week: number[];
          is_break: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shuttle_id: string;
          time_slot: string;
          route_description: string;
          route_type: string;
          direction: string;
          departure_time: string;
          arrival_time?: string | null;
          days_of_week?: number[];
          is_break?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shuttle_id?: string;
          time_slot?: string;
          route_description?: string;
          route_type?: string;
          direction?: string;
          departure_time?: string;
          arrival_time?: string | null;
          days_of_week?: number[];
          is_break?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      shuttle_registrations: {
        Row: {
          id: string;
          schedule_id: string | null;
          time_slot: string;
          route_type: string;
          direction: string;
          passenger_name: string;
          passenger_phone: string;
          passenger_email: string | null;
          user_name: string;
          phone_number: string;
          registration_date: string;
          registration_time: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_id?: string | null;
          time_slot: string;
          route_type: string;
          direction: string;
          passenger_name: string;
          passenger_phone: string;
          passenger_email?: string | null;
          user_name: string;
          phone_number: string;
          registration_date?: string;
          registration_time?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string | null;
          time_slot?: string;
          route_type?: string;
          direction?: string;
          passenger_name?: string;
          passenger_phone?: string;
          passenger_email?: string | null;
          user_name?: string;
          phone_number?: string;
          registration_date?: string;
          registration_time?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      csv_processing_logs: {
        Row: {
          id: string;
          shuttle_id: string;
          file_path: string;
          status: string;
          error_message: string | null;
          processed_at: string;
          processed_records: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shuttle_id: string;
          file_path: string;
          status: string;
          error_message?: string | null;
          processed_at?: string;
          processed_records?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shuttle_id?: string;
          file_path?: string;
          status?: string;
          error_message?: string | null;
          processed_at?: string;
          processed_records?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      shuttle_schedule_view: {
        Row: {
          id: string;
          shuttle_name: string;
          shuttle_number: number;
          company_name: string;
          time_slot: string;
          route_description: string;
          route_type: string;
          direction: string;
          departure_time: string;
          is_break: boolean;
          is_active: boolean;
          sort_order: number;
        };
      };
    };
    Functions: {
      current_user_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      bootstrap_first_admin: {
        Args: {
          user_email: string;
          bootstrap_key: string;
        };
        Returns: any;
      };
      create_first_admin: {
        Args: {
          user_email: string;
        };
        Returns: any;
      };
    };
  };
}