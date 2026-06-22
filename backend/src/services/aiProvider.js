// Unified AI Provider Service
// Supports: Gemini, OpenAI, Groq, Cerebras, OpenRouter, Anthropic
// Falls back gracefully if a provider is not configured

const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY || process.env.CEREBRAS_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
};

const PROVIDERS = {
  gemini: {
    name: 'Gemini',
    configured: !!env.GEMINI_API_KEY,
    latency: null,
  },
  openai: {
    name: 'OpenAI',
    configured: !!env.OPENAI_API_KEY,
    latency: null,
  },
  groq: {
    name: 'Groq',
    configured: !!env.GROQ_API_KEY,
    latency: null,
  },
  cerebras: {
    name: 'Cerebras',
    configured: !!env.CEREBRAS_API_KEY,
    latency: null,
  },
  openrouter: {
    name: 'OpenRouter',
    configured: !!env.OPENROUTER_API_KEY,
    latency: null,
  },
  anthropic: {
    name: 'Anthropic',
    configured: !!env.ANTHROPIC_API_KEY,
    latency: null,
  },
};

function getAvailableProviders() {
  return Object.entries(PROVIDERS)
    .filter(([key, p]) => p.configured)
    .map(([key, p]) => key);
}

function getProviderStatus() {
  const result = {};
  for (const [key, p] of Object.entries(PROVIDERS)) {
    result[key] = {
      name: p.name,
      configured: p.configured,
      status: p.configured ? 'online' : 'offline',
      latency: p.latency,
    };
  }
  return result;
}

// Unified chat completion with automatic provider fallback
async function chatCompletion(messages, options = {}) {
  const available = getAvailableProviders();
  
  if (available.length === 0) {
    throw new Error('No AI providers configured. Please set at least one API key in .env');
  }

  let lastError = null;

  for (const provider of available) {
    try {
      const start = Date.now();
      let result;

      switch (provider) {
        case 'gemini':
          result = await callGemini(messages, options);
          break;
        case 'openai':
          result = await callOpenAI(messages, options);
          break;
        case 'groq':
          result = await callGroq(messages, options);
          break;
        case 'cerebras':
          result = await callCerebras(messages, options);
          break;
        case 'openrouter':
          result = await callOpenRouter(messages, options);
          break;
        case 'anthropic':
          result = await callAnthropic(messages, options);
          break;
        default:
          continue;
      }

      PROVIDERS[provider].latency = Date.now() - start;
      return { ...result, provider };
    } catch (err) {
      lastError = err;
      console.warn(`Provider ${provider} failed:`, err.message);
      continue;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown'}`);
}

// Placeholder implementations - to be connected to actual SDKs
async function callGemini(messages, options) {
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemMsg }] },
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.max_tokens ?? 500,
      },
    }),
  });
  if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text, usage: data.usageMetadata };
}

async function callOpenAI(messages, options) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

async function callGroq(messages, options) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'llama-3.3-70b-versatile',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
    }),
  });
  if (!resp.ok) throw new Error(`Groq HTTP ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

async function callCerebras(messages, options) {
  const resp = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'llama3.1-8b',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
    }),
  });
  if (!resp.ok) throw new Error(`Cerebras HTTP ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

async function callOpenRouter(messages, options) {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://rania.tl',
    },
    body: JSON.stringify({
      model: options.model || 'openai/gpt-4o-mini',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
    }),
  });
  if (!resp.ok) throw new Error(`OpenRouter HTTP ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

async function callAnthropic(messages, options) {
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role,
    content: m.content,
  }));

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'claude-3-haiku-20240307',
      max_tokens: options.max_tokens || 500,
      system: systemMsg,
      messages: chatMessages,
    }),
  });
  if (!resp.ok) throw new Error(`Anthropic HTTP ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return {
    text: data.content?.[0]?.text || '',
    usage: data.usage,
  };
}

export default {
  chatCompletion,
  getAvailableProviders,
  getProviderStatus,
  PROVIDERS,
};