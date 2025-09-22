import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Post {
  id: string;
  type: 'article' | 'story' | 'question';
  slug: string;
  title: string;
  subtitle?: string;
  cover_image_url?: string;
  content_html?: string;
  tldr?: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  published_at?: string;
  author_id: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  // Связанные данные
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
  categories?: {
    title: string;
    slug: string;
  };
  post_tags?: {
    tags: {
      title: string;
      slug: string;
    };
  }[];
  _count?: {
    comments: number;
    signals: number;
  };
}

export interface UsePostsOptions {
  status?: Post['status'];
  type?: Post['type'];
  categoryId?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
  mode?: 'for-you' | 'popular' | 'new';
}

export const usePosts = (options: UsePostsOptions = {}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPosts([]);
      }

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username, avatar_url),
          categories:category_id (title, slug),
          post_tags (
            tags (title, slug)
          )
        `);

      // Фильтры
      if (options.status) {
        query = query.eq('status', options.status);
      } else {
        // По умолчанию показываем только опубликованные
        query = query.eq('status', 'published');
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options.authorId) {
        query = query.eq('author_id', options.authorId);
      }

      // Сортировка
      switch (options.mode) {
        case 'new':
          query = query.order('published_at', { ascending: false });
          break;
        case 'popular':
          // TODO: реализовать сортировку по популярности с учетом сигналов
          query = query.order('published_at', { ascending: false });
          break;
        case 'for-you':
        default:
          query = query.order('published_at', { ascending: false });
          break;
      }

      // Пагинация
      const limit = options.limit || 20;
      const offset = reset ? 0 : (options.offset || posts.length);
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      const newPosts = (data || []) as Post[];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки постов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, [options.status, options.type, options.categoryId, options.authorId, options.mode]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(false);
    }
  };

  const refresh = () => {
    fetchPosts(true);
  };

  return { 
    posts, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  };
};