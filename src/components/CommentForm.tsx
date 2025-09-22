import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CommentFormProps {
  postId: string;
  parentId?: number;
  onCommentAdded?: () => void;
  placeholder?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  parentId,
  onCommentAdded,
  placeholder = 'Написать комментарий...'
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в аккаунт, чтобы оставить комментарий',
        variant: 'destructive'
      });
      return;
    }

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content_html: content.trim(),
          post_id: postId,
          user_id: user.id,
          parent_id: parentId || null,
          status: 'visible'
        });

      if (error) throw error;

      setContent('');
      toast({
        title: 'Успешно!',
        description: 'Комментарий добавлен',
      });

      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error: any) {
      console.error('Ошибка добавления комментария:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить комментарий',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-4 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          <a href="/auth" className="text-primary hover:underline">
            Войдите в аккаунт
          </a>
          , чтобы оставить комментарий
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={isSubmitting}
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Отправить
        </Button>
      </div>
    </form>
  );
};