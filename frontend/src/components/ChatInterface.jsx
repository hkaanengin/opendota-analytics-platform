import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { sendMessage, checkHealth } from '../services/api';
import '../App.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [matchId, setMatchId] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
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
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessage, messages);
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
      };
      setMessages(response.conversation_history);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure the backend is running.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeMatch = () => {
    if (matchId.trim()) {
      navigate(`/match/${matchId.trim()}`);
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

      <div className="match-analysis-panel">
        <input
          type="text"
          placeholder="Enter Match ID for detailed analysis..."
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeMatch()}
          className="match-id-input"
        />
        <button
          onClick={handleAnalyzeMatch}
          disabled={!matchId.trim()}
          className="analyze-button"
        >
          Analyze Match
        </button>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>Welcome to Dota 2 Assistant!</h2>
              <p>Ask me anything about Dota 2 players, matches, heroes, and statistics.</p>
              <p className="highlight">Or enter a Match ID above for comprehensive AI-powered analysis!</p>
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

export default ChatInterface;
