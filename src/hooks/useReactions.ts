import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ReactionState {
  liked: boolean;
  disliked: boolean;
  bookmarked: boolean;
  likes: number;
  dislikes: number;
  bookmarks: number;
  views: number;
  shares: number;
}

export const useReactions = (postId: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<ReactionState>({
    liked: false,
    disliked: false,
    bookmarked: false,
    likes: 0,
    dislikes: 0,
    bookmarks: 0,
    views: 0,
    shares: 0
  });
  const [loading, setLoading] = useState(false);

  // Throttling для предотвращения спама
  const [lastAction, setLastAction] = useState(0);
  const THROTTLE_DELAY = 300;

  const throttle = useCallback(() => {
    const now = Date.now();
    if (now - lastAction < THROTTLE_DELAY) {
      return false;
    }
    setLastAction(now);
    return true;
  }, [lastAction]);

  const updateReaction = useCallback(async (
    type: 'like' | 'dislike' | 'bookmark' | 'share',
    optimisticUpdate: Partial<ReactionState>
  ) => {
    if (!user) {
      toast.error('Необходимо войти в систему');
      return;
    }

    if (!throttle()) {
      return;
    }

    // Optimistic UI update
    setState(prev => ({ ...prev, ...optimisticUpdate }));
    setLoading(true);

    try {
      if (type === 'like' || type === 'dislike') {
        // Проверяем существующую реакцию
        const { data: existing } = await supabase
          .from('signals')
          .select('type')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .in('type', ['like', 'dislike'])
          .maybeSingle();

        if (existing) {
          if (existing.type === type) {
            // Убираем реакцию
            await supabase
              .from('signals')
              .delete()
              .eq('post_id', postId)
              .eq('user_id', user.id)
              .eq('type', type);
          } else {
            // Меняем реакцию
            await supabase
              .from('signals')
              .update({ type })
              .eq('post_id', postId)
              .eq('user_id', user.id)
              .eq('type', existing.type);
          }
        } else {
          // Добавляем новую реакцию
          await supabase
            .from('signals')
            .insert({
              post_id: postId,
              user_id: user.id,
              type,
              value: 1
            });
        }
      } else if (type === 'bookmark') {
        // Переключаем закладку
        const { data: existing } = await supabase
          .from('signals')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('type', 'bookmark')
          .maybeSingle();

        if (existing) {
          await supabase
            .from('signals')
            .delete()
            .eq('id', existing.id);
        } else {
          await supabase
            .from('signals')
            .insert({
              post_id: postId,
              user_id: user.id,
              type: 'bookmark',
              value: 1
            });
        }
      } else if (type === 'share') {
        // Добавляем сигнал шеринга
        await supabase
          .from('signals')
          .insert({
            post_id: postId,
            user_id: user.id,
            type: 'share',
            value: 1
          });

        // Копируем ссылку в буфер обмена
        const url = `${window.location.origin}/p/${postId}`;
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована в буфер обмена');
      }

      // Обновляем статистику
      await loadStats();

    } catch (error: any) {
      console.error('Reaction error:', error);
      toast.error('Ошибка при выполнении действия');
      
      // Откатываем optimistic update
      const rollback: Partial<ReactionState> = {};
      Object.keys(optimisticUpdate).forEach(key => {
        const k = key as keyof ReactionState;
        if (typeof state[k] === 'boolean') {
          (rollback as any)[k] = !(optimisticUpdate as any)[k];
        } else if (typeof state[k] === 'number') {
          const currentValue = state[k] as number;
          const change = ((optimisticUpdate as any)[k] as number) - currentValue;
          (rollback as any)[k] = currentValue - change;
        }
      });
      setState(prev => ({ ...prev, ...rollback }));
    } finally {
      setLoading(false);
    }
  }, [user, postId, throttle, state]);

  const like = useCallback(() => {
    const newLiked = !state.liked;
    const likeDelta = newLiked ? 1 : -1;
    const dislikeDelta = state.disliked ? -1 : 0;
    
    updateReaction('like', {
      liked: newLiked,
      disliked: false,
      likes: state.likes + likeDelta,
      dislikes: state.dislikes + dislikeDelta
    });
  }, [state, updateReaction]);

  const dislike = useCallback(() => {
    const newDisliked = !state.disliked;
    const dislikeDelta = newDisliked ? 1 : -1;
    const likeDelta = state.liked ? -1 : 0;
    
    updateReaction('dislike', {
      disliked: newDisliked,
      liked: false,
      dislikes: state.dislikes + dislikeDelta,
      likes: state.likes + likeDelta
    });
  }, [state, updateReaction]);

  const bookmark = useCallback(() => {
    const newBookmarked = !state.bookmarked;
    const bookmarkDelta = newBookmarked ? 1 : -1;
    
    updateReaction('bookmark', {
      bookmarked: newBookmarked,
      bookmarks: state.bookmarks + bookmarkDelta
    });
  }, [state, updateReaction]);

  const share = useCallback(() => {
    updateReaction('share', {
      shares: state.shares + 1
    });
  }, [state, updateReaction]);

  const loadStats = useCallback(async () => {
    try {
      // Загружаем статистику
      const { data: stats } = await supabase
        .from('signals')
        .select('type, value')
        .eq('post_id', postId);

      const counts = {
        likes: 0,
        dislikes: 0,
        bookmarks: 0,
        views: 0,
        shares: 0
      };

      stats?.forEach(signal => {
        if (signal.type in counts) {
          counts[signal.type as keyof typeof counts] += signal.value || 1;
        }
      });

      // Загружаем пользовательские реакции
      let userReactions = { liked: false, disliked: false, bookmarked: false };
      
      if (user) {
        const { data: userSignals } = await supabase
          .from('signals')
          .select('type')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .in('type', ['like', 'dislike', 'bookmark']);

        userSignals?.forEach(signal => {
          if (signal.type === 'like') userReactions.liked = true;
          if (signal.type === 'dislike') userReactions.disliked = true;
          if (signal.type === 'bookmark') userReactions.bookmarked = true;
        });
      }

      setState({
        ...counts,
        ...userReactions
      });

    } catch (error) {
      console.error('Stats load error:', error);
    }
  }, [postId, user]);

  return {
    ...state,
    loading,
    like,
    dislike,
    bookmark,
    share,
    loadStats
  };
};