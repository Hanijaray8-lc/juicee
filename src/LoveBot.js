const getEffectiveApiKey = () => {
  return (
    process.env.REACT_APP_GROQ_API_KEY ||
    process.env.REACT_APP_GEMINI_API_KEY ||
    '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'
  ).trim();
  
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'qwen/qwen3.8-27b';

/**
 * Cleans and formats AI response strings into clean plain text with proper line breaks,
 * converting raw HTML (<br>) and markdown table syntax (|) into readable bullet points.
 */
const cleanAndFormatAiResponse = (text) => {
  if (!text || typeof text !== 'string') return text;

  let cleaned = text;

  // Replace HTML line breaks (<br>, <br/>, <br />) with real newlines
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

  // Convert markdown table rows with pipes '|' into clean bullet points
  if (cleaned.includes('|')) {
    const lines = cleaned.split('\n');
    const processedLines = lines.map(line => {
      // Ignore separator lines like |---|---|
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
        return '';
      }
      // If line contains markdown table cells
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          // Skip table header row if it contains generic labels like "Topic" & "Key Points"
          if (parts[0].toLowerCase() === 'topic' && parts[1].toLowerCase().includes('point')) {
            return '';
          }
          return `• **${parts[0]}**: ${parts[1]}`;
        }
      }
      // Replace inline pipes used as column separators with clean spacing/bullets
      if (line.includes('||')) {
        return line.replace(/\|\|/g, '\n• ');
      }
      return line;
    });

    cleaned = processedLines.filter(line => line !== '').join('\n');
  }

  // Normalize 3+ consecutive newlines into double newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

/**
 * Calls Groq AI to get a response to user message.
 * Supports conversational flow with history context.
 * @param {string} userMessage - The current message from the user.
 * @param {Array} history - The message history in local state.
 * @returns {Promise<string>} The response text from the AI.
 */
export const getLoveBotResponse = async (userMessage, history = []) => {
  if (!userMessage || !userMessage.trim()) {
    return "Hi! How can I assist you today? 😊";
  }

  const cleanUserMessage = userMessage.trim();
  const apiKey = getEffectiveApiKey();

  const systemPrompt = `You are jerry Bot ✨, an intelligent, versatile, and friendly AI personal assistant (built into the Juicy app). You function like ChatGPT and Meta AI. Provide clear, smart, concise answers to any question. IMPORTANT: Always format output as clean plain text with standard line breaks (\\n) and bullet points. Never use Markdown tables (no '|' pipes) or HTML tags like <br>.`;

  // Build conversation history in Groq/OpenAI chat format
  const recentHistory = (history || [])
    .slice(-6)
    .map(msg => ({
      role: (msg.sender === 'You' || msg.senderId !== 'lovebot') ? 'user' : 'assistant',
      content: typeof msg.text === 'string' ? msg.text : ''
    }))
    .filter(m => m.content.trim() !== '');

  // Add system prompt and current user message
  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: cleanUserMessage }
  ];

  const callGroq = async (modelName) => {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        return cleanAndFormatAiResponse(text.trim());
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn(`Groq API error (${modelName}):`, errData);
      throw new Error(`Groq API failed with status ${response.status}`);
    }
  };

  try {
    return await callGroq(PRIMARY_MODEL);
  } catch (primaryError) {
    console.warn('Attempting fallback model due to:', primaryError.message);
    try {
      return await callGroq(FALLBACK_MODEL);
    } catch (fallbackError) {
      console.warn('Fallback model also failed:', fallbackError.message);
    }
  }

  // Fallback error message if all attempts fail
  return "⚠️ I'm having trouble connecting right now. Please check your internet connection and try again shortly.";
};
