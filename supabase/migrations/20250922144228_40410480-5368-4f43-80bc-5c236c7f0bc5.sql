-- Создание всех основных таблиц для женского журнала

-- Таблица категорий
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица тегов
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица постов
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('article', 'story', 'question')) DEFAULT 'article',
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  cover_image_url TEXT,
  content_html TEXT,
  tldr TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'published', 'rejected')) DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  focus_keywords TEXT[],
  canonical TEXT,
  noindex BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица связи постов и тегов
CREATE TABLE public.post_tags (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Таблица комментариев
CREATE TABLE public.comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
  content_html TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('visible', 'hidden', 'pending')) DEFAULT 'visible',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица поведенческих сигналов
CREATE TABLE public.signals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('view', 'read', 'like', 'dislike', 'share', 'bookmark', 'comment')),
  value FLOAT DEFAULT 1,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id, type)
);

-- Таблица жалоб
CREATE TABLE public.reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'reviewed', 'dismissed')) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица загрузок
CREATE TABLE public.uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание бакетов для хранения файлов
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('covers', 'covers', true),
  ('avatars', 'avatars', true),
  ('uploads', 'uploads', false);

-- Включение RLS для всех таблиц
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Политики для категорий (только чтение для всех)
CREATE POLICY "Категории видны всем" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Админы могут управлять категориями" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Политики для тегов (только чтение для всех)
CREATE POLICY "Теги видны всем" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Админы могут управлять тегами" ON public.tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Политики для постов
CREATE POLICY "Опубликованные посты видны всем" ON public.posts 
  FOR SELECT USING (status = 'published');

CREATE POLICY "Авторы видят свои посты" ON public.posts 
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Админы видят все посты" ON public.posts 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Авторы могут создавать посты" ON public.posts 
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Авторы могут редактировать свои посты" ON public.posts 
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Админы могут редактировать все посты" ON public.posts 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Политики для связи постов и тегов
CREATE POLICY "Теги постов видны всем если пост опубликован" ON public.post_tags 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND status = 'published')
  );

CREATE POLICY "Авторы могут управлять тегами своих постов" ON public.post_tags 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
  );

-- Политики для комментариев
CREATE POLICY "Комментарии видны всем если статус visible" ON public.comments 
  FOR SELECT USING (status = 'visible');

CREATE POLICY "Пользователи могут добавлять комментарии" ON public.comments 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Пользователи могут редактировать свои комментарии" ON public.comments 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Админы могут управлять комментариями" ON public.comments 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Политики для сигналов
CREATE POLICY "Пользователи могут создавать сигналы" ON public.signals 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Пользователи видят свои сигналы" ON public.signals 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Анонимные просмотры разрешены" ON public.signals 
  FOR INSERT WITH CHECK (type = 'view' AND user_id IS NULL);

-- Политики для жалоб
CREATE POLICY "Пользователи могут подавать жалобы" ON public.reports 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Админы видят жалобы" ON public.reports 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Политики для загрузок
CREATE POLICY "Пользователи видят свои загрузки" ON public.uploads 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Пользователи могут загружать файлы" ON public.uploads 
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Политики для Storage
CREATE POLICY "Обложки доступны всем для чтения" ON storage.objects 
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Аватары доступны всем для чтения" ON storage.objects 
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Пользователи могут загружать обложки" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Пользователи могут загружать аватары" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Пользователи могут загружать файлы" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Создание индексов для оптимизации
CREATE INDEX idx_posts_status_published_at ON public.posts(status, published_at DESC);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_category_id ON public.posts(category_id);
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_signals_post_id_type ON public.signals(post_id, type);
CREATE INDEX idx_signals_user_id ON public.signals(user_id);

-- Триггеры для автообновления updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();