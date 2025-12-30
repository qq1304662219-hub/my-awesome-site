export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          role: string | null
          invited_by: string | null
          balance: number | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
          invited_by?: string | null
          balance?: number | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
          invited_by?: string | null
          balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      videos: {
        Row: {
          id: string
          created_at: string
          title: string | null
          description: string | null
          url: string | null
          thumbnail_url: string | null
          user_id: string | null
          duration: number | null
          resolution: string | null
          format: string | null
          views: number | null
          likes: number | null
          price: number | null
          category: string | null
          style: string | null
          ratio: string | null
          status: string | null
          download_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title?: string | null
          description?: string | null
          url?: string | null
          thumbnail_url?: string | null
          user_id?: string | null
          duration?: number | null
          resolution?: string | null
          format?: string | null
          views?: number | null
          likes?: number | null
          price?: number | null
          category?: string | null
          style?: string | null
          ratio?: string | null
          status?: string | null
          download_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string | null
          description?: string | null
          url?: string | null
          thumbnail_url?: string | null
          user_id?: string | null
          duration?: number | null
          resolution?: string | null
          format?: string | null
          views?: number | null
          likes?: number | null
          price?: number | null
          category?: string | null
          style?: string | null
          ratio?: string | null
          status?: string | null
          download_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
