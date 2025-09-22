import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Post } from '@/types';
import { PostActions } from './PostActions';
import { Clock } from 'lucide-react';
import { SafeHtmlRenderer } from '@/components/SafeHtmlRenderer';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onShare?: (postId: string) => void;
  showActions?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onBookmark, 
  onShare,
  showActions = true 
}) => {
  const getInitials = (username?: string) => {
    if (!username) return 'А';
    return username.charAt(0).toUpperCase();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Статья';
      case 'story': return 'История';
      case 'question': return 'Вопрос';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'story': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'question': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <Card className="card-soft h-full flex flex-col group">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(post.profiles?.username)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">
                {post.profiles?.username || 'Анонимный автор'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <time className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(post.published_at || post.created_at), {
                    addSuffix: true,
                    locale: ru
                  })}
                </time>
                <Badge variant="secondary" className={`text-xs ${getTypeColor(post.type)}`}>
                  {getTypeLabel(post.type)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Category */}
        {post.categories && (
          <div className="mb-3">
            <Link 
              to={`/category/${post.categories.slug}`}
              className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              #{post.categories.title}
            </Link>
          </div>
        )}

        {/* Title */}
        <div>
          <Link to={`/p/${post.slug}`}>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
          </Link>
          
          {post.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {post.subtitle}
            </p>
          )}
        </div>
      </CardHeader>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="px-6 pb-3">
          <Link to={`/p/${post.slug}`} className="block">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </Link>
        </div>
      )}

      {/* Content Preview */}
      <CardContent className="flex-1 pt-0">
        {post.tldr && (
          <div className="mb-4">
            <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Коротко:
              </p>
              <p className="text-sm text-foreground">
                {truncateText(post.tldr, 120)}
              </p>
            </div>
          </div>
        )}

        {post.content_html && !post.tldr && (
          <SafeHtmlRenderer 
            html={truncateText(post.content_html.replace(/<[^>]*>/g, ''), 150)}
            className="text-sm text-muted-foreground line-clamp-3"
          />
        )}

        {/* Tags */}
        {post.post_tags && post.post_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {post.post_tags.slice(0, 3).map((postTag, index) => (
              <Link
                key={index}
                to={`/tag/${postTag.tags.slug}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
              >
                #{postTag.tags.title}
              </Link>
            ))}
            {post.post_tags.length > 3 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{post.post_tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardFooter className="pt-0">
          <PostActions
            postId={post.id}
            onLike={() => onLike?.(post.id)}
            onBookmark={() => onBookmark?.(post.id)}
            onShare={() => onShare?.(post.id)}
            className="w-full"
          />
        </CardFooter>
      )}
    </Card>
  );
};