// Tipos generados para Supabase
// Este archivo define la estructura de la base de datos en TypeScript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'client';
          color_palette: Json | null;
          active_palette_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'client';
          color_palette?: Json | null;
          active_palette_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'client';
          color_palette?: Json | null;
          active_palette_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      saved_palettes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          palette: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          palette: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          palette?: Json;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          thumbnail: string | null;
          canvas_width: number;
          canvas_height: number;
          canvas_background_color: string;
          canvas_json: Json;
          category: string;
          business_category: 'inmobiliaria' | 'comida' | 'ropa' | 'generico';
          style: 'post' | 'historia' | 'imagen';
          is_active: boolean;
          created_by: string | null;
          demo_theme: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          thumbnail?: string | null;
          canvas_width: number;
          canvas_height: number;
          canvas_background_color?: string;
          canvas_json: Json;
          category?: string;
          business_category: 'inmobiliaria' | 'comida' | 'ropa' | 'generico';
          style: 'post' | 'historia' | 'imagen';
          is_active?: boolean;
          created_by?: string | null;
          demo_theme?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          thumbnail?: string | null;
          canvas_width?: number;
          canvas_height?: number;
          canvas_background_color?: string;
          canvas_json?: Json;
          category?: string;
          business_category?: 'inmobiliaria' | 'comida' | 'ropa' | 'generico';
          style?: 'post' | 'historia' | 'imagen';
          is_active?: boolean;
          created_by?: string | null;
          demo_theme?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string | null;
          template_id: string | null;
          name: string;
          canvas_data: string;
          thumbnail: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id?: string | null;
          template_id?: string | null;
          name: string;
          canvas_data: string;
          thumbnail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          folder_id?: string | null;
          template_id?: string | null;
          name?: string;
          canvas_data?: string;
          thumbnail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
      get_templates_by_category: {
        Args: {
          p_business_category: string;
          p_style?: string;
        };
        Returns: Database['public']['Tables']['templates']['Row'][];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
