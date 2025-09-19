export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          status: 'online' | 'offline' | 'away'
          user_level: 'super_admin' | 'admin' | 'manager' | 'member' | 'guest' | 'banned'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          status?: 'online' | 'offline' | 'away'
          user_level?: 'super_admin' | 'admin' | 'manager' | 'member' | 'guest' | 'banned'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          status?: 'online' | 'offline' | 'away'
          user_level?: 'super_admin' | 'admin' | 'manager' | 'member' | 'guest' | 'banned'
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          workspace_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean
          workspace_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          workspace_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      channel_members: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          type: 'text' | 'image' | 'code' | 'link'
          author_id: string
          channel_id: string | null
          dm_id: string | null
          attachment_name: string | null
          attachment_url: string | null
          data_ai_hint: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          type?: 'text' | 'image' | 'code' | 'link'
          author_id: string
          channel_id?: string | null
          dm_id?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          data_ai_hint?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          type?: 'text' | 'image' | 'code' | 'link'
          author_id?: string
          channel_id?: string | null
          dm_id?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          data_ai_hint?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      direct_messages: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      threads: {
        Row: {
          id: string
          original_message_id: string
          created_at: string
        }
        Insert: {
          id?: string
          original_message_id: string
          created_at?: string
        }
        Update: {
          id?: string
          original_message_id?: string
          created_at?: string
        }
      }
      thread_messages: {
        Row: {
          id: string
          thread_id: string
          message_id: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          message_id: string
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          message_id?: string
          created_at?: string
        }
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
  }
}
