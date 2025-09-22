import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type SignalType = 'like' | 'dislike' | 'bookmark' | 'view' | 'share';

export const useSignals = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendSignal = async (postId: string, type: SignalType, value: number = 1) => {
    if (!user && type !== 'view') {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в аккаунт для выполнения этого действия',
        variant: 'destructive'
      });
      return false;
    }

    setLoading(true);

    try {
      // Для лайков и дизлайков проверяем, есть ли уже сигнал
      if (type === 'like' || type === 'dislike') {
        const { data: existingSignal } = await supabase
          .from('signals')
          .select('id, type')
          .eq('post_id', postId)
          .eq('user_id', user?.id)
          .in('type', ['like', 'dislike'])
          .single();

        if (existingSignal) {
          if (existingSignal.type === type) {
            // Удаляем сигнал если нажали на тот же тип
            await supabase
              .from('signals')
              .delete()
              .eq('id', existingSignal.id);

            toast({
              title: type === 'like' ? 'Лайк убран' : 'Дизлайк убран',
            });
            return true;
          } else {
            // Обновляем тип сигнала
            await supabase
              .from('signals')
              .update({ type, value })
              .eq('id', existingSignal.id);

            toast({
              title: type === 'like' ? 'Поставлен лайк' : 'Поставлен дизлайк',
            });
            return true;
          }
        }
      }

      // Для закладок проверяем существование
      if (type === 'bookmark') {
        const { data: existingBookmark } = await supabase
          .from('signals')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user?.id)
          .eq('type', 'bookmark')
          .single();

        if (existingBookmark) {
          await supabase
            .from('signals')
            .delete()
            .eq('id', existingBookmark.id);

          toast({
            title: 'Удалено из закладок',
          });
          return true;
        }
      }

      // Создаем новый сигнал
      const { error } = await supabase
        .from('signals')
        .insert({
          post_id: postId,
          user_id: user?.id || null,
          type,
          value,
          meta: {}
        });

      if (error) throw error;

      const messages = {
        like: 'Поставлен лайк',
        dislike: 'Поставлен дизлайк',
        bookmark: 'Добавлено в закладки',
        view: 'Просмотр засчитан',
        share: 'Поделились постом'
      };

      if (type !== 'view') {
        toast({
          title: messages[type],
        });
      }

      return true;
    } catch (error: any) {
      console.error('Ошибка отправки сигнала:', error);
      
      if (type !== 'view') {
        toast({
          title: 'Ошибка',
          description: 'Не удалось выполнить действие',
          variant: 'destructive'
        });
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getSignalCounts = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('signals')
        .select('type, value')
        .eq('post_id', postId);

      if (error) throw error;

      const counts = {
        likes: 0,
        dislikes: 0,
        bookmarks: 0,
        views: 0,
        shares: 0
      };

      data?.forEach(signal => {
        switch (signal.type) {
          case 'like':
            counts.likes += signal.value || 1;
            break;
          case 'dislike':
            counts.dislikes += signal.value || 1;
            break;
          case 'bookmark':
            counts.bookmarks += signal.value || 1;
            break;
          case 'view':
            counts.views += signal.value || 1;
            break;
          case 'share':
            counts.shares += signal.value || 1;
            break;
        }
      });

      return counts;
    } catch (error) {
      console.error('Ошибка получения счетчиков:', error);
      return {
        likes: 0,
        dislikes: 0,
        bookmarks: 0,
        views: 0,
        shares: 0
      };
    }
  };

  const getUserSignals = async (postId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('signals')
        .select('type')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      return {
        liked: data?.some(s => s.type === 'like') || false,
        disliked: data?.some(s => s.type === 'dislike') || false,
        bookmarked: data?.some(s => s.type === 'bookmark') || false
      };
    } catch (error) {
      console.error('Ошибка получения пользовательских сигналов:', error);
      return null;
    }
  };

  return {
    sendSignal,
    getSignalCounts,
    getUserSignals,
    loading
  };
};