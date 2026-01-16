import { Routes, Route } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import MatchDashboard from './components/MatchDashboard';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatInterface />} />
      <Route path="/match/:matchId" element={<MatchDashboard />} />
    </Routes>
  );
}

export default App;
