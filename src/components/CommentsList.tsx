import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Comment } from '@/types';
import { CommentForm } from './CommentForm';

interface CommentsListProps {
  comments: Comment[];
  postId: string;
  onCommentAdded?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onCommentAdded?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  postId, 
  onCommentAdded 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const getInitials = (username?: string) => {
    if (!username) return 'А';
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-3">
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.profiles?.avatar_url} />
          <AvatarFallback className="text-xs">
            {getInitials(comment.profiles?.username)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {comment.profiles?.username || 'Аноним'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { 
                locale: ru, 
                addSuffix: true 
              })}
            </span>
          </div>
          
          <div 
            className="text-sm text-foreground prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: comment.content_html }}
          />
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Ответить
            </Button>
          </div>
          
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                placeholder={`Ответить ${comment.profiles?.username || 'пользователю'}...`}
                onCommentAdded={() => {
                  setShowReplyForm(false);
                  if (onCommentAdded) onCommentAdded();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CommentsList: React.FC<CommentsListProps> = ({ 
  comments, 
  postId, 
  onCommentAdded 
}) => {
  // Группируем комментарии: сначала родительские, потом ответы
  const parentComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  const getCommentReplies = (parentId: number) => {
    return replies.filter(r => r.parent_id === parentId);
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Пока нет комментариев</p>
        <p className="text-sm">Будьте первым, кто оставит комментарий!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {parentComments.map(comment => (
        <div key={comment.id} className="space-y-3">
          <CommentItem 
            comment={comment} 
            postId={postId} 
            onCommentAdded={onCommentAdded}
          />
          
          {/* Ответы на комментарий */}
          {getCommentReplies(comment.id).map(reply => (
            <div key={reply.id} className="ml-8 border-l-2 border-border pl-4">
              <CommentItem 
                comment={reply} 
                postId={postId} 
                onCommentAdded={onCommentAdded}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};