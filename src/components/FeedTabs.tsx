import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from './PostCard';
import { LoadMoreButton } from './Pagination';
import { usePosts } from '@/hooks/usePosts';
import { useSignals } from '@/hooks/useSignals';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export const FeedTabs = () => {
  const { user } = useAuth();
  const { sendSignal } = useSignals();
  
  const forYouPosts = usePosts({ mode: 'for-you', limit: 10 });
  const popularPosts = usePosts({ mode: 'popular', limit: 10 });
  const newPosts = usePosts({ mode: 'new', limit: 10 });

  const handleLike = async (postId: string) => {
    await sendSignal(postId, 'like');
    // Refresh posts after action
    forYouPosts.refresh();
    popularPosts.refresh();
    newPosts.refresh();
  };

  const handleBookmark = async (postId: string) => {
    await sendSignal(postId, 'bookmark');
  };

  const handleShare = async (postId: string) => {
    await sendSignal(postId, 'share');
    
    // Copy link to clipboard
    const link = `${window.location.origin}/p/${postId}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const PostsList = ({ 
    posts, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  }: ReturnType<typeof usePosts>) => {
    if (loading && posts.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ошибка загрузки: {error}</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </Button>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Постов пока нет</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <Button 
              onClick={loadMore} 
              variant="outline" 
              disabled={loading}
              className="min-w-32"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                'Загрузить ещё'
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Tabs defaultValue="for-you" className="w-full">
      <TabsList className="grid w-full grid-cols-3 lg:w-96 mx-auto mb-8">
        <TabsTrigger value="for-you" className="transition-smooth">
          {user ? 'Для вас' : 'Рекомендуемое'}
        </TabsTrigger>
        <TabsTrigger value="popular" className="transition-smooth">
          Популярное
        </TabsTrigger>
        <TabsTrigger value="new" className="transition-smooth">
          Свежие
        </TabsTrigger>
      </TabsList>

      <TabsContent value="for-you" className="mt-0">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            {user ? 'Подобрано для вас' : 'Рекомендуемые посты'}
          </h2>
          <p className="text-muted-foreground">
            {user 
              ? 'Посты по вашим интересам и активности' 
              : 'Лучшие посты нашего сообщества'
            }
          </p>
        </div>
        <PostsList {...forYouPosts} />
      </TabsContent>

      <TabsContent value="popular" className="mt-0">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">Популярные посты</h2>
          <p className="text-muted-foreground">
            Самые обсуждаемые и интересные материалы
          </p>
        </div>
        <PostsList {...popularPosts} />
      </TabsContent>

      <TabsContent value="new" className="mt-0">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">Свежие публикации</h2>
          <p className="text-muted-foreground">
            Последние истории и вопросы от участниц сообщества
          </p>
        </div>
        <PostsList {...newPosts} />
      </TabsContent>
    </Tabs>
  );
};