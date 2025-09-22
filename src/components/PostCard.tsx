import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Post } from '@/types';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Eye,
  Clock,
  User
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onShare?: (postId: string) => void;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onBookmark, 
  onShare,
  className = '' 
}) => {
  const { user } = useAuth();

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

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ru 
    });
  };

  const truncateContent = (html?: string, maxLength = 150) => {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Card className={`card-soft transition-smooth ${className}`}>
      {/* Обложка */}
      {post.cover_image_url && (
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <Badge 
            className={`absolute top-3 left-3 ${getTypeColor(post.type)}`}
          >
            {getTypeLabel(post.type)}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        {/* Мета информация */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback className="text-xs">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span>{post.profiles?.username || 'Аноним'}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>
        </div>

        {/* Заголовок */}
        <Link 
          to={`/p/${post.slug}`}
          className="group"
        >
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        {/* Подзаголовок */}
        {post.subtitle && (
          <p className="text-muted-foreground text-sm line-clamp-1">
            {post.subtitle}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Краткое содержание */}
        {post.tldr && (
          <div className="bg-accent/30 rounded-lg p-3 mb-3">
            <p className="text-sm font-medium text-accent-foreground">
              Кратко: {post.tldr}
            </p>
          </div>
        )}

        {/* Превью контента */}
        {post.content_html && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {truncateContent(post.content_html)}
          </p>
        )}

        {/* Теги */}
        {post.post_tags && post.post_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.post_tags.slice(0, 3).map((tagRelation, index) => (
              <Link
                key={index}
                to={`/t/${tagRelation.tags.slug}`}
                className="text-xs text-primary hover:underline"
              >
                #{tagRelation.tags.title}
              </Link>
            ))}
            {post.post_tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{post.post_tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Категория */}
        {post.categories && (
          <Link
            to={`/c/${post.categories.slug}`}
            className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mt-2"
          >
            {post.categories.title}
          </Link>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          {/* Статистика */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>0</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>0</span>
            </div>
          </div>

          {/* Действия */}
          <div className="flex items-center space-x-1">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike?.(post.id)}
                  className="h-8 w-8 p-0 hover:text-red-500"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBookmark?.(post.id)}
                  className="h-8 w-8 p-0 hover:text-blue-500"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare?.(post.id)}
                  className="h-8 w-8 p-0 hover:text-green-500"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">
                Войдите для взаимодействия
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};