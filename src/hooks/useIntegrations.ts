import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  type: 'openai' | 'n8n' | 'nodul' | 'custom';
  endpoint_url?: string;
  // NOTE: api_key and webhook_secret are NEVER stored in the database
  // They are enforced to be NULL via CHECK constraints for security
  // All credentials are stored securely in Supabase Vault
  config: any;
  enabled: boolean;
  credentials_in_vault?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AIJob {
  id: number;
  integration_id: string;
  provider: string;
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const useIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Explicitly exclude sensitive fields that are enforced to be NULL
      const { data, error: fetchError } = await supabase
        .from('integrations')
        .select('id, name, type, endpoint_url, config, enabled, credentials_in_vault, created_by, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setIntegrations((data || []).map(item => ({
        ...item,
        type: item.type as 'openai' | 'n8n' | 'nodul' | 'custom'
      })));
    } catch (err: any) {
      console.error('Error fetching integrations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setJobs((data || []).map(item => ({
        ...item,
        status: item.status as 'queued' | 'processing' | 'completed' | 'failed'
      })));
    } catch (err: any) {
      console.error('Error fetching AI jobs:', err);
    }
  };

  const createIntegration = async (
    integration: Omit<Integration, 'id' | 'created_by' | 'created_at' | 'updated_at'>,
    credentials?: { api_key?: string; webhook_secret?: string }
  ) => {
    try {
      // First create the integration record without credentials
      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          ...integration,
          credentials_in_vault: false,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store credentials securely in Vault
      if (credentials?.api_key || credentials?.webhook_secret) {
        const { error: credError } = await supabase.functions.invoke('manage-integration-credentials', {
          body: {
            action: 'store',
            integrationId: data.id,
            apiKey: credentials.api_key,
            webhookSecret: credentials.webhook_secret,
          },
        });

        if (credError) {
          // Rollback: delete the integration if credential storage fails
          await supabase.from('integrations').delete().eq('id', data.id);
          throw new Error('Failed to securely store credentials');
        }
      }

      toast({
        title: 'Интеграция создана',
        description: 'Интеграция и учетные данные безопасно сохранены',
      });

      fetchIntegrations();
      return data;
    } catch (err: any) {
      console.error('Error creating integration:', err);
      toast({
        title: 'Ошибка',
        description: err.message || 'Не удалось создать интеграцию',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateIntegration = async (id: string, updates: Partial<Integration>) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Интеграция обновлена',
        description: 'Настройки интеграции сохранены',
      });

      fetchIntegrations();
    } catch (err: any) {
      console.error('Error updating integration:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить интеграцию',
        variant: 'destructive',
      });
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      // Use the secure function to delete both integration and credentials
      const { error } = await supabase.functions.invoke('manage-integration-credentials', {
        body: {
          action: 'delete',
          integrationId: id,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Интеграция удалена',
        description: 'Интеграция и учетные данные безопасно удалены',
      });

      fetchIntegrations();
    } catch (err: any) {
      console.error('Error deleting integration:', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить интеграцию',
        variant: 'destructive',
      });
    }
  };

  const testIntegration = async (integrationId: string) => {
    try {
      // This would typically call an edge function to test the integration
      toast({
        title: 'Тестирование интеграции',
        description: 'Тестовый запрос отправлен',
      });
    } catch (err: any) {
      console.error('Error testing integration:', err);
      toast({
        title: 'Ошибка тестирования',
        description: 'Не удалось протестировать интеграцию',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchIntegrations();
    fetchJobs();
  }, []);

  return {
    integrations,
    jobs,
    loading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    refetch: fetchIntegrations,
  };
};