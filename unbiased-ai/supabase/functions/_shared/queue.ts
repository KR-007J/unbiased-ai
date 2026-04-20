import { createClient } from "https://esm.sh/redis@4.6.10";

// Queue configuration
export interface Job {
  id: string;
  type: string;
  data: any;
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
}

export interface QueueOptions {
  defaultJobOptions?: Partial<Job>;
  limiter?: {
    max: number;
    duration: number;
  };
  redis?: {
    url?: string;
    token?: string;
  };
}

export class Queue {
  private redis: any;
  private name: string;
  private options: QueueOptions;

  constructor(name: string, options: QueueOptions = {}) {
    this.name = name;
    this.options = options;
    this.initRedis();
  }

  private initRedis() {
    const REDIS_URL = this.options.redis?.url || Deno.env.get('REDIS_URL') || Deno.env.get('UPSTASH_REDIS_REST_URL');
    const REDIS_TOKEN = this.options.redis?.token || Deno.env.get('REDIS_TOKEN') || Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

    if (REDIS_URL) {
      try {
        this.redis = createClient({
          url: REDIS_URL,
          password: REDIS_TOKEN,
        });
      } catch (error) {
        console.warn(`Failed to initialize Redis for queue ${this.name}:`, error.message);
      }
    }
  }

  async add(jobName: string, data: any, options: Partial<Job> = {}): Promise<string> {
    if (!this.redis) {
      throw new Error('Redis client not available for queue operations');
    }

    const jobId = options.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job: Job = {
      id: jobId,
      type: jobName,
      data,
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 1,
      backoff: options.backoff || { type: 'fixed', delay: 5000 },
      removeOnComplete: options.removeOnComplete || 100,
      removeOnFail: options.removeOnFail || 50,
      ...this.options.defaultJobOptions,
    };

    const jobKey = `${this.name}:job:${jobId}`;
    const waitKey = `${this.name}:wait`;

    // Store job data
    await this.redis.setex(jobKey, 86400, JSON.stringify(job)); // 24 hour TTL

    // Add to wait queue
    const score = Date.now() + (job.delay || 0);
    await this.redis.zadd(waitKey, score, jobId);

    return jobId;
  }

  async getWaitingJobs(limit: number = 10): Promise<Job[]> {
    if (!this.redis) return [];

    const waitKey = `${this.name}:wait`;
    const now = Date.now();

    // Get jobs that are ready to be processed
    const jobIds = await this.redis.zrangebyscore(waitKey, 0, now, 'LIMIT', 0, limit);

    if (jobIds.length === 0) return [];

    const jobs: Job[] = [];
    for (const jobId of jobIds) {
      const jobKey = `${this.name}:job:${jobId}`;
      const jobData = await this.redis.get(jobKey);

      if (jobData) {
        try {
          const job = JSON.parse(jobData);
          jobs.push(job);
        } catch (error) {
          console.error(`Failed to parse job ${jobId}:`, error);
        }
      }
    }

    return jobs;
  }

  async complete(jobId: string, result?: any): Promise<void> {
    if (!this.redis) return;

    const jobKey = `${this.name}:job:${jobId}`;
    const waitKey = `${this.name}:wait`;
    const completedKey = `${this.name}:completed`;

    // Remove from wait queue
    await this.redis.zrem(waitKey, jobId);

    // Add to completed queue if configured
    const jobData = await this.redis.get(jobKey);
    if (jobData) {
      try {
        const job = JSON.parse(jobData);
        if (job.removeOnComplete && job.removeOnComplete > 0) {
          const completedData = {
            ...job,
            result,
            completedAt: new Date().toISOString(),
          };
          await this.redis.lpush(completedKey, JSON.stringify(completedData));
          await this.redis.ltrim(completedKey, 0, job.removeOnComplete - 1);
        }
      } catch (error) {
        console.error(`Failed to process completed job ${jobId}:`, error);
      }
    }

    // Remove job data
    await this.redis.del(jobKey);
  }

  async fail(jobId: string, error: Error): Promise<void> {
    if (!this.redis) return;

    const jobKey = `${this.name}:job:${jobId}`;
    const waitKey = `${this.name}:wait`;
    const failedKey = `${this.name}:failed`;

    // Get job data
    const jobData = await this.redis.get(jobKey);
    if (!jobData) return;

    try {
      const job = JSON.parse(jobData);

      // Check if job should be retried
      if (job.attempts && job.attempts > 1) {
        job.attempts -= 1;

        // Calculate backoff delay
        let delay = 0;
        if (job.backoff) {
          if (job.backoff.type === 'exponential') {
            delay = job.backoff.delay * Math.pow(2, (job.attempts || 1));
          } else {
            delay = job.backoff.delay;
          }
        }

        // Update job and re-queue
        await this.redis.setex(jobKey, 86400, JSON.stringify(job));
        await this.redis.zadd(waitKey, Date.now() + delay, jobId);
        return;
      }

      // Job failed permanently
      await this.redis.zrem(waitKey, jobId);

      // Add to failed queue if configured
      if (job.removeOnFail && job.removeOnFail > 0) {
        const failedData = {
          ...job,
          error: {
            message: error.message,
            stack: error.stack,
          },
          failedAt: new Date().toISOString(),
        };
        await this.redis.lpush(failedKey, JSON.stringify(failedData));
        await this.redis.ltrim(failedKey, 0, job.removeOnFail - 1);
      }

      await this.redis.del(jobKey);
    } catch (parseError) {
      console.error(`Failed to process failed job ${jobId}:`, parseError);
      await this.redis.del(jobKey);
    }
  }

  async getJobStatus(jobId: string): Promise<{ status: string; data?: any }> {
    if (!this.redis) return { status: 'unknown' };

    const jobKey = `${this.name}:job:${jobId}`;
    const waitKey = `${this.name}:wait`;
    const activeKey = `${this.name}:active`;

    // Check if job exists
    const jobData = await this.redis.get(jobKey);
    if (!jobData) {
      // Check completed/failed queues
      const completedJobs = await this.redis.lrange(`${this.name}:completed`, 0, -1);
      const failedJobs = await this.redis.lrange(`${this.name}:failed`, 0, -1);

      for (const jobStr of completedJobs) {
        try {
          const job = JSON.parse(jobStr);
          if (job.id === jobId) {
            return { status: 'completed', data: job.result };
          }
        } catch {}
      }

      for (const jobStr of failedJobs) {
        try {
          const job = JSON.parse(jobStr);
          if (job.id === jobId) {
            return { status: 'failed', data: job.error };
          }
        } catch {}
      }

      return { status: 'not_found' };
    }

    // Check if job is active
    const isActive = await this.redis.sismember(activeKey, jobId);
    if (isActive) {
      return { status: 'active' };
    }

    // Check if job is waiting
    const score = await this.redis.zscore(waitKey, jobId);
    if (score !== null) {
      const now = Date.now();
      if (parseInt(score) <= now) {
        return { status: 'waiting' };
      } else {
        return { status: 'delayed' };
      }
    }

    return { status: 'unknown' };
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    if (!this.redis) return { waiting: 0, active: 0, completed: 0, failed: 0 };

    const [waiting, active, completed, failed] = await Promise.all([
      this.redis.zcard(`${this.name}:wait`),
      this.redis.scard(`${this.name}:active`),
      this.redis.llen(`${this.name}:completed`),
      this.redis.llen(`${this.name}:failed`),
    ]);

    return {
      waiting: waiting || 0,
      active: active || 0,
      completed: completed || 0,
      failed: failed || 0,
    };
  }

  async clean(completedGrace: number = 86400000, failedGrace: number = 604800000): Promise<void> {
    if (!this.redis) return;

    const now = Date.now();
    const completedKey = `${this.name}:completed`;
    const failedKey = `${this.name}:failed`;

    // Clean old completed jobs
    const completedJobs = await this.redis.lrange(completedKey, 0, -1);
    const validCompletedJobs: string[] = [];

    for (const jobStr of completedJobs) {
      try {
        const job = JSON.parse(jobStr);
        if (job.completedAt && (now - new Date(job.completedAt).getTime()) < completedGrace) {
          validCompletedJobs.push(jobStr);
        }
      } catch {}
    }

    if (validCompletedJobs.length > 0) {
      await this.redis.del(completedKey);
      await this.redis.rpush(completedKey, ...validCompletedJobs);
    }

    // Clean old failed jobs
    const failedJobs = await this.redis.lrange(failedKey, 0, -1);
    const validFailedJobs: string[] = [];

    for (const jobStr of failedJobs) {
      try {
        const job = JSON.parse(jobStr);
        if (job.failedAt && (now - new Date(job.failedAt).getTime()) < failedGrace) {
          validFailedJobs.push(jobStr);
        }
      } catch {}
    }

    if (validFailedJobs.length > 0) {
      await this.redis.del(failedKey);
      await this.redis.rpush(failedKey, ...validFailedJobs);
    }
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Worker class for processing jobs
export class Worker {
  private queue: Queue;
  private processor: (job: Job) => Promise<any>;
  private concurrency: number;
  private isRunning: boolean = false;

  constructor(queue: Queue, processor: (job: Job) => Promise<any>, concurrency: number = 1) {
    this.queue = queue;
    this.processor = processor;
    this.concurrency = concurrency;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`Starting worker for queue ${this.queue['name']} with concurrency ${this.concurrency}`);

    while (this.isRunning) {
      try {
        const jobs = await this.queue.getWaitingJobs(this.concurrency);

        if (jobs.length === 0) {
          // Wait before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Process jobs concurrently
        const promises = jobs.map(async (job) => {
          try {
            const result = await this.processor(job);
            await this.queue.complete(job.id, result);
            console.log(`Job ${job.id} completed successfully`);
          } catch (error) {
            console.error(`Job ${job.id} failed:`, error);
            await this.queue.fail(job.id, error as Error);
          }
        });

        await Promise.all(promises);
      } catch (error) {
        console.error('Worker error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retrying
      }
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    await this.queue.close();
  }
}

// Pre-configured queues for common use cases
export const analysisQueue = new Queue('analysis', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const forecastQueue = new Queue('forecast', {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
});

export const emailQueue = new Queue('email', {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 100,
  },
});

export const webhookQueue = new Queue('webhook', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: 500,
    removeOnFail: 100,
  },
});