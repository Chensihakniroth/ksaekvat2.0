const axios = require('axios');
require('dotenv').config();

const models = [
  'baidu/cobuddy:free',
  'z-ai/glm-4.5-air:free',
  'poolside/laguna-xs.2:free',
  'poolside/laguna-m.1:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
  'liquid/lfm-2.5-1.2b-thinking:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-20b:free',
  'openai/gpt-oss-120b:free',
  'minimax/minimax-m2.5:free',
  'inclusionai/ring-2.6-1t:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen3-coder:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
];

async function test(m) {
  try {
    const r = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      { model: m, messages: [{ role: 'user', content: 'hi' }], max_tokens: 10 },
      {
        timeout: 15000,
        headers: {
          Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
          'HTTP-Referer': 'https://github.com/discordjs/discord.js',
        },
      }
    );
    const c = r.data.choices?.[0]?.message?.content;
    console.log(`OK  ${m}  ->  ${c ? c.substring(0, 40) : 'NULL'}`);
  } catch (e) {
    console.log(`${e.response?.status || 'ERR'}  ${m}`);
  }
}

(async () => {
  console.log('Quick ping test...\n');
  for (let i = 0; i < models.length; i += 5) {
    await Promise.all(models.slice(i, i + 5).map(test));
    await new Promise((r) => setTimeout(r, 1500));
  }
})();
