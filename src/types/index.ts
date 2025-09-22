export interface Category {
  id: string;
  title: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface Tag {
  id: string;
  title: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  role: string;
  interests?: string[];
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  content_html?: string;
  tldr?: string;
  cover_image_url?: string;
  author_id: string;
  category_id?: string;
  status: 'draft' | 'pending' | 'published';
  type: 'article' | 'question' | 'story';
  seo_title?: string;
  seo_description?: string;
  focus_keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  
  // Связанные данные
  profiles?: Profile;
  categories?: Category;
  post_tags?: { tags: Tag }[];
}

export interface Comment {
  id: number;
  content_html: string;
  post_id: string;
  user_id?: string;
  parent_id?: number;
  status: 'visible' | 'hidden' | 'pending';
  created_at: string;
  
  // Связанные данные
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
}

export interface Signal {
  id: number;
  type: 'view' | 'like' | 'dislike' | 'bookmark' | 'share';
  post_id: string;
  user_id?: string;
  value?: number;
  meta?: any;
  created_at: string;
}

export interface ExtendedPost extends Post {
  view_count?: number;
  like_count?: number;
  dislike_count?: number;
  bookmark_count?: number;
  comment_count?: number;
}

export interface Report {
  id: number;
  reason: string;
  post_id?: string;
  comment_id?: number;
  user_id?: string;
  status: 'new' | 'reviewed' | 'dismissed';
  created_at: string;
}