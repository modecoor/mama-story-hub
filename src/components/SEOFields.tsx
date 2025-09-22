import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { Search, Eye, EyeOff } from 'lucide-react';

interface SEOFieldsProps {
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeywords?: string[];
  canonical?: string;
  noindex?: boolean;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onFocusKeywordsChange: (keywords: string[]) => void;
  onCanonicalChange: (value: string) => void;
  onNoindexChange: (value: boolean) => void;
}

export const SEOFields: React.FC<SEOFieldsProps> = ({
  title,
  seoTitle = '',
  seoDescription = '',
  focusKeywords = [],
  canonical = '',
  noindex = false,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onFocusKeywordsChange,
  onCanonicalChange,
  onNoindexChange
}) => {
  const { profile } = useProfile();

  // Скрыть SEO-поля для обычных пользователей
  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return null;
  }

  const generateAutoSEO = () => {
    if (!seoTitle) {
      const autoTitle = title.length > 57 ? title.substring(0, 57) + '...' : title;
      onSeoTitleChange(autoTitle);
    }

    if (!seoDescription) {
      const autoDescription = `Читайте ${title.toLowerCase()} на нашем сайте. Интересные материалы и полезная информация для современных женщин.`;
      const truncatedDescription = autoDescription.length > 160 
        ? autoDescription.substring(0, 157) + '...' 
        : autoDescription;
      onSeoDescriptionChange(truncatedDescription);
    }
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .slice(0, 5); // Максимум 5 ключевых слов
    onFocusKeywordsChange(keywords);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO настройки
          <Badge variant="secondary" className="text-xs">
            Только для редакторов
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seo-title">
              SEO заголовок ({seoTitle.length}/60)
            </Label>
            <Input
              id="seo-title"
              value={seoTitle}
              onChange={(e) => onSeoTitleChange(e.target.value)}
              placeholder="Оптимизированный заголовок для поиска"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              Рекомендуется до 60 символов
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonical">Каноническая ссылка</Label>
            <Input
              id="canonical"
              value={canonical}
              onChange={(e) => onCanonicalChange(e.target.value)}
              placeholder="https://example.com/canonical-url"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-description">
            Мета-описание ({seoDescription.length}/160)
          </Label>
          <Textarea
            id="seo-description"
            value={seoDescription}
            onChange={(e) => onSeoDescriptionChange(e.target.value)}
            placeholder="Краткое описание для поисковых систем"
            maxLength={160}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Рекомендуется 140-160 символов
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="focus-keywords">
            Ключевые слова (до 5)
          </Label>
          <Input
            id="focus-keywords"
            value={focusKeywords.join(', ')}
            onChange={(e) => handleKeywordsChange(e.target.value)}
            placeholder="ключевое слово 1, ключевое слово 2"
          />
          {focusKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {focusKeywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {noindex ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="noindex">
              Скрыть от поисковых систем
            </Label>
          </div>
          <Switch
            id="noindex"
            checked={noindex}
            onCheckedChange={onNoindexChange}
          />
        </div>

        <div className="pt-4 border-t">
          <button
            type="button"
            onClick={generateAutoSEO}
            className="text-sm text-primary hover:underline"
          >
            Автоматически заполнить SEO поля
          </button>
        </div>
      </CardContent>
    </Card>
  );
};