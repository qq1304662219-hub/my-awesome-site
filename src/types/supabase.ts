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
          bio: string | null
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
          bio?: string | null
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
          bio?: string | null
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
          prompt: string | null
          ai_model: string | null
          tags: string[] | null
          downloads: number | null
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
          prompt?: string | null
          ai_model?: string | null
          tags?: string[] | null
          downloads?: number | null
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
          prompt?: string | null
          ai_model?: string | null
          tags?: string[] | null
          downloads?: number | null
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
      },
      comments: {
        Row: {
          id: number
          content: string
          video_id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          content: string
          video_id: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          content?: string
          video_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      collections: {
        Row: {
          id: number
          name: string
          description: string | null
          user_id: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          user_id: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          user_id?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      collection_items: {
        Row: {
          id: number
          collection_id: number
          video_id: string
          created_at: string
        }
        Insert: {
          id?: number
          collection_id: number
          video_id: string
          created_at?: string
        }
        Update: {
          id?: number
          collection_id?: number
          video_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_video_id_fkey"
            columns: ["video_id"]
            referencedRelation: "videos"
            referencedColumns: ["id"]
          }
        ]
      },
      notifications: {
        Row: {
          id: number
          user_id: string
          actor_id: string | null
          type: string
          resource_id: string | null
          resource_type: string | null
          content: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          actor_id?: string | null
          type: string
          resource_id?: string | null
          resource_type?: string | null
          content?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          actor_id?: string | null
          type?: string
          resource_id?: string | null
          resource_type?: string | null
          content?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            referencedRelation: "users"
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
