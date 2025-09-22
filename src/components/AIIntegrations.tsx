import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useHomepageStats } from '@/hooks/useHomepageStats';
import { 
  Bot, 
  Zap, 
  Globe, 
  Key, 
  Webhook, 
  Play, 
  Plus, 
  Settings, 
  Activity,
  RefreshCw,
  Trash2,
  Clock
} from 'lucide-react';

interface IntegrationFormData {
  name: string;
  type: 'openai' | 'n8n' | 'nodul' | 'custom';
  endpoint_url?: string;
  api_key?: string;
  webhook_secret?: string;
  config: any;
  enabled: boolean;
}

const AIIntegrations = () => {
  const { integrations, jobs, loading, createIntegration, updateIntegration, deleteIntegration, testIntegration } = useIntegrations();
  const { refreshStats } = useHomepageStats();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<IntegrationFormData>({
    name: '',
    type: 'openai',
    endpoint_url: '',
    api_key: '',
    webhook_secret: '',
    config: {},
    enabled: true,
  });

  const integrationTypes = [
    {
      value: 'openai',
      label: 'OpenAI API',
      icon: <Bot className="h-5 w-5" />,
      description: 'Генерация контента через OpenAI API'
    },
    {
      value: 'n8n',
      label: 'n8n Webhook',
      icon: <Zap className="h-5 w-5" />,
      description: 'Автоматизация через n8n workflows'
    },
    {
      value: 'nodul',
      label: 'Nodul Webhook',
      icon: <Globe className="h-5 w-5" />,
      description: 'Интеграция с Nodul платформой'
    },
    {
      value: 'custom',
      label: 'Custom API',
      icon: <Settings className="h-5 w-5" />,
      description: 'Пользовательская интеграция'
    }
  ];

  const getTypeIcon = (type: string) => {
    const integType = integrationTypes.find(t => t.value === type);
    return integType?.icon || <Settings className="h-5 w-5" />;
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const handleCreateIntegration = async () => {
    try {
      await createIntegration(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        type: 'openai',
        endpoint_url: '',
        api_key: '',
        webhook_secret: '',
        config: {},
        enabled: true,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleToggleIntegration = async (id: string, enabled: boolean) => {
    await updateIntegration(id, { enabled });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Интеграции
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            История задач
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Статистика
          </TabsTrigger>
        </TabsList>

        {/* Интеграции */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="card-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>ИИ Интеграции</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Добавить интеграцию
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Создать интеграцию</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Название</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Название интеграции"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="type">Тип интеграции</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {integrationTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                {type.icon}
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-sm text-muted-foreground">{type.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.type === 'openai' && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="endpoint">Endpoint URL</Label>
                          <Input
                            id="endpoint"
                            value={formData.endpoint_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, endpoint_url: e.target.value }))}
                            placeholder="https://api.openai.com/v1"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="api_key">API Key</Label>
                          <Input
                            id="api_key"
                            type="password"
                            value={formData.api_key}
                            onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                            placeholder="sk-..."
                          />
                        </div>
                      </>
                    )}

                    {(formData.type === 'n8n' || formData.type === 'nodul' || formData.type === 'custom') && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="webhook_url">Webhook URL</Label>
                          <Input
                            id="webhook_url"
                            value={formData.endpoint_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, endpoint_url: e.target.value }))}
                            placeholder="https://your-webhook-url.com/webhook"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="webhook_secret">Webhook Secret (опционально)</Label>
                          <Input
                            id="webhook_secret"
                            type="password"
                            value={formData.webhook_secret}
                            onChange={(e) => setFormData(prev => ({ ...prev, webhook_secret: e.target.value }))}
                            placeholder="Секретный ключ для подписи"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enabled"
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="enabled">Включить интеграцию</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Отменить
                    </Button>
                    <Button onClick={handleCreateIntegration}>
                      Создать
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : integrations.length > 0 ? (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTypeIcon(integration.type)}
                        <div>
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {integrationTypes.find(t => t.value === integration.type)?.label}
                          </div>
                        </div>
                        <Badge className={getStatusColor(integration.enabled)}>
                          {integration.enabled ? 'Включена' : 'Отключена'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testIntegration(integration.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Тест
                        </Button>
                        
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteIntegration(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Интеграции не настроены</p>
                  <p className="text-sm">Добавьте первую интеграцию для автоматической генерации контента</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* История задач */}
        <TabsContent value="jobs" className="space-y-4">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>История задач ИИ</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{job.provider}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(job.created_at)}
                          </div>
                        </div>
                        <Badge className={getJobStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      {job.error_message && (
                        <div className="text-sm text-red-600 max-w-md truncate">
                          {job.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>История задач пуста</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Статистика */}
        <TabsContent value="stats" className="space-y-4">
          <Card className="card-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Управление статистикой</CardTitle>
              <Button onClick={refreshStats} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Обновить сейчас
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Статистика главной страницы обновляется автоматически каждый час. 
                Вы можете принудительно обновить её, нажав кнопку выше.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIIntegrations;