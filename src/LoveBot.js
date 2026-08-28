const getEffectiveApiKey = () => {
  return (process.env.REACT_APP_GROQ_API_KEY || '').trim();
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';



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
 * Calls AI to get a response to user message.
 * Supports ChatGPT/Meta AI conversational flow with history context.
 * @param {string} userMessage - The current message from the user.
 * @param {Array} history - The message history in local state.
 * @returns {Promise<string>} The response text from the AI.
 */
export const getLoveBotResponse = async (userMessage, history = []) => {
  if (!userMessage || !userMessage.trim()) {
    return "Hi! How can I assist you today? 😊";
  }

  const cleanUserMessage = userMessage.trim();
  let apiKey = getEffectiveApiKey();

  const systemPrompt = `You are jerry Bot ✨, an intelligent, versatile, and friendly AI personal assistant (built into the Juicy app). You function like ChatGPT and Meta AI. Provide clear, smart, concise answers to any question. IMPORTANT: Always format output as clean plain text with standard line breaks (\\n) and bullet points. Never use Markdown tables (no '|' pipes) or HTML tags like <br>.`;

  const recentHistory = history.slice(-6).map(msg => ({
    role: (msg.sender === 'You' || msg.senderId !== 'lovebot') ? 'user' : 'assistant',
    content: msg.text || ''
  })).filter(m => m.content.trim() !== '');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: cleanUserMessage }
  ];

  const makeApiCall = async (keyToUse) => {
    return fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 400
      })
    });
  };

  try {
    const response = await makeApiCall(apiKey);

    if (response.ok) {
      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        return cleanAndFormatAiResponse(data.choices[0].message.content.trim());
      }
    }
  } catch (error) {
    console.warn('Groq API error:', error.message);
  }

  // Fallback error message if all attempts fail
  return "⚠️ I'm having trouble connecting right now. Please check your internet connection and try again shortly.";
};

