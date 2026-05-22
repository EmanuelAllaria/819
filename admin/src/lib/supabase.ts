import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      admin_tokens: {
        Row: {
          id: string;
          token_value: string;
          description: string | null;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_value: string;
          description?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token_value?: string;
          description?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          url_imagen: string;
          link_destino: string | null;
          orden: number;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          url_imagen: string;
          link_destino?: string | null;
          orden?: number;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          url_imagen?: string;
          link_destino?: string | null;
          orden?: number;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      buyers: {
        Row: { id: string; email: string; created_at: string };
        Insert: { id: string; email: string; created_at?: string };
        Update: { id?: string; email?: string; created_at?: string };
        Relationships: [];
      };
      wholesaler_profiles: {
        Row: {
          id: string;
          email: string;
          nombre: string | null;
          descripcion: string | null;
          foto_perfil_url: string | null;
          pais: string | null;
          estado_provincia: string | null;
          categoria: string | null;
          whatsapp: string | null;
          instagram: string | null;
          facebook: string | null;
          web: string | null;
          acceso: boolean;
          fecha_aprobacion: string | null;
          verificado: boolean;
          promo_activa: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre?: string | null;
          descripcion?: string | null;
          foto_perfil_url?: string | null;
          pais?: string | null;
          estado_provincia?: string | null;
          categoria?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          web?: string | null;
          acceso?: boolean;
          fecha_aprobacion?: string | null;
          verificado?: boolean;
          promo_activa?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string | null;
          descripcion?: string | null;
          foto_perfil_url?: string | null;
          pais?: string | null;
          estado_provincia?: string | null;
          categoria?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          web?: string | null;
          acceso?: boolean;
          fecha_aprobacion?: string | null;
          verificado?: boolean;
          promo_activa?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      grant_wholesaler_access: {
        Args: { wholesaler_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient<Database>(url, anonKey);
