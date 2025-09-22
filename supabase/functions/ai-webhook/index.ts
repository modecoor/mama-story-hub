import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

interface WebhookPayload {
  prompt?: string;
  title?: string;
  content?: string;
  type?: 'story' | 'question' | 'article';
  integration_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const payload: WebhookPayload = await req.json();
    console.log('Webhook received:', payload);

    // Validate required fields
    if (!payload.integration_id) {
      return new Response(
        JSON.stringify({ error: 'integration_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get integration configuration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', payload.integration_id)
      .eq('enabled', true)
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found or disabled:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Integration not found or disabled' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify webhook signature if secret is configured
    if (integration.webhook_secret) {
      const signature = req.headers.get('x-signature');
      // In a real implementation, you would verify HMAC signature here
      console.log('Webhook signature check (mock):', signature);
    }

    // Log the job
    const { data: job, error: jobError } = await supabase
      .from('ai_jobs')
      .insert({
        integration_id: payload.integration_id,
        provider: integration.type,
        payload: payload,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to create job' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let generatedContent = '';
    let postData: any = {
      type: payload.type || 'article',
      status: 'draft' // Default to draft for safety
    };

    try {
      // Handle different integration types
      if (integration.type === 'openai') {
        // Generate content using OpenAI
        const openaiResponse = await fetch(`${integration.endpoint_url}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that writes engaging content for a community platform for mothers. Write in Russian language.'
              },
              {
                role: 'user',
                content: payload.prompt || 'Напиши интересную статью для мам'
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
        }

        const openaiData = await openaiResponse.json();
        generatedContent = openaiData.choices[0]?.message?.content || '';
        
        postData.title = payload.title || 'Сгенерированная статья';
        postData.content_html = `<p>${generatedContent.replace(/\n/g, '</p><p>')}</p>`;
        
      } else if (integration.type === 'n8n' || integration.type === 'nodul' || integration.type === 'custom') {
        // For webhook integrations, use provided content
        if (payload.content) {
          generatedContent = payload.content;
          postData.title = payload.title || 'Автоматически созданная статья';
          postData.content_html = payload.content;
        } else {
          throw new Error('Content is required for webhook integrations');
        }
      }

      // Create a draft post with generated content
      if (generatedContent) {
        // Generate a slug from title
        const slug = postData.title
          .toLowerCase()
          .replace(/[^a-zа-я0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) + '-' + Date.now();

        postData.slug = slug;
        postData.author_id = integration.created_by; // Use integration creator as author
        
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert(postData)
          .select()
          .single();

        if (postError) {
          throw new Error(`Failed to create post: ${postError.message}`);
        }

        // Update job status to completed
        await supabase
          .from('ai_jobs')
          .update({ 
            status: 'completed',
            result: { post_id: post.id }
          })
          .eq('id', job.id);

        console.log('Post created successfully:', post.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            post_id: post.id,
            job_id: job.id,
            message: 'Content generated and post created successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        throw new Error('No content was generated');
      }

    } catch (error: any) {
      console.error('Error processing webhook:', error);
      
      // Update job status to failed
      await supabase
        .from('ai_jobs')
        .update({ 
          status: 'failed',
          error_message: error.message
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to process webhook',
          details: error.message,
          job_id: job.id
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});