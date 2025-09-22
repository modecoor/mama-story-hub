import { useState, useEffect } from 'react';
import { Post, Category } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { usePagination } from './usePagination';

export interface UsePostsOptions {
  mode?: 'for-you' | 'popular' | 'new' | 'category' | 'author' | 'tag';
  categoryId?: string;
  categorySlug?: string;
  authorId?: string;
  tagSlug?: string;
  status?: 'draft' | 'pending' | 'published';
  type?: 'article' | 'story' | 'question';
  limit?: number;
  search?: string;
}

export const usePosts = (options: UsePostsOptions = {}) => {
  const {
    mode = 'new',
    categoryId,
    categorySlug,
    authorId,
    tagSlug,
    status,
    type,
    limit = 10,
    search
  } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const pagination = usePagination(limit);

  const fetchPosts = async (reset = false) => {
    try {
      setLoading(true);
      setError('');

      if (reset) {
        pagination.reset();
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
      if (status) {
        query = query.eq('status', status);
      } else {
        query = query.eq('status', 'published');
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content_html.ilike.%${search}%`);
      }

      // Фильтр по категории через slug
      if (categorySlug) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      // Фильтр по тегу
      if (tagSlug) {
        const { data: tag } = await supabase
          .from('tags')
          .select('id')
          .eq('slug', tagSlug)
          .single();
        
        if (tag) {
          const { data: postTags } = await supabase
            .from('post_tags')
            .select('post_id')
            .eq('tag_id', tag.id);
          
          if (postTags && postTags.length > 0) {
            const postIds = postTags.map(pt => pt.post_id);
            query = query.in('id', postIds);
          } else {
            // Если тегов нет, возвращаем пустой массив
            setPosts([]);
            pagination.updatePagination(0, false);
            return;
          }
        }
      }

      // Сортировка
      switch (mode) {
        case 'new':
          query = query.order('published_at', { ascending: false, nullsFirst: false })
                      .order('created_at', { ascending: false });
          break;
        case 'popular':
          // Сортировка по популярности - можно добавить подсчет сигналов
          query = query.order('published_at', { ascending: false, nullsFirst: false });
          break;
        case 'for-you':
          // Для персонализированной ленты - пока что по дате
          query = query.order('published_at', { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Пагинация
      const from = pagination.getOffset();
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      const newPosts = data as Post[] || [];
      
      if (reset || pagination.page === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      const totalCount = count || 0;
      const hasMore = (from + newPosts.length) < totalCount;
      
      pagination.updatePagination(totalCount, hasMore);

    } catch (err: any) {
      console.error('Ошибка загрузки постов:', err);
      setError(err.message || 'Не удалось загрузить посты');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!loading && pagination.hasMore) {
      pagination.nextPage();
    }
  };

  const refresh = async () => {
    await fetchPosts(true);
  };

  useEffect(() => {
    fetchPosts();
  }, [
    mode,
    categoryId,
    categorySlug,
    authorId,
    tagSlug,
    status,
    type,
    search,
    pagination.page
  ]);

  return {
    posts,
    loading,
    error,
    hasMore: pagination.hasMore,
    loadMore,
    refresh,
    pagination: pagination.pagination,
    totalPages: pagination.getTotalPages()
  };
};