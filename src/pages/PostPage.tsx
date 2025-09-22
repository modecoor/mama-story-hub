import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Post, ExtendedPost, Comment } from '@/types';
import { useSignals } from '@/hooks/useSignals';
import { PostActions } from '@/components/PostActions';
import { CommentForm } from '@/components/CommentForm';
import { CommentsList } from '@/components/CommentsList';
import { SafeHtmlRenderer } from '@/components/SafeHtmlRenderer';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Eye,
  Clock,
  User,
  ArrowLeft,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ChevronRight,
  Home
} from 'lucide-react';

const PostPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { sendSignal } = useSignals();
  
  const [post, setPost] = useState<ExtendedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReactions, setUserReactions] = useState<{
    liked: boolean;
    disliked: boolean;
    bookmarked: boolean;
  }>({
    liked: false,
    disliked: false,
    bookmarked: false
  });

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug, user]);

  useEffect(() => {
    // Записываем просмотр поста
    if (post && post.id) {
      recordView();
    }
  }, [post?.id]);

  const recordView = async () => {
    if (post) {
      await sendSignal(post.id, 'view');
    }
  };

  const fetchPost = async () => {
    try {
      setLoading(true);

      // Получаем основные данные поста
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username, avatar_url),
          categories:category_id (title, slug),
          post_tags (
            tags (title, slug)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postError) throw postError;

      // Получаем статистику сигналов
      const { data: signalsData } = await supabase
        .from('signals')
        .select('type')
        .eq('post_id', postData.id);

      const signalsCounts = signalsData?.reduce((acc, signal) => {
        acc[`${signal.type}_count`] = (acc[`${signal.type}_count`] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Получаем комментарии
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('post_id', postData.id)
        .eq('status', 'visible')
        .order('created_at', { ascending: true });

      // Получаем реакции пользователя
      if (user) {
        const { data: userSignals } = await supabase
          .from('signals')
          .select('type')
          .eq('post_id', postData.id)
          .eq('user_id', user.id);

        const reactions = userSignals?.reduce((acc, signal) => {
          if (signal.type === 'like') acc.liked = true;
          if (signal.type === 'dislike') acc.disliked = true;
          if (signal.type === 'bookmark') acc.bookmarked = true;
          return acc;
        }, { liked: false, disliked: false, bookmarked: false }) || { liked: false, disliked: false, bookmarked: false };

        setUserReactions(reactions);
      }

      // Получаем похожие посты
      fetchRelatedPosts(postData.category_id, postData.id);

      setPost({ ...postData, ...signalsCounts } as ExtendedPost);
      setComments((commentsData || []) as Comment[]);
    } catch (error) {
      console.error('Ошибка загрузки поста:', error);
      toast({
        title: 'Ошибка',
        description: 'Пост не найден или недоступен',
        variant: 'destructive'
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (categoryId: string, currentPostId: string) => {
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username, avatar_url),
          categories:category_id (title, slug)
        `)
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .neq('id', currentPostId)
        .limit(3);

      setRelatedPosts((data || []) as Post[]);
    } catch (error) {
      console.error('Ошибка загрузки похожих постов:', error);
    }
  };

  const handleReaction = async (type: 'like' | 'dislike' | 'bookmark') => {
    if (!user || !post) {
      toast({
        title: 'Войдите в аккаунт',
        description: 'Чтобы ставить лайки и сохранять посты, необходимо войти в систему',
        variant: 'destructive'
      });
      return;
    }

    try {
      const isCurrentlyActive = userReactions[type === 'like' ? 'liked' : type === 'dislike' ? 'disliked' : 'bookmarked'];

      if (isCurrentlyActive) {
        // Убираем реакцию
        await supabase
          .from('signals')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('type', type);
      } else {
        // Для лайков/дизлайков - убираем противоположную реакцию
        if (type === 'like' && userReactions.disliked) {
          await supabase
            .from('signals')
            .delete()
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .eq('type', 'dislike');
        } else if (type === 'dislike' && userReactions.liked) {
          await supabase
            .from('signals')
            .delete()
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .eq('type', 'like');
        }

        // Добавляем новую реакцию
        await supabase.from('signals').insert({
          post_id: post.id,
          user_id: user.id,
          type,
          value: 1
        });
      }

      // Обновляем состояние реакций
      setUserReactions(prev => ({
        ...prev,
        liked: type === 'like' ? !isCurrentlyActive : type === 'dislike' ? false : prev.liked,
        disliked: type === 'dislike' ? !isCurrentlyActive : type === 'like' ? false : prev.disliked,
        bookmarked: type === 'bookmark' ? !isCurrentlyActive : prev.bookmarked
      }));

      // Обновляем счетчики
      fetchPost();

      if (type === 'bookmark') {
        toast({
          title: isCurrentlyActive ? 'Удалено из закладок' : 'Добавлено в закладки',
          description: isCurrentlyActive ? 'Пост убран из ваших закладок' : 'Пост сохранен в закладках'
        });
      }
    } catch (error) {
      console.error('Ошибка обработки реакции:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обработать действие',
        variant: 'destructive'
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.subtitle || post?.tldr,
          url: url
        });
        
        // Записываем сигнал шаринга
        if (post) {
          await supabase.from('signals').insert({
            post_id: post.id,
            user_id: user?.id || null,
            type: 'share',
            value: 1
          });
        }
      } catch (error) {
        console.error('Ошибка шаринга:', error);
      }
    } else {
      // Fallback - копируем ссылку
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Ссылка скопирована',
          description: 'Ссылка на пост скопирована в буфер обмена'
        });
      } catch (error) {
        console.error('Ошибка копирования:', error);
      }
    }
  };

  const handleReport = async () => {
    if (!user || !post) return;

    try {
      await supabase.from('reports').insert({
        post_id: post.id,
        user_id: user.id,
        reason: 'Пользователь пожаловался на пост'
      });

      toast({
        title: 'Жалоба отправлена',
        description: 'Модераторы рассмотрят вашу жалобу в ближайшее время'
      });
    } catch (error) {
      console.error('Ошибка отправки жалобы:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить жалобу',
        variant: 'destructive'
      });
    }
  };

  const getTypeLabel = (type: Post['type']) => {
    switch (type) {
      case 'story': return 'История';
      case 'question': return 'Вопрос';
      case 'article': return 'Статья';
      default: return 'Пост';
    }
  };

  const getTypeColor = (type: Post['type']) => {
    switch (type) {
      case 'story': return 'bg-secondary text-secondary-foreground';
      case 'question': return 'bg-primary text-primary-foreground';
      case 'article': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Пост не найден</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            На главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Хлебные крошки */}
        <nav className="flex items-center space-x-2 text-sm mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {post.categories && (
            <>
              <Link 
                to={`/c/${post.categories.slug}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {post.categories.title}
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-xs">
            {post.title}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Основной контент */}
          <div className="lg:col-span-2">
            <article className="space-y-6">
              {/* Заголовок и мета */}
              <Card className="card-soft">
                {post.cover_image_url && (
                  <div className="relative h-64 md:h-80 overflow-hidden rounded-t-2xl">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                    <Badge 
                      className={`absolute top-4 left-4 ${getTypeColor(post.type)}`}
                    >
                      {getTypeLabel(post.type)}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="space-y-4">
                  {!post.cover_image_url && (
                    <Badge className={`w-fit ${getTypeColor(post.type)}`}>
                      {getTypeLabel(post.type)}
                    </Badge>
                  )}
                  
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                    {post.title}
                  </h1>
                  
                  {post.subtitle && (
                    <p className="text-xl text-muted-foreground">
                      {post.subtitle}
                    </p>
                  )}
                  
                  {/* Автор и время */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {post.profiles?.username || 'Аноним'}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(post.published_at || post.created_at), { 
                            addSuffix: true, 
                            locale: ru 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Статистика */}
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.view_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comment_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Краткое содержание */}
              {post.tldr && (
                <Card className="card-soft bg-accent/20">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Кратко
                    </h3>
                    <p className="text-accent-foreground">{post.tldr}</p>
                  </CardContent>
                </Card>
              )}

              {/* Основной контент */}
              <Card className="card-soft">
                <CardContent className="pt-6">
                  <SafeHtmlRenderer
                    html={post.content_html || ''}
                    className={`content-prose ${!user ? 'content-protected no-context-menu' : 'content-protected authenticated'}`}
                  />
                </CardContent>
              </Card>

              {/* Теги */}
              {post.post_tags && post.post_tags.length > 0 && (
                <Card className="card-soft">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Теги</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.post_tags.map((tagRelation, index) => (
                        <Link
                          key={index}
                          to={`/t/${tagRelation.tags.slug}`}
                        >
                          <Badge variant="outline" className="hover:bg-accent transition-colors">
                            #{tagRelation.tags.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Реакции и действия */}
              <Card className="card-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {user ? (
                        <>
                          <Button
                            variant={userReactions.liked ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleReaction('like')}
                            className="flex items-center space-x-1"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{post.like_count || 0}</span>
                          </Button>
                          
                          <Button
                            variant={userReactions.disliked ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleReaction('dislike')}
                            className="flex items-center space-x-1"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>{post.dislike_count || 0}</span>
                          </Button>
                          
                          <Button
                            variant={userReactions.bookmarked ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleReaction('bookmark')}
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Войдите, чтобы голосовать и сохранять посты
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      
                      {user && (
                        <Button variant="outline" size="sm" onClick={handleReport}>
                          <Flag className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Комментарии */}
              <Card className="card-soft">
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Комментарии ({comments.length})
                  </h2>
                </CardHeader>
                <CardContent>
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border-l-2 border-muted pl-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {comment.profiles?.username || 'Аноним'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { 
                                addSuffix: true, 
                                locale: ru 
                              })}
                            </span>
                          </div>
                          <SafeHtmlRenderer
                            html={comment.content_html}
                            className="text-sm content-prose"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Комментариев пока нет. Будьте первым!
                    </p>
                  )}
                </CardContent>
              </Card>
            </article>
          </div>

          {/* Боковая панель */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Похожие посты */}
              {relatedPosts.length > 0 && (
                <Card className="card-soft">
                  <CardHeader>
                    <h3 className="font-semibold">Похожие посты</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link
                        key={relatedPost.id}
                        to={`/p/${relatedPost.slug}`}
                        className="block group"
                      >
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {relatedPost.title}
                          </h4>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4 mr-2">
                              <AvatarImage src={relatedPost.profiles?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                <User className="h-2 w-2" />
                              </AvatarFallback>
                            </Avatar>
                            <span>{relatedPost.profiles?.username || 'Аноним'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
              
              {/* Категория */}
              {post.categories && (
                <Card className="card-soft">
                  <CardHeader>
                    <h3 className="font-semibold">Категория</h3>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/c/${post.categories.slug}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary-hover">
                        {post.categories.title}
                      </Badge>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;