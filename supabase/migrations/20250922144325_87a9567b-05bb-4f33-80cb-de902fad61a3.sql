-- Создание начальных данных (seed)

-- Добавление категорий
INSERT INTO public.categories (slug, title, description) VALUES
  ('mamskie-istorii', 'Мамские истории', 'Личные истории и опыт материнства'),
  ('voprosy', 'Вопросы', 'Вопросы от сообщества и ответы экспертов'),
  ('beremennost', 'Беременность', 'Всё о беременности и подготовке к родам'),
  ('zdorovie-mamy', 'Здоровье мамы', 'Здоровье и самочувствие мам'),
  ('zdorovie-rebenka', 'Здоровье ребёнка', 'Детское здоровье и развитие'),
  ('psihologiya-resurs', 'Психология/Ресурс', 'Психологическая поддержка и ресурсы'),
  ('krasota-ekonomno', 'Красота/Экономно', 'Красота и уход с разумным бюджетом'),
  ('dom-i-uyut', 'Дом и уют', 'Создание уютного семейного пространства');

-- Добавление тегов
INSERT INTO public.tags (slug, title) VALUES
  ('beremennost', 'Беременность'),
  ('laktatsiya', 'Лактация'),
  ('prививки', 'Прививки'),
  ('trevojnost', 'Тревожность'),
  ('uhod-za-kojey', 'Уход за кожей'),
  ('byudjetnye-nahodki', 'Бюджетные находки'),
  ('pervyy-god', 'Первый год'),
  ('razvitie-rebenka', 'Развитие ребёнка'),
  ('pitanie', 'Питание'),
  ('son', 'Сон'),
  ('detskaya', 'Детская'),
  ('organizatsiya', 'Организация'),
  ('samouhod', 'Самоуход'),
  ('otnosheniya', 'Отношения'),
  ('rabota', 'Работа'),
  ('dekret', 'Декрет'),
  ('adaptatsiya', 'Адаптация'),
  ('stres', 'Стресс'),
  ('zdorovie', 'Здоровье'),
  ('bezopasnost', 'Безопасность');

-- Обновление профиля пользователя с ролью admin (если есть пользователи)
-- Эта команда выполнится только если есть пользователи в системе
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT user_id INTO first_user_id FROM public.profiles LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET role = 'admin', 
            interests = ARRAY['материнство', 'здоровье', 'развитие', 'психология']
        WHERE user_id = first_user_id;
    END IF;
END $$;