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
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircleQuestion, 
  X, 
  Eye, 
  Send,
  Loader2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const Ask = () => {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Состояние формы
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    tags: [] as string[],
    isAnonymous: false,
    isUrgent: false
  });
  
  const [newTag, setNewTag] = useState('');
  const [preview, setPreview] = useState(false);

  // Проверка авторизации
  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        description: 'Заполните обязательные поля: вопрос и описание',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Находим категорию "Вопросы" или используем выбранную
      let categoryId = formData.categoryId;
      if (!categoryId) {
        const questionsCategory = categories.find(c => c.slug === 'voprosy');
        categoryId = questionsCategory?.id || null;
      }

      // Создаем пост-вопрос
      const slug = createSlug(formData.title);
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          type: 'question',
          slug,
          title: formData.title,
          content_html: formData.content,
          author_id: user.id,
          category_id: categoryId,
          status: 'pending', // Отправляем на модерацию
          // Добавляем метаданные для срочности
          ...(formData.isUrgent && {
            tldr: '🔥 СРОЧНЫЙ ВОПРОС'
          })
        })
        .select()
        .single();

      if (postError) throw postError;

      // Добавляем теги
      if (formData.tags.length > 0) {
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
        title: 'Вопрос отправлен!',
        description: formData.isUrgent 
          ? 'Ваш срочный вопрос будет рассмотрен в приоритетном порядке.'
          : 'Ваш вопрос отправлен на модерацию и будет опубликован после проверки.',
      });

      navigate('/me');
    } catch (error) {
      console.error('Ошибка создания вопроса:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить вопрос. Попробуйте еще раз.',
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
            <h1 className="text-2xl font-bold">Предпросмотр вопроса</h1>
            <Button onClick={() => setPreview(false)} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Закрыть
            </Button>
          </div>

          <Card className="card-soft">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default" className="bg-primary">
                  Вопрос
                </Badge>
                {formData.isUrgent && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Срочно
                  </Badge>
                )}
                {formData.isAnonymous && (
                  <Badge variant="secondary">
                    Анонимно
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-2xl flex items-center">
                <HelpCircle className="h-6 w-6 mr-2 text-primary" />
                {formData.title}
              </CardTitle>
              
              {formData.categoryId && (
                <Badge variant="outline" className="w-fit">
                  {categories.find(c => c.id === formData.categoryId)?.title}
                </Badge>
              )}
            </CardHeader>

            <CardContent>
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
                  Отправить вопрос
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
            <MessageCircleQuestion className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold">Задать вопрос</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Получите совет и поддержку от опытных мам нашего сообщества
          </p>
        </div>

        {/* Подсказки и правила */}
        <Card className="card-soft mb-6 bg-accent/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-primary" />
              Как задать хороший вопрос?
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Опишите проблему максимально подробно</li>
              <li>• Укажите возраст ребёнка и другие важные детали</li>
              <li>• Объясните, что вы уже пробовали</li>
              <li>• Будьте вежливы и терпеливы в ожидании ответов</li>
              <li>• Помните: это не медицинская консультация</li>
            </ul>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Ваш вопрос</CardTitle>
              <CardDescription>
                Опишите свою ситуацию, чтобы получить максимально полезные советы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Суть вопроса *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Например: Как справиться с коликами у новорожденного?"
                  maxLength={150}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/150 символов
                </div>
              </div>

              <div>
                <Label htmlFor="content">Подробное описание *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Расскажите о ситуации подробнее: возраст ребёнка, что происходит, что уже пробовали, какие есть особенности..."
                  rows={8}
                  className="min-h-[200px]"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Минимум 50 символов ({formData.content.length}/50)
                </div>
              </div>

              <div>
                <Label htmlFor="category">Категория</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите подходящую категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.slug !== 'mamskie-istorii').map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Теги</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Например: новорожденный, сон, питание"
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
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Дополнительные опции</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urgent"
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) => handleInputChange('isUrgent', !!checked)}
                />
                <Label htmlFor="urgent" className="text-sm">
                  🔥 Срочный вопрос (требует быстрого ответа)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => handleInputChange('isAnonymous', !!checked)}
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Опубликовать анонимно
                </Label>
              </div>

              {formData.isUrgent && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Срочные вопросы рассматриваются в приоритетном порядке, но помните: 
                    в экстренных ситуациях обращайтесь к врачу!
                  </p>
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
            
            <Button 
              type="submit" 
              disabled={loading || !formData.title || !formData.content || formData.content.length < 50}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Отправляем...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Отправить вопрос
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Ask;