import { useState } from 'react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <div className="chat-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Dota 2 players, matches, heroes…"
          className="chat-input"
          disabled={isLoading}
          rows={1}
        />
        <button
          type="submit"
          className="send-button"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? 'Sending' : 'Send'} <kbd>↵</kbd>
        </button>
      </div>
      <div className="chat-input-hints">
        <span className="hint-status">
          Claude · {isLoading ? 'streaming' : 'ready'}
        </span>
        <span className="hint-shortcut">
          <kbd>Shift</kbd> + <kbd>↵</kbd> for newline
        </span>
      </div>
    </form>
  );
};

export default ChatInput;
