import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogOut, User } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Хедер */}
        <header className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-bold text-foreground">Женский журнал</h1>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Добро пожаловать, {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button>
                <User className="h-4 w-4 mr-2" />
                Войти
              </Button>
            </Link>
          )}
        </header>

        {/* Основной контент */}
        <main className="space-y-8">
          <div className="text-center py-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Добро пожаловать в наш журнал
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Место для историй, советов и общения современных женщин
            </p>
          </div>

          {user ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Мои истории</CardTitle>
                  <CardDescription>
                    Поделитесь своим опытом с сообществом
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Написать историю</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Задать вопрос</CardTitle>
                  <CardDescription>
                    Получите совет от других участниц
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Задать вопрос
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Мой профиль</CardTitle>
                  <CardDescription>
                    Настройте свой профиль и интересы
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="secondary">
                    Редактировать профиль
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Присоединяйтесь к нам</CardTitle>
                  <CardDescription>
                    Зарегистрируйтесь, чтобы делиться историями и задавать вопросы
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/auth">
                    <Button className="w-full">
                      Зарегистрироваться
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
