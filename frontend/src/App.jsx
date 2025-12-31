import { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { sendMessage, checkHealth } from './services/api';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check backend health on mount
    checkHealth()
      .then((data) => {
        setIsConnected(data.mcp_connected);
        console.log('Backend status:', data);
      })
      .catch((error) => {
        console.error('Failed to connect to backend:', error);
        setIsConnected(false);
      });
  }, []);

  const handleSendMessage = async (userMessage) => {
    // Add user message to chat
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Send to backend
      const response = await sendMessage(userMessage, messages);

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
      };
      setMessages(response.conversation_history);
    } catch (error) {
      // Show error message
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure the backend is running.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dota 2 Assistant</h1>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>Welcome to Dota 2 Assistant!</h2>
              <p>Ask me anything about Dota 2 players, matches, heroes, and statistics.</p>
              <div className="example-questions">
                <p>Try asking:</p>
                <ul>
                  <li>"How is player Topson performing?"</li>
                  <li>"Show me recent matches of Team Liquid"</li>
                  <li>"What are the most popular heroes this patch?"</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessage key={index} role={msg.role} content={msg.content} />
            ))
          )}
          {isLoading && (
            <div className="loading-indicator">
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;
