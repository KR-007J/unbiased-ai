import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const biasDetectionTime = new Trend('bias_detection_duration');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  scenarios: {
    // Smoke test
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
    },

    // Load test
    load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 10 },   // Ramp up to 10 users
        { duration: '5m', target: 10 },   // Stay at 10 users
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down to 0
      ],
      tags: { test_type: 'load' },
    },

    // Stress test
    stress_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '3m', target: 200 },
        { duration: '1m', target: 300 },
        { duration: '3m', target: 300 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'stress' },
    },

    // Spike test
    spike_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '10s', target: 10 },
        { duration: '10s', target: 200 },  // Spike to 200 users
        { duration: '30s', target: 200 },  // Stay at spike
        { duration: '10s', target: 10 },   // Drop back down
        { duration: '10s', target: 0 },
      ],
      tags: { test_type: 'spike' },
    },

    // Endurance test
    endurance_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
      tags: { test_type: 'endurance' },
    },

    // API endpoint specific tests
    bias_detection_test: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      tags: { endpoint: 'detect-bias' },
    },

    chat_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
      tags: { endpoint: 'chat' },
    },

    batch_test: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      tags: { endpoint: 'batch' },
    },
  },

  thresholds: {
    // Overall thresholds
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%

    // Custom metrics
    errors: ['rate<0.1'],              // Custom error rate
    bias_detection_duration: ['p(95)<1500'], // Bias detection should be fast

    // Scenario specific thresholds
    'http_req_duration{test_type:smoke}': ['p(95)<1000'],
    'http_req_duration{test_type:load}': ['p(95)<2000'],
    'http_req_duration{test_type:stress}': ['p(95)<3000'],
    'http_req_duration{endpoint:detect-bias}': ['p(95)<1500'],
    'http_req_duration{endpoint:chat}': ['p(95)<2000'],
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://api.unbiased-ai.dev/v1';
const API_TOKEN = __ENV.API_TOKEN || 'test-token';

const testTexts = [
  'He is a brilliant scientist who discovered the cure for cancer.',
  'She works as a nurse in the hospital emergency room.',
  'The chairman of the board announced the new corporate strategy.',
  'Our team of engineers developed this innovative solution.',
  'The professor explained the complex mathematical concept clearly.',
  'The CEO presented the quarterly financial results to investors.',
  'The doctor prescribed medication for the patient\'s condition.',
  'The lawyer prepared the case for trial in court.',
  'The teacher graded the students\' assignments fairly.',
  'The manager delegated tasks to the team members efficiently.',
];

const longText = 'a'.repeat(5000); // 5KB text for size testing

// Helper functions
function getRandomText() {
  return testTexts[Math.floor(Math.random() * testTexts.length)];
}

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'UnbiasedAI-LoadTest/1.0',
  };
}

function checkResponse(response, operation) {
  const result = check(response, {
    [`${operation}_status_is_2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${operation}_response_time_acceptable`]: (r) => r.timings.duration < 5000,
    [`${operation}_has_valid_json`]: (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!result);

  return result;
}

// Test scenarios
export function smoke_test() {
  // Basic functionality test
  const response = http.get(`${BASE_URL}/health`, {
    headers: getAuthHeaders(),
  });

  checkResponse(response, 'health_check');
  sleep(1);
}

export function load_test() {
  // Standard load testing
  const response = http.post(`${BASE_URL}/detect-bias`, JSON.stringify({
    content: getRandomText(),
    type: 'text',
  }), {
    headers: getAuthHeaders(),
  });

  const success = checkResponse(response, 'bias_detection');
  if (success) {
    biasDetectionTime.add(response.timings.duration);
  }

  sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
}

export function stress_test() {
  // High load stress testing
  const response = http.post(`${BASE_URL}/detect-bias`, JSON.stringify({
    content: getRandomText(),
    type: 'text',
  }), {
    headers: getAuthHeaders(),
  });

  checkResponse(response, 'stress_detection');
  sleep(Math.random() * 0.5 + 0.5); // Shorter sleep under stress
}

export function spike_test() {
  // Sudden load spike testing
  const response = http.post(`${BASE_URL}/detect-bias`, JSON.stringify({
    content: getRandomText(),
    type: 'text',
  }), {
    headers: getAuthHeaders(),
  });

  checkResponse(response, 'spike_detection');
  sleep(Math.random() * 0.2 + 0.1); // Very short sleep during spike
}

export function endurance_test() {
  // Long-running endurance test
  const response = http.post(`${BASE_URL}/detect-bias`, JSON.stringify({
    content: getRandomText(),
    type: 'text',
  }), {
    headers: getAuthHeaders(),
  });

  checkResponse(response, 'endurance_detection');

  // Add some variety to prevent caching effects
  if (__VU % 10 === 0) {
    // Every 10th VU does a different operation
    const chatResponse = http.post(`${BASE_URL}/chat/send`, JSON.stringify({
      message: 'Hello, can you help me understand bias detection?',
    }), {
      headers: getAuthHeaders(),
    });
    checkResponse(chatResponse, 'endurance_chat');
  }

  sleep(Math.random() * 3 + 2); // 2-5 second sleep
}

export function bias_detection_test() {
  // Focused bias detection testing
  const testCases = [
    { content: getRandomText(), type: 'text' },
    { content: longText, type: 'text' }, // Large payload test
    { content: getRandomText(), type: 'email' },
    { content: getRandomText(), type: 'social_media' },
  ];

  const testCase = testCases[__VU % testCases.length];

  const response = http.post(`${BASE_URL}/detect-bias`, JSON.stringify(testCase), {
    headers: getAuthHeaders(),
  });

  const success = checkResponse(response, 'focused_bias_detection');
  if (success) {
    biasDetectionTime.add(response.timings.duration);

    // Additional checks for successful responses
    const responseBody = JSON.parse(response.body);
    check(responseBody, {
      'has_success_field': (body) => body.hasOwnProperty('success'),
      'has_data_field': (body) => body.hasOwnProperty('data'),
      'has_meta_field': (body) => body.hasOwnProperty('meta'),
      'bias_detection_format_valid': (body) => {
        return body.data &&
               typeof body.data.detected === 'boolean' &&
               Array.isArray(body.data.biasInstances);
      }
    });
  }

  sleep(1);
}

export function chat_test() {
  // Chat functionality testing
  const messages = [
    'How does bias detection work?',
    'Can you explain gender bias in language?',
    'What are some examples of cultural bias?',
    'How can I write more objectively?',
    'Tell me about political bias in media.',
  ];

  const message = messages[__VU % messages.length];

  const response = http.post(`${BASE_URL}/chat/send`, JSON.stringify({
    message: message,
    conversationId: `load-test-conv-${__VU}`,
  }), {
    headers: getAuthHeaders(),
  });

  checkResponse(response, 'chat_interaction');

  // Occasionally check conversation history
  if (__VU % 5 === 0) {
    const historyResponse = http.get(`${BASE_URL}/chat/history?conversationId=load-test-conv-${__VU}&limit=10`, {
      headers: getAuthHeaders(),
    });
    checkResponse(historyResponse, 'chat_history');
  }

  sleep(2);
}

export function batch_test() {
  // Batch processing testing
  const batchSize = Math.min(__VU * 2, 20); // Scale batch size with VU count, max 20
  const batchTexts = Array(batchSize).fill(null).map((_, i) => ({
    id: `item-${i}`,
    content: getRandomText(),
  }));

  const response = http.post(`${BASE_URL}/batch-analyze`, JSON.stringify({
    texts: batchTexts,
    priority: 1,
  }), {
    headers: getAuthHeaders(),
  });

  const success = checkResponse(response, 'batch_processing');
  if (success) {
    const responseBody = JSON.parse(response.body);
    check(responseBody, {
      'batch_has_batch_id': (body) => body.data && body.data.batchId,
      'batch_has_status': (body) => body.data && body.data.status,
      'batch_status_queued': (body) => body.data && body.data.status === 'processing',
    });
  }

  sleep(5); // Longer sleep for batch processing
}

// Setup function
export function setup() {
  console.log('Starting performance tests for Unbiased AI API');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test scenarios: ${Object.keys(options.scenarios).join(', ')}`);

  // Pre-test health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    console.error('Health check failed. Aborting tests.');
    return { abort: true };
  }

  console.log('Health check passed. Starting tests...');
  return {};
}

// Teardown function
export function teardown(data) {
  if (data.abort) {
    console.log('Tests aborted due to setup failure');
    return;
  }

  console.log('Performance tests completed');
  console.log('Check results in the K6 output for detailed metrics');
}

// Handle summary
export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'performance-report.json': JSON.stringify(data, null, 2),
    'metrics-summary.json': JSON.stringify({
      metrics: data.metrics,
      thresholds: options.thresholds,
      passed: checkThresholds(data, options.thresholds),
    }, null, 2),
  };

  // Send summary to monitoring system (if configured)
  if (__ENV.SLACK_WEBHOOK) {
    const slackPayload = {
      text: 'Unbiased AI Performance Test Completed',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Performance Test Results*\nDuration: ${data.metrics.iteration_duration.values.avg}ms avg\nRequests: ${data.metrics.http_reqs.values.count}\nErrors: ${data.metrics.http_req_failed.values.rate * 100}%`
          }
        }
      ]
    };

    http.post(__ENV.SLACK_WEBHOOK, JSON.stringify(slackPayload), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return summary;
}

function checkThresholds(data, thresholds) {
  const results = {};

  for (const [metric, conditions] of Object.entries(thresholds)) {
    const metricData = data.metrics[metric];
    if (!metricData) continue;

    results[metric] = {};

    for (const condition of conditions) {
      // Parse condition (e.g., 'p(95)<2000' -> percentile 95 < 2000)
      const match = condition.match(/^([pP]\(\d+\)|avg|rate|count)([<>=!]+)([\d.]+)$/);
      if (!match) continue;

      const [, stat, operator, value] = match;
      const thresholdValue = parseFloat(value);

      let actualValue;
      switch (stat.toLowerCase()) {
        case 'avg':
          actualValue = metricData.values.avg;
          break;
        case 'rate':
          actualValue = metricData.values.rate;
          break;
        case 'count':
          actualValue = metricData.values.count;
          break;
        default:
          // Handle percentiles like p(95)
          const percentileMatch = stat.match(/p\((\d+)\)/i);
          if (percentileMatch) {
            actualValue = metricData.values[`p${percentileMatch[1]}`];
          }
          break;
      }

      if (actualValue !== undefined) {
        let passed = false;
        switch (operator) {
          case '<': passed = actualValue < thresholdValue; break;
          case '<=': passed = actualValue <= thresholdValue; break;
          case '>': passed = actualValue > thresholdValue; break;
          case '>=': passed = actualValue >= thresholdValue; break;
          case '==': passed = actualValue === thresholdValue; break;
          case '!=': passed = actualValue !== thresholdValue; break;
        }

        results[metric][condition] = {
          passed,
          actual: actualValue,
          threshold: thresholdValue,
          operator
        };
      }
    }
  }

  return results;
}