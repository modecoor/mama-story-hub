import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Eye, Bookmark, Share2, Loader2 } from 'lucide-react';
import { useReactions } from '@/hooks/useReactions';

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
  className = ""
}) => {
  const {
    liked,
    disliked,
    bookmarked,
    likes,
    dislikes,
    bookmarks,
    views,
    shares,
    loading,
    like,
    dislike,
    bookmark,
    share,
    loadStats
  } = useReactions(postId);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLike = () => {
    like();
    onLike?.();
  };

  const handleBookmark = () => {
    bookmark();
    onBookmark?.();
  };

  const handleShare = () => {
    share();
    onShare?.();
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Like Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleLike}
        disabled={loading}
        className={`${liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'} transition-colors`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
        )}
        {showCounts && <span className="text-sm">{likes}</span>}
      </Button>

      {/* Comments (placeholder) */}
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <MessageCircle className="h-4 w-4 mr-1" />
        {showCounts && <span className="text-sm">0</span>}
      </Button>

      {/* Views */}
      {showCounts && (
        <div className="flex items-center text-muted-foreground">
          <Eye className="h-4 w-4 mr-1" />
          <span className="text-sm">{views}</span>
        </div>
      )}

      {/* Bookmark Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleBookmark}
        disabled={loading}
        className={`${bookmarked ? 'text-blue-500 hover:text-blue-600' : 'text-muted-foreground hover:text-blue-500'} transition-colors`}
      >
        <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
      </Button>

      {/* Share Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleShare}
        disabled={loading}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
      <Share2 className="h-4 w-4" />
    </Button>
  </div>
);
};