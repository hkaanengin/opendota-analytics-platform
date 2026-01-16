import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatchAnalysis } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import './MatchDashboard.css';

function MatchDashboard() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (matchId) {
      fetchAnalysis(matchId);
    }
  }, [matchId]);

  const fetchAnalysis = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMatchAnalysis(id);
      console.log('Received analysis data:', data);
      console.log('Overview content length:', data?.sections?.overview?.content?.length);
      console.log('Teamfights content length:', data?.sections?.teamfights?.content?.length);
      console.log('Players content length:', data?.sections?.players?.content?.length);
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Analyzing Match...</h2>
          <p>Our AI agents are working hard to analyze this match</p>
          <p className="loading-detail">This usually takes 2-3 minutes</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Error Loading Match Analysis</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Back to Chat</button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Chat
      </button>

      <MatchHeader analysis={analysis} />
      <MatchOverview content={analysis.sections.overview.content} metadata={analysis.metadata} />
      <TeamfightAnalysis content={analysis.sections.teamfights.content} />
      <PlayerPerformance content={analysis.sections.players.content} metadata={analysis.metadata} />
    </div>
  );
}

// Match Header Component
function MatchHeader({ analysis }) {
  const { match_id, metadata, processing_time_ms, agents_used } = analysis;

  return (
    <div className="match-header">
      <div className="header-main">
        <h1>Match Analysis</h1>
        <div className="match-id">#{match_id}</div>
      </div>
      <div className="header-stats">
        <div className="stat-card winner">
          <div className={`winner-badge ${metadata.winner.toLowerCase()}`}>
            {metadata.winner} Victory
          </div>
          <div className="score">
            {metadata.radiant_score} - {metadata.dire_score}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Duration</div>
          <div className="stat-value">{metadata.duration}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Processing Time</div>
          <div className="stat-value">{(processing_time_ms / 1000).toFixed(1)}s</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Agents</div>
          <div className="stat-value">{agents_used}</div>
        </div>
      </div>
    </div>
  );
}

// Match Overview Component
function MatchOverview({ content, metadata }) {
  // Extract timeline events from content
  const timelineEvents = extractTimelineEvents(content);

  return (
    <div className="section match-overview">
      <h2 className="section-title">Match Overview</h2>

      <div className="overview-grid">
        <div className="overview-narrative">
          <div className="narrative-content">
            {content.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="timeline-container">
          <h3>Key Events Timeline</h3>
          <div className="timeline">
            {timelineEvents.map((event, idx) => (
              <div key={idx} className="timeline-event">
                <div className="event-time">{event.time}</div>
                <div className="event-marker"></div>
                <div className="event-description">{event.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Teamfight Analysis Component
function TeamfightAnalysis({ content }) {
  console.log('TeamfightAnalysis received content:', content?.substring(0, 100));
  const teamfightData = parseTeamfightContent(content);
  console.log('Parsed teamfight data:', teamfightData);

  return (
    <div className="section teamfight-analysis">
      <h2 className="section-title">Teamfight Analysis</h2>

      <div className="teamfight-summary">
        <div className="summary-stat">
          <div className="stat-number">{teamfightData.totalFights}</div>
          <div className="stat-label">Total Teamfights</div>
        </div>
        <div className="teamfight-winrate-chart">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={teamfightData.winRateData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {teamfightData.winRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-title">Teamfight Win Rate</div>
        </div>
      </div>

      <div className="critical-teamfights">
        <h3>Critical Teamfights</h3>
        {teamfightData.criticalFights.map((fight, idx) => (
          <div key={idx} className="teamfight-card">
            <div className="fight-header">
              <div className="fight-title">{fight.title}</div>
              <div className={`impact-badge impact-${fight.impact.toLowerCase().replace(' ', '-')}`}>
                {fight.impact} Impact
              </div>
            </div>
            <div className="fight-details">
              <div className="detail-row">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{fight.timestamp}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Gold Swing:</span>
                <span className="detail-value gold">{fight.goldSwing}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">XP Swing:</span>
                <span className="detail-value xp">{fight.xpSwing}</span>
              </div>
            </div>
            <div className="fight-description">{fight.description}</div>
          </div>
        ))}
      </div>

      {teamfightData.impactfulPlayer && (
        <div className="impactful-player">
          <h3>Most Impactful Player</h3>
          <div className="player-highlight">
            <div className="player-name">{teamfightData.impactfulPlayer}</div>
            <p>{teamfightData.impactfulPlayerDesc}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Player Performance Component
function PlayerPerformance({ content, metadata }) {
  console.log('PlayerPerformance received content:', content?.substring(0, 100));
  const playerData = parsePlayerContent(content);
  console.log('Parsed player data:', playerData);

  return (
    <div className="section player-performance">
      <h2 className="section-title">Player Performance</h2>

      {playerData.mvp && (
        <div className="mvp-section">
          <div className="mvp-card">
            <div className="mvp-badge">🏆 MVP</div>
            <div className="mvp-name">{playerData.mvp.name}</div>
            <div className="mvp-stats">
              <div className="mvp-stat">
                <div className="stat-label">KDA</div>
                <div className="stat-value">{playerData.mvp.kda}</div>
              </div>
              <div className="mvp-stat">
                <div className="stat-label">Hero Damage</div>
                <div className="stat-value">{playerData.mvp.heroDamage}</div>
              </div>
              <div className="mvp-stat">
                <div className="stat-label">Tower Damage</div>
                <div className="stat-value">{playerData.mvp.towerDamage}</div>
              </div>
            </div>
            <div className="mvp-description">{playerData.mvp.description}</div>
          </div>
        </div>
      )}

      <div className="teams-comparison">
        <div className="team-section radiant">
          <h3 className="team-header">
            <span className="team-name">Radiant</span>
            {metadata.winner === 'Radiant' && <span className="victory-badge">Victory</span>}
          </h3>
          <div className="players-grid">
            {playerData.radiantPlayers.map((player, idx) => (
              <PlayerCard key={idx} player={player} />
            ))}
          </div>
        </div>

        <div className="team-section dire">
          <h3 className="team-header">
            <span className="team-name">Dire</span>
            {metadata.winner === 'Dire' && <span className="victory-badge">Victory</span>}
          </h3>
          <div className="players-grid">
            {playerData.direPlayers.map((player, idx) => (
              <PlayerCard key={idx} player={player} />
            ))}
          </div>
        </div>
      </div>

      <div className="performance-summary">
        <h3>Performance Summary</h3>
        <div className="summary-content">
          {playerData.summary.split('\n\n').map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Player Card Component
function PlayerCard({ player }) {
  const performanceClass = player.performance.toLowerCase().replace(' ', '-');

  return (
    <div className={`player-card performance-${performanceClass}`}>
      <div className="player-header">
        <div className="player-info">
          <div className="hero-name">{player.hero}</div>
          <div className="player-name">{player.name}</div>
        </div>
        <div className={`performance-badge ${performanceClass}`}>
          {player.performance}
        </div>
      </div>
      <div className="player-stats">
        <div className="kda-display">
          <span className="kills">{player.kills}</span>
          <span className="separator">/</span>
          <span className="deaths">{player.deaths}</span>
          <span className="separator">/</span>
          <span className="assists">{player.assists}</span>
        </div>
      </div>
      <div className="player-highlights">
        {player.highlights.map((highlight, idx) => (
          <div key={idx} className="highlight-item">{highlight}</div>
        ))}
      </div>
    </div>
  );
}

// Helper Functions
function extractTimelineEvents(content) {
  const events = [];
  const timeRegex = /(\d+:\d+)/g;
  const sentences = content.split(/[.!]/).filter(s => s.trim());

  sentences.forEach(sentence => {
    const match = sentence.match(timeRegex);
    if (match) {
      match.forEach(time => {
        if (sentence.toLowerCase().includes('tower') ||
            sentence.toLowerCase().includes('roshan') ||
            sentence.toLowerCase().includes('barracks') ||
            sentence.toLowerCase().includes('first blood')) {
          events.push({
            time,
            description: sentence.trim().substring(0, 100)
          });
        }
      });
    }
  });

  return events.slice(0, 10); // Limit to 10 key events
}

function parseTeamfightContent(content) {
  const lines = content.split('\n');

  // Extract total fights - more flexible regex
  let totalFights = 0;
  const totalPatterns = [
    /total of \*\*(\d+) teamfights?\*\*/i,
    /\*\*(\d+) teamfights?\*\*/i,
    /(\d+) teamfights? in total/i,
    /featured (?:a total of )?(\d+) teamfights?/i
  ];

  for (const pattern of totalPatterns) {
    const match = content.match(pattern);
    if (match) {
      totalFights = parseInt(match[1]);
      break;
    }
  }

  // Extract win rates - more flexible
  const team1WinMatch = content.match(/(?:Team 1|Radiant)[^:]*Wins?[^:]*:\s*(\d+)/i);
  const team2WinMatch = content.match(/(?:Team 2|Dire)[^:]*Wins?[^:]*:\s*(\d+)/i);
  const team1Wins = team1WinMatch ? parseInt(team1WinMatch[1]) : 0;
  const team2Wins = team2WinMatch ? parseInt(team2WinMatch[1]) : 0;

  const winRateData = [
    { name: 'Radiant', value: team1Wins, color: '#92cc41' },
    { name: 'Dire', value: team2Wins, color: '#c23c2a' }
  ];

  // Extract critical teamfights - more flexible regex
  const criticalFights = [];
  const fightRegex = /###?\s*Critical Teamfight \d+[:\-\s]*(.+?)\n[^]*?\*\*Timestamp[^:]*:\*\*[^(]*\(([^)]+)\)[^]*?(?:\*\*Gold and XP Swing:\*\*|\*\*Gold\/XP Swing:\*\*)[^:]*:?\s*([^\n]+)/gi;

  let match;
  while ((match = fightRegex.exec(content)) !== null) {
    const [fullMatch, title, timestamp, swings] = match;
    const goldMatch = swings.match(/([+-]?\d+,?\d*)\s*gold/i);
    const xpMatch = swings.match(/([+-]?\d+,?\d*)\s*(?:XP|experience)/i);

    // Extract impact
    const impactMatch = fullMatch.match(/\*\*Impact[^:]*:\*\*[^*]*\*\*([^*]+?)\*\*/i);
    const impact = impactMatch ? impactMatch[1].trim() : 'High';

    criticalFights.push({
      title: title.trim(),
      timestamp: timestamp.trim(),
      goldSwing: goldMatch ? goldMatch[1] : 'N/A',
      xpSwing: xpMatch ? xpMatch[1] : 'N/A',
      impact: impact.replace(/\./g, ''),
      description: fullMatch.split(/What happened[^:]*:/i)[1]?.split('*')[0]?.trim().substring(0, 200) || ''
    });
  }

  // Extract impactful player - more flexible
  let impactfulPlayer = null;
  let impactfulPlayerDesc = '';

  const impactfulPatterns = [
    /Most Impactful Player[^:]*:[^*]*\*\*([^*]+?)\*\*/i,
    /most impactful[^:]*was[^*]*\*\*([^*]+?)\*\*/i,
    /\*\*([^*]+?)\*\*[^.]*?most impactful/i
  ];

  for (const pattern of impactfulPatterns) {
    const match = content.match(pattern);
    if (match) {
      impactfulPlayer = match[1].trim();
      impactfulPlayerDesc = content.split(/Most Impactful Player/i)[1]?.split('\n\n')[0] || '';
      break;
    }
  }

  return {
    totalFights,
    winRateData,
    criticalFights,
    impactfulPlayer,
    impactfulPlayerDesc
  };
}

function parsePlayerContent(content) {
  // Extract MVP - more flexible regex
  let mvp = null;

  // Try multiple patterns for MVP
  const mvpPatterns = [
    /\*\*(.+?)\s*\((.+?)\)\*\*[^]*?(?:is the|candidate is)[^]*?MVP[^]*?KDA[^(]*\((\d+\/\d+\/\d+)\)[^]*?Hero Damage[^(]*\((\d+,?\d*)\)[^]*?Tower Damage[^(]*\((\d+,?\d*)\)/i,
    /MVP[^:]*:[^*]*\*\*(.+?)\s*\((.+?)\)\*\*[^]*?(\d+\/\d+\/\d+)[^]*?(\d+,?\d+)[^]*?(\d+,?\d+)/i,
    /\*\*(.+?)\s*\((.+?)\)\*\*[^]*?MVP[^]*?(\d+\/\d+\/\d+)/i
  ];

  for (const pattern of mvpPatterns) {
    const match = content.match(pattern);
    if (match) {
      mvp = {
        hero: match[1].trim(),
        name: match[2].trim(),
        kda: match[3] || 'N/A',
        heroDamage: match[4] || 'N/A',
        towerDamage: match[5] || 'N/A',
        description: content.split(/MVP[^:]*:/)[1]?.split('\n\n')[0] || ''
      };
      break;
    }
  }

  // Parse Radiant players - more flexible splitting
  let radiantSection = '';
  if (content.includes('**Radiant Team Performance')) {
    radiantSection = content.split('**Radiant Team Performance')[1]?.split('**Dire Team Performance')[0] || '';
  } else if (content.includes('Radiant')) {
    // Try alternate format
    radiantSection = content.split(/Radiant[^:]*:/)[1]?.split(/Dire[^:]*:/)[0] || '';
  }
  const radiantPlayers = parseTeamPlayers(radiantSection);

  // Parse Dire players - more flexible
  let direSection = '';
  if (content.includes('**Dire Team Performance')) {
    direSection = content.split('**Dire Team Performance')[1]?.split(/\*\*(?:Standout|Team Performance Comparison)/)[0] || '';
  } else if (content.includes('Dire')) {
    direSection = content.split(/Dire[^:]*:/)[1]?.split(/\*\*(?:Standout|Summary)/)[0] || '';
  }
  const direPlayers = parseTeamPlayers(direSection);

  // Summary
  const summary = content.split('**Team Performance Comparison')[1] || content.split('Standout Performances')[1] || '';

  return {
    mvp,
    radiantPlayers,
    direPlayers,
    summary
  };
}

function parseTeamPlayers(section) {
  const players = [];

  // Try multiple regex patterns for player parsing
  const playerPatterns = [
    /\*\*(.+?)\s*\((.+?)\)\*\*([^]*?)Overall Performance:[^*]*\*\*([^*]+?)\*\*/gi,
    /\*\*(.+?)\s*\((.+?)\)\*\*([^]*?)Performance:[^*]*\*\*([^*]+?)\*\*/gi,
    /\*\*(.+?)\s*\((.+?)\)\*\*[^]*?(\d+\/\d+\/\d+)[^]*?(?:Exceptional|Good|Average|Below Average)/gi
  ];

  for (const playerRegex of playerPatterns) {
    playerRegex.lastIndex = 0; // Reset regex
    let match;

    while ((match = playerRegex.exec(section)) !== null) {
      const [fullMatch, hero, name, details, performance] = match;

      // Extract KDA
      const kdaMatch = details.match(/(\d+)\/(\d+)\/(\d+)/);
      const kills = kdaMatch ? kdaMatch[1] : '0';
      const deaths = kdaMatch ? kdaMatch[2] : '0';
      const assists = kdaMatch ? kdaMatch[3] : '0';

      // Extract performance if not captured
      let perfRating = performance || '';
      if (!perfRating) {
        const perfMatch = fullMatch.match(/(?:Exceptional|Good|Average|Below Average)/i);
        perfRating = perfMatch ? perfMatch[0] : 'Average';
      }

      // Extract highlights
      const highlights = [];
      if (details.includes('%')) {
        const percentMatches = details.match(/(\w+(?:\s+\w+)?)\/min[^(]*\((\d+(?:\.\d+)?)%\)/gi);
        if (percentMatches) {
          percentMatches.slice(0, 3).forEach(h => highlights.push(h));
        }
      }

      // Only add if we have valid data
      if (kdaMatch) {
        players.push({
          hero: hero.trim(),
          name: name.trim(),
          kills,
          deaths,
          assists,
          performance: perfRating.trim(),
          highlights: highlights.length > 0 ? highlights : [details.substring(0, 80).trim() + '...']
        });
      }
    }

    // If we found players, stop trying other patterns
    if (players.length > 0) break;
  }

  return players;
}

export default MatchDashboard;
