import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  PenTool, 
  Upload, 
  X, 
  Eye, 
  Send,
  Loader2 
} from 'lucide-react';

const Submit = () => {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Состояние формы
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    tldr: '',
    categoryId: '',
    coverImage: null as File | null,
    tags: [] as string[]
  });
  
  const [newTag, setNewTag] = useState('');
  const [preview, setPreview] = useState(false);

  // Проверка авторизации
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, coverImage: file }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('covers')
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      return null;
    }
  };

  const createSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^а-яёa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля: заголовок и содержание',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Загружаем обложку, если есть
      let coverImageUrl = null;
      if (formData.coverImage) {
        coverImageUrl = await uploadCoverImage(formData.coverImage);
      }

      // Создаем пост
      const slug = createSlug(formData.title);
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          type: 'story',
          slug,
          title: formData.title,
          subtitle: formData.subtitle || null,
          content_html: formData.content,
          tldr: formData.tldr || null,
          cover_image_url: coverImageUrl,
          author_id: user.id,
          category_id: formData.categoryId || null,
          status: 'pending' // Отправляем на модерацию
        })
        .select()
        .single();

      if (postError) throw postError;

      // Добавляем теги
      if (formData.tags.length > 0) {
        // Сначала создаем теги, которых нет
        for (const tagTitle of formData.tags) {
          const tagSlug = createSlug(tagTitle);
          
          const { error: tagError } = await supabase
            .from('tags')
            .upsert({
              slug: tagSlug,
              title: tagTitle
            }, {
              onConflict: 'slug'
            });

          if (tagError) console.error('Ошибка создания тега:', tagError);

          // Связываем тег с постом
          const { data: tag } = await supabase
            .from('tags')
            .select('id')
            .eq('slug', tagSlug)
            .single();

          if (tag) {
            await supabase
              .from('post_tags')
              .insert({
                post_id: post.id,
                tag_id: tag.id
              });
          }
        }
      }

      toast({
        title: 'История отправлена!',
        description: 'Ваша история отправлена на модерацию и будет опубликована после проверки.',
      });

      navigate('/me');
    } catch (error) {
      console.error('Ошибка создания поста:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить историю. Попробуйте еще раз.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (preview) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Предпросмотр истории</h1>
            <Button onClick={() => setPreview(false)} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Закрыть
            </Button>
          </div>

          <Card className="card-soft">
            {formData.coverImage && (
              <div className="relative h-64 overflow-hidden rounded-t-2xl">
                <img
                  src={URL.createObjectURL(formData.coverImage)}
                  alt="Обложка"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            
            <CardHeader>
              {formData.categoryId && (
                <Badge variant="secondary" className="w-fit mb-2">
                  {categories.find(c => c.id === formData.categoryId)?.title}
                </Badge>
              )}
              <CardTitle className="text-2xl">{formData.title}</CardTitle>
              {formData.subtitle && (
                <CardDescription className="text-lg">
                  {formData.subtitle}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent>
              {formData.tldr && (
                <div className="bg-accent/30 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold mb-2">Кратко:</h4>
                  <p>{formData.tldr}</p>
                </div>
              )}

              <div className="content-prose">
                {formData.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {formData.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Теги:</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={() => setPreview(false)} variant="outline">
              Редактировать
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправляем...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Отправить на модерацию
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <PenTool className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold">Поделиться историей</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Расскажите свою историю материнства, поделитесь опытом и поддержите других мам
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Заполните основные данные о вашей истории
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Придумайте привлекательный заголовок"
                  maxLength={100}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/100 символов
                </div>
              </div>

              <div>
                <Label htmlFor="subtitle">Подзаголовок</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="Краткое описание (необязательно)"
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="category">Категория</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cover">Обложка</Label>
                <div className="mt-1">
                  <input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('cover')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.coverImage ? formData.coverImage.name : 'Загрузить изображение'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Содержание</CardTitle>
              <CardDescription>
                Расскажите свою историю подробно
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tldr">Краткое содержание</Label>
                <Input
                  id="tldr"
                  value={formData.tldr}
                  onChange={(e) => handleInputChange('tldr', e.target.value)}
                  placeholder="Опишите суть в одном предложении"
                  maxLength={150}
                />
              </div>

              <div>
                <Label htmlFor="content">Ваша история *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Поделитесь своей историей, опытом, переживаниями..."
                  rows={10}
                  className="min-h-[200px]"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Минимум 100 символов ({formData.content.length}/100)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Теги</CardTitle>
              <CardDescription>
                Добавьте теги, чтобы другие мамы легче нашли вашу историю
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Например: первый год, лактация, тревожность"
                  maxLength={30}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Добавить
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      #{tag}
                      <X 
                        className="h-3 w-3 ml-1 hover:text-destructive" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreview(true)}
              disabled={!formData.title || !formData.content}
            >
              <Eye className="h-4 w-4 mr-2" />
              Предпросмотр
            </Button>
            
            <Button type="submit" disabled={loading || !formData.title || !formData.content}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправляем...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Отправить на модерацию
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Submit;