import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  bucket: 'covers' | 'avatars' | 'uploads';
  onUploadComplete: (url: string) => void;
  currentImage?: string;
  maxSize?: number; // в МБ
  targetWidth?: number;
  targetHeight?: number;
  aspectRatio?: string; // '16:9', '1:1', etc.
  quality?: number; // 0-1
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  bucket,
  onUploadComplete,
  currentImage,
  maxSize = 5,
  targetWidth = 1600,
  targetHeight,
  aspectRatio = '16:9',
  quality = 0.82
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const { user } = useAuth();

  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Вычисляем размеры с учетом aspect ratio
        let { width, height } = img;
        
        if (aspectRatio === '16:9') {
          const ratio = 16/9;
          if (width/height > ratio) {
            width = height * ratio;
          } else {
            height = width / ratio;
          }
        } else if (aspectRatio === '1:1') {
          const size = Math.min(width, height);
          width = height = size;
        }

        // Масштабируем до целевого размера
        if (targetWidth && width > targetWidth) {
          const scale = targetWidth / width;
          width = targetWidth;
          height = height * scale;
        }

        if (targetHeight && height > targetHeight) {
          const scale = targetHeight / height;
          height = targetHeight;
          width = width * scale;
        }

        canvas.width = width;
        canvas.height = height;

        // Рисуем с центрированием
        const sourceX = (img.width - width) / 2;
        const sourceY = (img.height - height) / 2;
        
        ctx.drawImage(img, sourceX, sourceY, width, height, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, [aspectRatio, targetWidth, targetHeight, quality]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Проверка размера файла
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Файл слишком большой. Максимальный размер: ${maxSize} МБ`);
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    setUploading(true);

    try {
      // Сжимаем изображение
      const compressedFile = await compressImage(file);
      
      // Создаем превью
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);

      // Загружаем в Supabase Storage
      const fileExt = 'webp';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      // Сохраняем в таблицу uploads
      await supabase
        .from('uploads')
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_size: compressedFile.size,
          mime_type: compressedFile.type
        });

      onUploadComplete(publicUrl);
      toast.success('Изображение успешно загружено');

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки: ' + error.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <div className={`
            relative overflow-hidden rounded-lg border-2 border-dashed border-border
            ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '1:1' ? 'aspect-square' : ''}
          `}>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className={`
          relative border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors
          ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '1:1' ? 'aspect-square' : 'min-h-32'}
        `}>
          <div className="flex flex-col items-center justify-center space-y-4">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>Нажмите для выбора изображения</p>
              <p className="text-xs mt-1">
                Макс. размер: {maxSize} МБ. Формат: WebP ({aspectRatio})
              </p>
            </div>

            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};