#!/usr/bin/env node
// Test script to verify AI API keys are active and working

import 'dotenv/config';

const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY || process.env.CEREBRAS_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
};

const testMessage = { role: 'user', content: 'Say "Hello" in one word.' };

async function testGemini() {
  if (!env.GEMINI_API_KEY) return { status: 'skipped', reason: 'No API key' };
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  const start = Date.now();
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: testMessage.content }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 50 },
      }),
    });
    const latency = Date.now() - start;
    if (!resp.ok) {
      const text = await resp.text();
      return { status: 'failed', error: `HTTP ${resp.status}: ${text}`, latency };
    }
    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { status: 'success', latency, response: text.trim().slice(0, 100) };
  } catch (err) {
    return { status: 'failed', error: err.message, latency: Date.now() - start };
  }
}

async function testGroq() {
  if (!env.GROQ_API_KEY) return { status: 'skipped', reason: 'No API key' };
  
  const start = Date.now();
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [testMessage],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });
    const latency = Date.now() - start;
    if (!resp.ok) {
      const text = await resp.text();
      return { status: 'failed', error: `HTTP ${resp.status}: ${text}`, latency };
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { status: 'success', latency, response: text.trim().slice(0, 100) };
  } catch (err) {
    return { status: 'failed', error: err.message, latency: Date.now() - start };
  }
}

async function testCerebras() {
  if (!env.CEREBRAS_API_KEY) return { status: 'skipped', reason: 'No API key' };
  
  const start = Date.now();
  try {
    const resp = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b',
        messages: [testMessage],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });
    const latency = Date.now() - start;
    if (!resp.ok) {
      const text = await resp.text();
      return { status: 'failed', error: `HTTP ${resp.status}: ${text}`, latency };
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { status: 'success', latency, response: text.trim().slice(0, 100) };
  } catch (err) {
    return { status: 'failed', error: err.message, latency: Date.now() - start };
  }
}

async function testOpenAI() {
  if (!env.OPENAI_API_KEY) return { status: 'skipped', reason: 'No API key' };
  
  const start = Date.now();
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [testMessage],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });
    const latency = Date.now() - start;
    if (!resp.ok) {
      const text = await resp.text();
      return { status: 'failed', error: `HTTP ${resp.status}: ${text}`, latency };
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { status: 'success', latency, response: text.trim().slice(0, 100) };
  } catch (err) {
    return { status: 'failed', error: err.message, latency: Date.now() - start };
  }
}

async function testOpenRouter() {
  if (!env.OPENROUTER_API_KEY) return { status: 'skipped', reason: 'No API key' };
  
  const start = Date.now();
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://rania.tl',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [testMessage],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });
    const latency = Date.now() - start;
    if (!resp.ok) {
      const text = await resp.text();
      return { status: 'failed', error: `HTTP ${resp.status}: ${text}`, latency };
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { status: 'success', latency, response: text.trim().slice(0, 100) };
  } catch (err) {
    return { status: 'failed', error: err.message, latency: Date.now() - start };
  }
}

async function testAnthropic() {
  if (!env.ANTHROPIC_API_KEY) return { status: 'skipped', reason: 'No API key' };
  
  const start = Date.now();
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        messages: [testMessage],
      }),
    });
    const latency = Date.now() - start;
    if (!resp.ok) {
      const text = await resp.text();
      return { status: 'failed', error: `HTTP ${resp.status}: ${text}`, latency };
    }
    const data = await resp.json();
    const text = data.content?.[0]?.text || '';
    return { status: 'success', latency, response: text.trim().slice(0, 100) };
  } catch (err) {
    return { status: 'failed', error: err.message, latency: Date.now() - start };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('API KEY STATUS CHECK');
  console.log('='.repeat(60));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  const results = {};

  console.log('Testing Gemini API...');
  results.gemini = await testGemini();

  console.log('Testing OpenAI API...');
  results.openai = await testOpenAI();

  console.log('Testing Groq API...');
  results.groq = await testGroq();

  console.log('Testing Cerebras API...');
  results.cerebras = await testCerebras();

  console.log('Testing OpenRouter API...');
  results.openrouter = await testOpenRouter();

  console.log('Testing Anthropic API...');
  results.anthropic = await testAnthropic();

  console.log('');
  console.log('='.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(60));

  const statusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  };

  for (const [provider, result] of Object.entries(results)) {
    const icon = statusIcon(result.status);
    const latency = result.latency ? ` (${result.latency}ms)` : '';
    console.log(`${icon} ${provider.toUpperCase().padEnd(12)} ${result.status}${latency}`);
    if (result.status === 'success' && result.response) {
      console.log(`   Response: "${result.response}"`);
    }
    if (result.status === 'failed' && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.status === 'skipped' && result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  
  const activeCount = Object.values(results).filter(r => r.status === 'success').length;
  const failedCount = Object.values(results).filter(r => r.status === 'failed').length;
  const skippedCount = Object.values(results).filter(r => r.status === 'skipped').length;

  console.log(`Active: ${activeCount} | Failed: ${failedCount} | Skipped: ${skippedCount}`);
  
  if (activeCount > 0) {
    console.log('\n✅ At least one API key is active and working!');
  } else if (failedCount > 0) {
    console.log('\n⚠️  All configured API keys failed. Check the errors above.');
  } else {
    console.log('\n⚠️  No API keys are configured. Please add keys to .env file.');
  }
}

main().catch(console.error);