import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
  id: string;
  title: string;
  slug: string;
}

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  disabled?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  maxTags = 5,
  disabled = false
}) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (inputValue) {
      const filtered = availableTags.filter(tag => 
        tag.title.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(tag.id)
      );
      setFilteredTags(filtered.slice(0, 5)); // Показываем максимум 5 предложений
    } else {
      setFilteredTags([]);
    }
  }, [inputValue, availableTags, selectedTags]);

  const loadTags = async () => {
    setLoading(true);
    try {
      // Используем функцию get_available_tags для безопасного доступа
      const { data, error } = await supabase.rpc('get_available_tags');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error: any) {
      console.error('Error loading tags:', error);
      toast.error('Ошибка загрузки тегов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (tagId: string) => {
    if (selectedTags.length >= maxTags) {
      toast.error(`Максимум ${maxTags} тегов`);
      return;
    }

    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(id => id !== tagId));
  };

  const getTagTitle = (tagId: string) => {
    const tag = availableTags.find(t => t.id === tagId);
    return tag?.title || tagId;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Выбранные теги ({selectedTags.length}/{maxTags})</Label>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map(tagId => (
              <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                {getTagTitle(tagId)}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tagId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">Теги не выбраны</p>
        )}
      </div>

      {!disabled && selectedTags.length < maxTags && (
        <div className="space-y-2">
          <Label htmlFor="tag-search">Добавить тег</Label>
          <div className="relative">
            <Input
              id="tag-search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Найти теги..."
              disabled={loading}
            />
            
            {filteredTags.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-background border border-border rounded-md mt-1 max-h-48 overflow-y-auto">
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag.id)}
                    className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                  >
                    {tag.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Начните печатать для поиска существующих тегов. 
            Создание новых тегов доступно только администраторам.
          </p>
        </div>
      )}
    </div>
  );
};