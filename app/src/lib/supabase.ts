import { createClient } from "@supabase/supabase-js/dist/index.cjs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoCrypto from "expo-crypto";

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
      catalogs: {
        Row: {
          id: string;
          wholesaler_id: string;
          image_url: string;
          carousel_slot: number;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          wholesaler_id: string;
          image_url: string;
          carousel_slot?: number;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          wholesaler_id?: string;
          image_url?: string;
          carousel_slot?: number;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      metrics: {
        Row: {
          id: string;
          wholesaler_id: string;
          clicks_perfil: number;
          clicks_whatsapp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          wholesaler_id: string;
          clicks_perfil?: number;
          clicks_whatsapp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          wholesaler_id?: string;
          clicks_perfil?: number;
          clicks_whatsapp?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_wholesalers: {
        Row: {
          id: string;
          buyer_id: string;
          wholesaler_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          wholesaler_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          wholesaler_id?: string;
          created_at?: string;
        };
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

const g = globalThis as unknown as {
  crypto?: {
    getRandomValues?: (array: unknown) => unknown;
    randomUUID?: () => string;
    subtle?: { digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer> };
  };
};

if (!g.crypto) g.crypto = {};
if (!g.crypto.getRandomValues) g.crypto.getRandomValues = ExpoCrypto.getRandomValues as unknown as (array: unknown) => unknown;
if (!g.crypto.randomUUID) g.crypto.randomUUID = ExpoCrypto.randomUUID;
if (!g.crypto.subtle) {
  g.crypto.subtle = {
    digest: async (algorithm: string, data: BufferSource) => {
      const a = String(algorithm).toUpperCase();
      const mapped =
        a === "SHA-256" ? ExpoCrypto.CryptoDigestAlgorithm.SHA256 : ExpoCrypto.CryptoDigestAlgorithm.SHA512;
      return await ExpoCrypto.digest(mapped, data);
    },
  };
}

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_* fallback)",
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
