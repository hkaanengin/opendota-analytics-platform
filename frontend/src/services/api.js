const API_BASE_URL = 'http://localhost:8000';

export const sendMessage = async (message, conversationHistory) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

export const getAvailableTools = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tools`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching tools:', error);
    throw error;
  }
};
