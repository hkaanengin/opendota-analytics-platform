import './ChatMessage.css';

const ChatMessage = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="message-header">
        <span className="message-role">{isUser ? 'You' : 'Dota 2 Assistant'}</span>
      </div>
      <div className="message-content">
        {content}
      </div>
    </div>
  );
};

export default ChatMessage;
