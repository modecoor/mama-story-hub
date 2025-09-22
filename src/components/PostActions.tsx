import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSignals } from '@/hooks/useSignals';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Share2, Bookmark, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostActionsProps {
  postId: string;
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  showCounts?: boolean;
  className?: string;
}

export const PostActions: React.FC<PostActionsProps> = ({
  postId,
  onLike,
  onBookmark,
  onShare,
  showCounts = true,
  className
}) => {
  const { user } = useAuth();
  const { sendSignal, getSignalCounts, getUserSignals, loading } = useSignals();
  
  const [counts, setCounts] = useState({
    likes: 0,
    dislikes: 0,
    bookmarks: 0,
    views: 0,
    shares: 0
  });
  
  const [userSignals, setUserSignals] = useState({
    liked: false,
    disliked: false,
    bookmarked: false
  });

  // Загружаем счетчики и пользовательские сигналы
  useEffect(() => {
    const loadData = async () => {
      const [signalCounts, userSigs] = await Promise.all([
        getSignalCounts(postId),
        getUserSignals(postId)
      ]);
      
      setCounts(signalCounts);
      if (userSigs) {
        setUserSignals(userSigs);
      }
    };

    loadData();
  }, [postId, user?.id]);

  const handleLike = async () => {
    const success = await sendSignal(postId, 'like');
    if (success) {
      // Обновляем локальное состояние
      setUserSignals(prev => ({ ...prev, liked: !prev.liked }));
      setCounts(prev => ({ 
        ...prev, 
        likes: prev.likes + (userSignals.liked ? -1 : 1) 
      }));
      onLike?.();
    }
  };

  const handleBookmark = async () => {
    const success = await sendSignal(postId, 'bookmark');
    if (success) {
      setUserSignals(prev => ({ ...prev, bookmarked: !prev.bookmarked }));
      setCounts(prev => ({ 
        ...prev, 
        bookmarks: prev.bookmarks + (userSignals.bookmarked ? -1 : 1) 
      }));
      onBookmark?.();
    }
  };

  const handleShare = async () => {
    await sendSignal(postId, 'share');
    setCounts(prev => ({ ...prev, shares: prev.shares + 1 }));
    
    // Копируем ссылку в буфер обмена
    const link = `${window.location.origin}/p/${postId}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (err) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    
    onShare?.();
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center space-x-4">
        {/* Лайк */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loading}
            className={cn(
              "h-8 px-2 text-muted-foreground hover:text-foreground",
              userSignals.liked && "text-red-500 hover:text-red-600"
            )}
          >
            <Heart className={cn("h-4 w-4", userSignals.liked && "fill-current")} />
          </Button>
          {showCounts && counts.likes > 0 && (
            <span className="text-sm text-muted-foreground">{counts.likes}</span>
          )}
        </div>

        {/* Комментарии */}
        <div className="flex items-center space-x-1">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          {showCounts && (
            <span className="text-sm text-muted-foreground">0</span>
          )}
        </div>

        {/* Просмотры */}
        {showCounts && counts.views > 0 && (
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{counts.views}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Закладки */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          disabled={loading}
          className={cn(
            "h-8 px-2 text-muted-foreground hover:text-foreground",
            userSignals.bookmarked && "text-blue-500 hover:text-blue-600"
          )}
        >
          <Bookmark className={cn("h-4 w-4", userSignals.bookmarked && "fill-current")} />
        </Button>

        {/* Поделиться */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          disabled={loading}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};