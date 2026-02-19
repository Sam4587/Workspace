require('dotenv').config();
const openai = require('openai');

async function testOpenRouter() {
  console.log('=== OpenRouter 基本功能测试 ===\n');
  
  const client = new openai.OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
  });

  try {
    console.log('发送简单测试消息...');
    const response = await client.chat.completions.create({
      model: 'meta-llama/llama-3-8b-instruct:free',
      messages: [
        { role: 'user', content: '你好，请用 1-2 句话介绍一下你自己' }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    console.log('✓ 请求成功！');
    console.log('响应内容:', response.choices[0].message.content);
    console.log('Token 使用:', response.usage);
    
  } catch (error) {
    console.error('✗ 请求失败');
    console.error('错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testOpenRouter();
