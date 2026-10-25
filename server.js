/**
 * AgriTech 独立聊天服务（可选）
 *
 * 主站 Flask 已内置同等的 /api/chat 接口，此文件保留给需要单独部署聊天服务的场景。
 * 已从 Google Gemini 改为 DeepSeek / OpenAI 兼容接口，密钥仅从环境变量读取。
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = (process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || '').trim();
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || process.env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

if (!API_KEY) {
  console.warn('⚠️ 未配置 DEEPSEEK_API_KEY，聊天服务将仅返回离线提示。');
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.post('/api/chat', async (req, res) => {
  const { message, image } = req.body;

  if (!message && !image) {
    return res.status(400).json({ error: '请输入问题或上传图片', reply: '请输入问题或上传图片。' });
  }

  if (!API_KEY) {
    return res.json({
      reply: '当前未配置大模型 API Key，聊天服务仅能返回离线提示。请在 .env 中设置 DEEPSEEK_API_KEY。',
      mode: 'offline',
    });
  }

  const visionNote = image
    ? '\n用户上传了图片。DeepSeek 文本模型不能直接识图，请明确说明无法读取图片内容，并给出拍摄与初筛建议。'
    : '';
  const prompt = `你是面向中国农户的农业助手，请使用简体中文回答，给出可执行的农艺建议，涉及农药时提醒核对登记标签，不要编造数据。${visionNote}\n\n用户问题：${message || '请介绍平台功能'}`;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: '你是农智云的农业助手，默认使用简体中文。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('大模型接口错误:', detail.slice(0, 400));
      return res.status(502).json({
        reply: '大模型服务暂时不可用，请稍后重试或使用平台内置的离线规则回答。',
        mode: 'offline-fallback',
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    res.json({ reply: reply || '暂时没有生成有效内容，请换一种问法。', mode: 'online', model: MODEL });
  } catch (error) {
    console.error('聊天服务错误:', error);
    res.status(500).json({
      reply: '聊天服务异常，请稍后重试或使用平台内置的离线规则回答。',
      mode: 'offline-fallback',
    });
  }
});

app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`🚀 农智云聊天服务已启动：http://127.0.0.1:${PORT}`);
  console.log(`🤖 大模型：${API_KEY ? `已配置（${MODEL}）` : '未配置（离线提示模式）'}`);
});
