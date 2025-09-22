import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { ImageUpload } from '@/components/ImageUpload';
import { SEOFields } from '@/components/SEOFields';
import { TagSelector } from '@/components/TagSelector';
import { useProfile } from '@/hooks/useProfile';
import { RichTextEditor } from './RichTextEditor';
import { SafeHtmlRenderer } from './SafeHtmlRenderer';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types';
import { Loader2, X, Plus, Upload, Eye } from 'lucide-react';

interface PostEditorProps {
  post?: Post;
  onSave?: (post: Post) => void;
  onCancel?: () => void;
  type?: 'article' | 'story' | 'question';
}

export const PostEditor: React.FC<PostEditorProps> = ({
  post,
  onSave,
  onCancel,
  type = 'article'
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCategories();
  const { profile } = useProfile();
  
  // Проверяем роль пользователя
  const isAdminOrEditor = profile?.role && ['admin', 'editor'].includes(profile.role);
  
  const [formData, setFormData] = useState({
    title: post?.title || '',
    subtitle: post?.subtitle || '',
    slug: post?.slug || '',
    content_html: post?.content_html || '',
    tldr: post?.tldr || '',
    category_id: post?.category_id || '',
    cover_image_url: post?.cover_image_url || '',
    type: post?.type || type,
    status: post?.status || 'draft',
    seo_title: post?.seo_title || '',
    seo_description: post?.seo_description || '',
    focus_keywords: post?.focus_keywords || [],
    canonical: post?.canonical || '',
    noindex: post?.noindex || false
  });
  
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Автогенерация slug из заголовка
  useEffect(() => {
    if (formData.title && !post) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-zа-я0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, post]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить изображение',
        variant: 'destructive'
      });
      return null;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Файл слишком большой',
        description: 'Максимальный размер файла 5MB',
        variant: 'destructive'
      });
      return;
    }

    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      handleInputChange('cover_image_url', imageUrl);
    }
  };

  const handleSave = async (status: 'draft' | 'pending' | 'published' = 'draft') => {
    if (!user) return;

    if (!formData.title.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заголовок обязателен для заполнения',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const postData = {
        ...formData,
        status,
        author_id: user.id,
        published_at: status === 'published' ? new Date().toISOString() : null
      };

      let savedPost;

      if (post) {
        // Обновление существующего поста
        const { data, error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', post.id)
          .select()
          .single();

        if (error) throw error;
        savedPost = data;
      } else {
        // Создание нового поста
        const { data, error } = await supabase
          .from('posts')
          .insert(postData)
          .select()
          .single();

        if (error) throw error;
        savedPost = data;
      }

      // Сохраняем теги
      if (tags.length > 0) {
        // Сначала создаем теги, которых еще нет
        for (const tagTitle of tags) {
          const slug = tagTitle.toLowerCase().replace(/\s+/g, '-');
          
          await supabase
            .from('tags')
            .upsert({ title: tagTitle, slug }, { onConflict: 'slug' });
        }

        // Получаем ID тегов
        const { data: tagData } = await supabase
          .from('tags')
          .select('id, title')
          .in('title', tags);

        if (tagData) {
          // Удаляем старые связи
          await supabase
            .from('post_tags')
            .delete()
            .eq('post_id', savedPost.id);

          // Создаем новые связи
          const postTags = tagData.map(tag => ({
            post_id: savedPost.id,
            tag_id: tag.id
          }));

          await supabase
            .from('post_tags')
            .insert(postTags);
        }
      }

      const statusMessages = {
        draft: 'Пост сохранен как черновик',
        pending: 'Пост отправлен на модерацию',
        published: 'Пост опубликован'
      };

      toast({
        title: 'Успешно!',
        description: statusMessages[status]
      });

      onSave?.(savedPost);
    } catch (error: any) {
      console.error('Ошибка сохранения поста:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить пост',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Статья';
      case 'story': return 'История';
      case 'question': return 'Вопрос';
      default: return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {post ? 'Редактировать пост' : `Создать ${getTypeLabel(type).toLowerCase()}`}
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Редактор' : 'Предпросмотр'}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          )}
        </div>
      </div>

      {showPreview ? (
        // Предпросмотр
        <Card>
          <CardContent className="p-6">
            {formData.cover_image_url && (
              <img
                src={formData.cover_image_url}
                alt="Обложка"
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            <h1 className="text-3xl font-bold mb-2">{formData.title}</h1>
            {formData.subtitle && (
              <p className="text-xl text-muted-foreground mb-4">{formData.subtitle}</p>
            )}
            {formData.tldr && (
              <div className="bg-muted p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Коротко:</h3>
                <p>{formData.tldr}</p>
              </div>
            )}
            <SafeHtmlRenderer
              html={formData.content_html}
              className="prose prose-sm max-w-none"
            />
          </CardContent>
        </Card>
      ) : (
        // Редактор
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основной контент */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Введите заголовок поста"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.title.length}/200 символов
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Подзаголовок</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    placeholder="Краткое описание поста"
                    maxLength={300}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL (slug)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="url-поста"
                  />
                </div>

                {type !== 'question' && (
                  <div className="space-y-2">
                    <Label htmlFor="tldr">Коротко (TLDR)</Label>
                    <Textarea
                      id="tldr"
                      value={formData.tldr}
                      onChange={(e) => handleInputChange('tldr', e.target.value)}
                      placeholder="Кратко опишите суть поста в 2-3 предложениях"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.tldr.length}/500 символов
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Обложка</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cover-upload">Загрузить изображение</Label>
                    <Input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mt-2"
                    />
                  </div>
                  
                  {formData.cover_image_url && (
                    <div className="relative">
                      <img
                        src={formData.cover_image_url}
                        alt="Обложка"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => handleInputChange('cover_image_url', '')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Содержание</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={formData.content_html}
                  onChange={(value) => handleInputChange('content_html', value)}
                  placeholder={
                    type === 'question' 
                      ? 'Опишите ваш вопрос подробно...'
                      : 'Начните писать ваш пост...'
                  }
                  height="400px"
                />
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Публикация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="pending">На модерации</SelectItem>
                      <SelectItem value="published">Опубликовано</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Теги (до 5)</Label>
                  <TagSelector
                    selectedTags={tags}
                    onTagsChange={setTags}
                    maxTags={5}
                    disabled={false}
                  />
                </div>

                <div className="flex flex-col space-y-2 pt-4">
                  <Button
                    onClick={() => handleSave('draft')}
                    variant="outline"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Сохранить черновик
                  </Button>
                  
                  <Button
                    onClick={() => handleSave('pending')}
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Отправить на модерацию
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SEO настройки - только для админов/редакторов */}
            <SEOFields
              title={formData.title}
              seoTitle={formData.seo_title}
              seoDescription={formData.seo_description}
              focusKeywords={formData.focus_keywords}
              canonical={formData.canonical}
              noindex={formData.noindex}
              onSeoTitleChange={(value) => handleInputChange('seo_title', value)}
              onSeoDescriptionChange={(value) => handleInputChange('seo_description', value)}
              onFocusKeywordsChange={(keywords) => handleInputChange('focus_keywords', keywords)}
              onCanonicalChange={(value) => handleInputChange('canonical', value)}
              onNoindexChange={(value) => handleInputChange('noindex', value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};