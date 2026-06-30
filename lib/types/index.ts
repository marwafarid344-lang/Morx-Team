// API Response type for consistent response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  limitReached?: boolean;
}

// Plan type for subscription tiers
export type PlanType = 'free' | 'starter' | 'professional' | 'enterprise';

// User type - uses auth_user_id (UUID) as primary identifier
export interface User {
  auth_user_id: string;  // UUID from Supabase Auth - PRIMARY identifier
  first_name?: string;
  last_name?: string;
  email: string;
  profile_image?: string;
  plan?: PlanType;  // Subscription plan tier
  study_level?: number | null;
  department?: string | null;
  faculty?: string | null;
  governorate?: string | null;
  bio?: string | null;
  skills?: any | null;
  is_available?: boolean;
  skip_tutorial?: boolean;
  searching_teams_subjects?: string[] | null;  // Subjects user is looking for teams in
  links?: {
    github?: string;
    linkedin?: string;
    facebook?: string;
    whatsapp?: string;
  } | null;
  created_at?: string;
}

// Team type
export interface Team {
  team_id: string;  // UUID
  team_name: string;
  team_url: string;
  created_at?: string;
  auth_user_id: string;  // UUID of the creator
  description?: string;
}

// Project type
export interface Project {
  project_id: string;  // UUID
  project_name: string;
  project_url?: string;
  description?: string;
  team_id: string;  // UUID
  auth_user_id: string;  // UUID of the creator
  created_at?: string;
}

// Task type
export interface Task {
  task_id: string;  // UUID
  title: string;
  description?: string;
  status: number; // 0=todo, 1=in-progress, 2=done
  priority?: number;
  due_date?: string;
  project_id: string;  // UUID
  auth_user_id: string;  // UUID of the creator
  likes?: number;
}

// Notification type
export interface Notification {
  notification_id: number;  // Still BIGINT - not changed
  auth_user_id: string;  // Target UUID
  title: string;
  message: string;
  type?: string;         // Notification category (e.g., 'task_due', 'team_added', etc.)
  related_id?: string;   // UUID of related entity (e.g., task_id, team_id)
  is_read: boolean;      // Notification read status
  created_at?: string;
}
// Auth Request types
export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  profile_image?: string;
  study_level?: number | null;
  department?: string | null;
}

export interface CreateCommentRequest {
  comment_text: string;
  task_id: string;
}
