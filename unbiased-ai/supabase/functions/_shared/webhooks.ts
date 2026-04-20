import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Webhook configuration
export interface WebhookConfig {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  headers?: Record<string, string>;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  timeout?: number;
  isActive: boolean;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastError?: string;
  deliveredAt?: string;
  responseStatus?: number;
  responseBody?: string;
}

// Webhook manager class
export class WebhookManager {
  private supabase: any;

  constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  async registerWebhook(config: Omit<WebhookConfig, 'id'>): Promise<string> {
    if (!this.supabase) throw new Error('Database not available');

    const webhookId = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await this.supabase
      .from('webhooks')
      .insert({
        id: webhookId,
        url: config.url,
        secret: config.secret,
        events: config.events,
        headers: config.headers || {},
        retry_policy: config.retryPolicy || {
          maxRetries: 5,
          backoffMultiplier: 2,
          initialDelay: 1000
        },
        timeout: config.timeout || 30000,
        is_active: config.isActive !== false,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    return webhookId;
  }

  async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<void> {
    if (!this.supabase) throw new Error('Database not available');

    const { error } = await this.supabase
      .from('webhooks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', webhookId);

    if (error) throw error;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    if (!this.supabase) throw new Error('Database not available');

    const { error } = await this.supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
  }

  async getWebhooks(events?: string[]): Promise<WebhookConfig[]> {
    if (!this.supabase) return [];

    let query = this.supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true);

    if (events && events.length > 0) {
      // Find webhooks that have any of the specified events
      query = query.overlaps('events', events);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  async triggerWebhook(webhookId: string, event: string, payload: any): Promise<string> {
    if (!this.supabase) throw new Error('Database not available');

    const deliveryId = `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get webhook config
    const { data: webhook, error: webhookError } = await this.supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('is_active', true)
      .single();

    if (webhookError || !webhook) {
      throw new Error('Webhook not found or inactive');
    }

    // Check if webhook listens to this event
    if (!webhook.events.includes(event) && !webhook.events.includes('*')) {
      console.log(`Webhook ${webhookId} does not listen to event ${event}`);
      return deliveryId;
    }

    // Create delivery record
    const { error: deliveryError } = await this.supabase
      .from('webhook_deliveries')
      .insert({
        id: deliveryId,
        webhook_id: webhookId,
        event,
        payload,
        status: 'pending',
        attempts: 0,
        max_attempts: webhook.retry_policy?.maxRetries || 5,
        created_at: new Date().toISOString()
      });

    if (deliveryError) throw deliveryError;

    // Trigger delivery asynchronously
    this.deliverWebhook(deliveryId).catch(console.error);

    return deliveryId;
  }

  async deliverWebhook(deliveryId: string): Promise<void> {
    if (!this.supabase) return;

    // Get delivery details
    const { data: delivery, error: deliveryError } = await this.supabase
      .from('webhook_deliveries')
      .select(`
        *,
        webhooks (*)
      `)
      .eq('id', deliveryId)
      .single();

    if (deliveryError || !delivery) {
      console.error('Delivery not found:', deliveryId);
      return;
    }

    const webhook = delivery.webhooks;
    if (!webhook) {
      console.error('Webhook config not found for delivery:', deliveryId);
      return;
    }

    // Prepare webhook payload
    const payload = {
      id: deliveryId,
      event: delivery.event,
      timestamp: new Date().toISOString(),
      data: delivery.payload,
      webhook: {
        id: webhook.id,
        events: webhook.events
      }
    };

    // Add signature if secret is configured
    let signature: string | undefined;
    if (webhook.secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhook.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload)));
      signature = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'UnbiasedAI-Webhook/1.0',
      'X-Webhook-ID': webhook.id,
      'X-Delivery-ID': deliveryId,
      'X-Event': delivery.event,
      ...webhook.headers
    };

    if (signature) {
      headers['X-Signature'] = `sha256=${signature}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout || 30000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text().catch(() => '');

      // Update delivery status
      const updateData: any = {
        attempts: delivery.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        response_status: response.status,
        response_body: responseBody.substring(0, 10000) // Limit response body size
      };

      if (response.ok) {
        updateData.status = 'success';
        updateData.delivered_at = new Date().toISOString();
      } else if (delivery.attempts + 1 >= delivery.max_attempts) {
        updateData.status = 'failed';
        updateData.last_error = `HTTP ${response.status}: ${responseBody}`;
      } else {
        // Schedule retry
        const retryPolicy = webhook.retry_policy || { maxRetries: 5, backoffMultiplier: 2, initialDelay: 1000 };
        const delay = retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, delivery.attempts);
        updateData.status = 'retrying';
        updateData.next_retry_at = new Date(Date.now() + delay).toISOString();
        updateData.last_error = `HTTP ${response.status}: ${responseBody}`;

        // Schedule retry
        setTimeout(() => this.deliverWebhook(deliveryId), delay);
      }

      await this.supabase
        .from('webhook_deliveries')
        .update(updateData)
        .eq('id', deliveryId);

    } catch (error) {
      // Update delivery with error
      const updateData: any = {
        attempts: delivery.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        last_error: error.message
      };

      if (delivery.attempts + 1 >= delivery.max_attempts) {
        updateData.status = 'failed';
      } else {
        // Schedule retry
        const retryPolicy = webhook.retry_policy || { maxRetries: 5, backoffMultiplier: 2, initialDelay: 1000 };
        const delay = retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, delivery.attempts);
        updateData.status = 'retrying';
        updateData.next_retry_at = new Date(Date.now() + delay).toISOString();

        // Schedule retry
        setTimeout(() => this.deliverWebhook(deliveryId), delay);
      }

      await this.supabase
        .from('webhook_deliveries')
        .update(updateData)
        .eq('id', deliveryId);
    }
  }

  async triggerEvent(event: string, payload: any, organizationId?: string): Promise<string[]> {
    const webhooks = await this.getWebhooks([event]);

    // Filter by organization if specified
    const relevantWebhooks = organizationId
      ? webhooks.filter(wh => wh.organization_id === organizationId)
      : webhooks;

    const deliveryIds: string[] = [];

    for (const webhook of relevantWebhooks) {
      try {
        const deliveryId = await this.triggerWebhook(webhook.id, event, payload);
        deliveryIds.push(deliveryId);
      } catch (error) {
        console.error(`Failed to trigger webhook ${webhook.id}:`, error);
      }
    }

    return deliveryIds;
  }

  async getDeliveryStatus(deliveryId: string): Promise<WebhookDelivery | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    if (error) return null;

    return data;
  }

  async retryFailedDeliveries(): Promise<void> {
    if (!this.supabase) return;

    const { data: failedDeliveries, error } = await this.supabase
      .from('webhook_deliveries')
      .select('id')
      .eq('status', 'retrying')
      .lt('next_retry_at', new Date().toISOString());

    if (error) {
      console.error('Failed to fetch failed deliveries:', error);
      return;
    }

    for (const delivery of failedDeliveries || []) {
      this.deliverWebhook(delivery.id).catch(console.error);
    }
  }
}

// Global webhook manager instance
export const webhookManager = new WebhookManager();

// Convenience functions for common events
export async function triggerBatchComplete(batchId: string, results: any, organizationId?: string): Promise<string[]> {
  return webhookManager.triggerEvent('batch.completed', {
    batchId,
    results,
    completedAt: new Date().toISOString()
  }, organizationId);
}

export async function triggerAnalysisComplete(analysisId: string, result: any, organizationId?: string): Promise<string[]> {
  return webhookManager.triggerEvent('analysis.completed', {
    analysisId,
    result,
    completedAt: new Date().toISOString()
  }, organizationId);
}

export async function triggerOrganizationEvent(event: string, organizationId: string, data: any): Promise<string[]> {
  return webhookManager.triggerEvent(`organization.${event}`, {
    organizationId,
    ...data,
    timestamp: new Date().toISOString()
  }, organizationId);
}