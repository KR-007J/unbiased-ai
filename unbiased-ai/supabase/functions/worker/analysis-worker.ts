import { analysisQueue, Worker } from '../_shared/queue.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_VERSION = 'v1';
const GEMINI_MODEL = 'gemini-1.5-flash';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
};

// Job processor for text analysis
const analyzeTextProcessor = async (job: any) => {
  const { textId, content, batchId, userId, metadata = {} } = job.data;

  console.log(`Processing analysis job ${job.id} for text ${textId}`);

  if (!content || typeof content !== 'string') {
    throw new Error('Invalid content provided for analysis');
  }

  const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  // Check cache first
  const contentHash = btoa(content).substring(0, 32); // Simple hash for demo
  let cachedResult = null;

  if (supabase) {
    const { data: cache } = await supabase
      .from('analysis_cache')
      .select('result')
      .eq('content_hash', contentHash)
      .single();

    if (cache) {
      cachedResult = cache.result;
    }
  }

  let analysis;
  if (cachedResult) {
    analysis = cachedResult;
    console.log(`Using cached result for job ${job.id}`);
  } else {
    // Call Gemini API
    const prompt = `Analyze bias in the following text. Return ONLY JSON with: biasScore (0.0-1.0), biasDetected (boolean), dominantType (string), instances (array of bias instances with phrase, type, severity).

TEXT: "${content.substring(0, 2000)}"`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 500, topP: 0.95 }
    };

    const res = await fetch(buildModelUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      analysis = JSON.parse(cleaned);
    } catch (parseError) {
      console.error(`Failed to parse Gemini response for job ${job.id}:`, cleaned);
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Cache the result
    if (supabase) {
      await supabase
        .from('analysis_cache')
        .upsert({
          content_hash: contentHash,
          result: analysis,
          cached_at: new Date().toISOString()
        }, { onConflict: 'content_hash' })
        .catch(console.error);
    }
  }

  // Save analysis result
  if (supabase && userId) {
    await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        original_text: content,
        bias_score: analysis.biasScore || 0,
        confidence: 0.85,
        bias_types: analysis.instances?.map((inst: any) => inst.type) || [],
        findings: analysis.instances || [],
        summary: `Bias ${analysis.biasDetected ? 'detected' : 'not detected'}`,
        severity: analysis.biasScore > 0.7 ? 'high' : analysis.biasScore > 0.3 ? 'medium' : 'low',
        language: metadata.language || 'en',
        content_category: metadata.category || 'text'
      })
      .catch(console.error);
  }

  // Update batch job progress
  if (supabase && batchId) {
    // This would need more sophisticated batch tracking in a real implementation
    console.log(`Completed analysis for batch ${batchId}, text ${textId}`);
  }

  return {
    textId,
    batchId,
    analysis,
    cached: !!cachedResult,
    processingTime: Date.now() - job.timestamp,
  };
};

// Create and start worker
const worker = new Worker(analysisQueue, analyzeTextProcessor, 3); // 3 concurrent jobs

// Handle different execution modes
const command = Deno.args[0];

if (command === 'start') {
  console.log('Starting analysis worker...');
  await worker.start();
} else if (command === 'stats') {
  const stats = await analysisQueue.getQueueStats();
  console.log('Queue stats:', stats);
} else if (command === 'process-once') {
  // Process one batch of jobs and exit
  const jobs = await analysisQueue.getWaitingJobs(5);
  console.log(`Processing ${jobs.length} jobs...`);

  for (const job of jobs) {
    try {
      const result = await analyzeTextProcessor(job);
      await analysisQueue.complete(job.id, result);
      console.log(`Job ${job.id} completed`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await analysisQueue.fail(job.id, error as Error);
    }
  }

  console.log('Batch processing complete');
} else {
  console.log('Usage: deno run --allow-net --allow-env worker.ts [start|stats|process-once]');
}
