import React from 'react';
import { Navigation } from '@/components/Navigation';
import { FeedTabs } from '@/components/FeedTabs';
import { useCategories } from '@/hooks/useCategories';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  Users, 
  MessageCircleQuestion, 
  PenTool,
  Heart,
  ArrowRight 
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Приветствие и статистика */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Добро пожаловать в МамПространство
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Место, где мамы делятся историями, задают вопросы и находят поддержку в своём материнском пути
          </p>
          
          {/* Быстрые действия */}
          {user ? (
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/submit">
                  <PenTool className="h-5 w-5 mr-2" />
                  Поделиться историей
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/ask">
                  <MessageCircleQuestion className="h-5 w-5 mr-2" />
                  Задать вопрос
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mb-8">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/auth">
                  <Heart className="h-5 w-5 mr-2" />
                  Присоединиться к сообществу
                </Link>
              </Button>
            </div>
          )}

          {/* Статистика сообщества */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Card className="card-soft">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">1,234</div>
                <div className="text-sm text-muted-foreground">Историй</div>
              </CardContent>
            </Card>
            
            <Card className="card-soft">
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">567</div>
                <div className="text-sm text-muted-foreground">Участниц</div>
              </CardContent>
            </Card>
            
            <Card className="card-soft">
              <CardContent className="pt-6 text-center">
                <MessageCircleQuestion className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">89</div>
                <div className="text-sm text-muted-foreground">Вопросов</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Категории */}
        {!categoriesLoading && categories.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Популярные темы</h2>
              <Button variant="ghost" asChild>
                <Link to="/categories">
                  Все категории
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link key={category.id} to={`/c/${category.slug}`}>
                  <Badge 
                    variant="secondary" 
                    className="w-full justify-center py-3 text-sm transition-smooth hover:bg-secondary-hover cursor-pointer"
                  >
                    {category.title}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Основная лента */}
        <FeedTabs />

        {/* Призыв к действию для незарегистрированных */}
        {!user && (
          <div className="mt-16">
            <Card className="card-soft bg-gradient-secondary text-center">
              <CardHeader>
                <CardTitle className="text-2xl text-secondary-foreground">
                  Готовы присоединиться?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-foreground/80 mb-6 max-w-md mx-auto">
                  Станьте частью нашего сообщества и поделитесь своим опытом материнства
                </p>
                <Button asChild size="lg" variant="default">
                  <Link to="/auth">
                    Зарегистрироваться бесплатно
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Футер */}
      <footer className="bg-muted/30 border-t mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">МамПространство</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Место для поддержки, общения и обмена опытом между мамами
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Сообщество</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="transition-smooth hover:text-foreground">О нас</Link></li>
                <li><Link to="/rules" className="transition-smooth hover:text-foreground">Правила</Link></li>
                <li><Link to="/contacts" className="transition-smooth hover:text-foreground">Контакты</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Помощь</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/help" className="transition-smooth hover:text-foreground">Как пользоваться</Link></li>
                <li><Link to="/privacy" className="transition-smooth hover:text-foreground">Конфиденциальность</Link></li>
                <li><Link to="/terms" className="transition-smooth hover:text-foreground">Условия</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Контакты</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>hello@momprostranstvo.ru</li>
                <li>Telegram: @momprostranstvo</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 МамПространство. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
