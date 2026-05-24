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
      families: {
        Row: { id: string; name: string; invite_code: string; created_at: string };
        Insert: { id?: string; name: string; invite_code: string; created_at?: string };
        Update: { id?: string; name?: string; invite_code?: string; created_at?: string };
      };
      profiles: {
        Row: {
          id: string;
          family_id: string | null;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          family_id?: string | null;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          description: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
        };
      };
      task_completions: {
        Row: {
          id: string;
          task_id: string;
          completed_by: string;
          completed_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          task_id: string;
          completed_by: string;
          completed_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          task_id?: string;
          completed_by?: string;
          completed_at?: string;
          notes?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Family = Database["public"]["Tables"]["families"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskCompletion = Database["public"]["Tables"]["task_completions"]["Row"];
