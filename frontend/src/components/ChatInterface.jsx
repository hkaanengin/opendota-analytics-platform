import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { sendMessage, checkHealth } from '../services/api';
import '../App.css';

const SUGGESTED_PROMPTS = [
  'How is player Topson performing?',
  'Show me recent matches of Team Liquid',
  'What are the most popular heroes this patch?',
  'Compare Invoker vs Rubick mid-lane win rates',
];

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
      })
      .catch(() => {
        setIsConnected(false);
      });
  }, []);

  const handleSendMessage = async (userMessage) => {
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessage, messages);
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
        <div className="header-brand">
          <div className="brand-icon" aria-hidden="true">D2</div>
          <div className="brand-text">
            <h1>Dota 2 Assistant</h1>
            <span className="brand-subtitle">Analytics Console</span>
          </div>
        </div>
        <div className="connection-pill" role="status" aria-live="polite">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'MCP connected' : 'MCP disconnected'}</span>
        </div>
      </header>

      <div className="match-analysis-panel">
        <span className="match-label">Match</span>
        <input
          type="text"
          placeholder="e.g. 7428991234"
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeMatch()}
          className="match-id-input"
          aria-label="Match ID"
        />
        <button
          onClick={handleAnalyzeMatch}
          disabled={!matchId.trim()}
          className="analyze-button"
        >
          Analyze <kbd>↵</kbd>
        </button>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-eyebrow">
                <span className="eyebrow-bar" aria-hidden="true"></span>
                <span>Start a conversation</span>
              </div>
              <h2>Ask anything about players, matches, heroes, and meta.</h2>
              <p className="welcome-lede">
                Natural-language queries over live Dota 2 data.
                <span className="dim"> Paste a Match ID above for a full AI-powered post-game breakdown.</span>
              </p>

              <div className="suggested-label">Suggested</div>
              <div className="suggested-grid">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="suggested-pill"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                  >
                    <span className="diamond" aria-hidden="true">◆</span>
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessage key={index} role={msg.role} content={msg.content} />
            ))
          )}
          {isLoading && (
            <div className="loading-indicator">
              <span>Thinking</span>
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
