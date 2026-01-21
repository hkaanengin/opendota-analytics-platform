import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatchAnalysis } from '../services/api';
import './MatchDashboard.css';

// Icon components
const Swords = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 3L3 21M9 3l3 3-4 4-3-3m9 9l3 3-4 4-3-3" />
  </svg>
);

const Trophy = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v5m-3 0h6m-3-5a7 7 0 01-7-7V5a2 2 0 012-2h10a2 2 0 012 2v3a7 7 0 01-7 7z" />
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Target = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <circle cx="12" cy="12" r="6" strokeWidth={2} />
    <circle cx="12" cy="12" r="2" strokeWidth={2} />
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const Zap = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// Simple Line Chart Component
const SimpleLineChart = ({ data, dataKey, color, title }) => {
  const width = 100;
  const height = 80;
  const padding = 10;

  if (!data || data.length === 0) return null;

  const values = data.map(d => d[dataKey]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d[dataKey] - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const gradientId = `gradient-${dataKey}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        {/* Grid lines */}
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />

        {/* Zero line if data crosses zero */}
        {minVal < 0 && maxVal > 0 && (
          <line
            x1={padding}
            y1={height - padding - ((-minVal) / range) * (height - 2 * padding)}
            x2={width - padding}
            y2={height - padding - ((-minVal) / range) * (height - 2 * padding)}
            stroke="#64748b"
            strokeWidth="1.5"
          />
        )}

        {/* Gradient fill */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill={`url(#${gradientId})`}
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <p className="chart-subtitle">{title}</p>
    </div>
  );
};

function MatchDashboard() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeamfight, setSelectedTeamfight] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    if (matchId) {
      fetchMatchData(matchId);
    }
  }, [matchId]);

  const fetchMatchData = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMatchAnalysis(id);
      console.log('Received match data:', response);
      setMatchData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatTime = (timeStr) => {
    if (typeof timeStr === 'string' && timeStr.includes(':')) return timeStr;
    const seconds = parseInt(timeStr);
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatItemName = (item) => {
    if (!item) return '';
    return item.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const parseTimeToSeconds = (timeStr) => {
    if (typeof timeStr === 'number') return timeStr;
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [mins, secs] = timeStr.split(':').map(Number);
    return mins * 60 + secs;
  };

  // Derived data
  const metadata = matchData?.metadata || {};
  const teamfights = matchData?.teamfights_summary?.teamfights || [];
  const objectives = matchData?.objectives || [];
  const players = matchData?.players_summary?.players || [];
  const goldAdvantage = matchData?.gold_advantage || [];
  const xpAdvantage = matchData?.xp_advantage || [];

  const radiantPlayers = players.filter(p => p.team === 'radiant');
  const direPlayers = players.filter(p => p.team === 'dire');

  const durationSeconds = useMemo(() => {
    if (!metadata.match_duration) return 3600;
    return parseTimeToSeconds(metadata.match_duration);
  }, [metadata.match_duration]);

  // Calculate team stats
  const radiantStats = useMemo(() => {
    return radiantPlayers.reduce((acc, p) => ({
      kills: acc.kills + (p.kills || 0),
      deaths: acc.deaths + (p.deaths || 0),
      assists: acc.assists + (p.assists || 0),
      netWorth: acc.netWorth + (p.net_worth || 0),
      heroDamage: acc.heroDamage + (p.hero_damage || 0),
      towerDamage: acc.towerDamage + (p.tower_damage || 0),
      heroHealing: acc.heroHealing + (p.hero_healing || 0)
    }), { kills: 0, deaths: 0, assists: 0, netWorth: 0, heroDamage: 0, towerDamage: 0, heroHealing: 0 });
  }, [radiantPlayers]);

  const direStats = useMemo(() => {
    return direPlayers.reduce((acc, p) => ({
      kills: acc.kills + (p.kills || 0),
      deaths: acc.deaths + (p.deaths || 0),
      assists: acc.assists + (p.assists || 0),
      netWorth: acc.netWorth + (p.net_worth || 0),
      heroDamage: acc.heroDamage + (p.hero_damage || 0),
      towerDamage: acc.towerDamage + (p.tower_damage || 0),
      heroHealing: acc.heroHealing + (p.hero_healing || 0)
    }), { kills: 0, deaths: 0, assists: 0, netWorth: 0, heroDamage: 0, towerDamage: 0, heroHealing: 0 });
  }, [direPlayers]);

  // Prepare advantage chart data
  const advantageData = useMemo(() => {
    return goldAdvantage.map((gold, idx) => ({
      time: idx * 60,
      gold: gold,
      xp: xpAdvantage[idx] || 0
    }));
  }, [goldAdvantage, xpAdvantage]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading Match Data...</h2>
          <p>Fetching match details from OpenDota</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Error Loading Match</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Back to Chat</button>
        </div>
      </div>
    );
  }

  if (!matchData) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Chat
      </button>

      {/* Header */}
      <div className="header">
        <Swords className="header-icon" />
        <div>
          <h1 className="title">Dota 2 Match Analysis</h1>
          <p className="subtitle">Match ID: {metadata.match_id} • Duration: {metadata.match_duration || 'N/A'}</p>
        </div>
      </div>

      {/* Basic Stats Cards */}
      <div className="grid-4">
        <div className="card">
          <div className="card-header">
            <Trophy className="card-icon yellow" />
            <span className="card-label">Winner</span>
          </div>
          <p className={`card-value ${metadata.radiant_win ? 'radiant' : 'dire'}`}>
            {metadata.radiant_win ? 'Radiant' : 'Dire'}
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <Clock className="card-icon blue" />
            <span className="card-label">Duration</span>
          </div>
          <p className="card-value">{metadata.match_duration || 'N/A'}</p>
        </div>

        <div className="card">
          <div className="card-header">
            <Zap className="card-icon purple" />
            <span className="card-label">Teamfights</span>
          </div>
          <p className="card-value">{matchData?.teamfights_summary?.count || 0}</p>
        </div>

        <div className="card">
          <div className="card-header">
            <Target className="card-icon green" />
            <span className="card-label">Objectives</span>
          </div>
          <p className="card-value">{objectives.length}</p>
        </div>
      </div>

      {/* Team Performance Comparison */}
      <div className="card section-card">
        <h2 className="section-title">
          <Shield className="section-icon red" />
          Team Performance
        </h2>

        {/* Kills */}
        <div className="team-comparison">
          <div className="team-stat">
            <div className="team-stat-value radiant">{metadata?.radiant_score ?? radiantStats.kills}</div>
            <div className="team-stat-label">Radiant</div>
          </div>
          <div className="vs-separator">Kills</div>
          <div className="team-stat">
            <div className="team-stat-value dire">{metadata?.dire_score ?? direStats.kills}</div>
            <div className="team-stat-label">Dire</div>
          </div>
        </div>

        {/* Net Worth */}
        <div className="team-comparison">
          <div className="team-stat">
            <div className="team-stat-value radiant">{(radiantStats.netWorth / 1000).toFixed(1)}k</div>
            <div className="team-stat-label">Radiant</div>
          </div>
          <div className="vs-separator">Net Worth</div>
          <div className="team-stat">
            <div className="team-stat-value dire">{(direStats.netWorth / 1000).toFixed(1)}k</div>
            <div className="team-stat-label">Dire</div>
          </div>
        </div>

        {/* Hero Damage */}
        <div className="team-comparison">
          <div className="team-stat">
            <div className="team-stat-value radiant">{(radiantStats.heroDamage / 1000).toFixed(1)}k</div>
            <div className="team-stat-label">Radiant</div>
          </div>
          <div className="vs-separator">Hero Damage</div>
          <div className="team-stat">
            <div className="team-stat-value dire">{(direStats.heroDamage / 1000).toFixed(1)}k</div>
            <div className="team-stat-label">Dire</div>
          </div>
        </div>

        {/* Healing */}
        <div className="team-comparison no-border">
          <div className="team-stat">
            <div className="team-stat-value radiant">{(radiantStats.heroHealing / 1000).toFixed(1)}k</div>
            <div className="team-stat-label">Radiant</div>
          </div>
          <div className="vs-separator">Healing</div>
          <div className="team-stat">
            <div className="team-stat-value dire">{(direStats.heroHealing / 1000).toFixed(1)}k</div>
            <div className="team-stat-label">Dire</div>
          </div>
        </div>
      </div>

      {/* Gold & XP Advantage Charts */}
      <div className="grid-2">
        <div className="card">
          <h3 className="section-title small">
            <TrendingUp className="section-icon yellow" />
            Gold Advantage Over Time
          </h3>
          <SimpleLineChart
            data={advantageData}
            dataKey="gold"
            color="#eab308"
            title="Positive values = Radiant advantage"
          />
        </div>

        <div className="card">
          <h3 className="section-title small">
            <TrendingUp className="section-icon purple" />
            XP Advantage Over Time
          </h3>
          <SimpleLineChart
            data={advantageData}
            dataKey="xp"
            color="#a855f7"
            title="Positive values = Radiant advantage"
          />
        </div>
      </div>

      {/* Match Timeline */}
      <div className="card section-card">
        <h2 className="section-title">
          <Zap className="section-icon purple" />
          Match Timeline
        </h2>

        <div className="timeline-container">
          <div className="timeline-line" />

          {/* Teamfight markers */}
          {teamfights.map((fight, idx) => {
            const fightStart = parseTimeToSeconds(fight.start);
            const position = (fightStart / durationSeconds) * 100;
            const goldDelta = fight.gold_swing || fight.radiant_gold_delta - fight.dire_gold_delta || 0;
            const winnerClass = goldDelta > 500 ? 'radiant-win' : goldDelta < -500 ? 'dire-win' : '';

            return (
              <div
                key={`fight-${idx}`}
                className={`timeline-marker teamfight-marker ${winnerClass}`}
                style={{ left: `${Math.min(Math.max(position, 2), 98)}%` }}
                onClick={() => setSelectedTeamfight(idx)}
                onMouseEnter={() => setHoveredItem({ type: 'teamfight', index: idx })}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {hoveredItem?.type === 'teamfight' && hoveredItem.index === idx && (
                  <div className="timeline-tooltip">
                    <div className="tooltip-title">Teamfight #{idx + 1}</div>
                    <div className="tooltip-detail">Time: {fight.start} - {fight.end}</div>
                    <div className="tooltip-detail">Deaths: {fight.deaths}</div>
                    <div className={`tooltip-detail ${goldDelta > 0 ? 'radiant' : 'dire'}`}>
                      Gold Swing: {goldDelta > 0 ? '+' : ''}{goldDelta}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Objective markers */}
          {objectives.map((obj, idx) => {
            const position = (obj.time / durationSeconds) * 100;
            let markerClass = 'objective-marker';

            if (obj.type === 'CHAT_MESSAGE_ROSHAN_KILL') {
              markerClass += ' roshan';
            } else if (obj.key?.includes('rax')) {
              markerClass += ' barracks';
            }

            return (
              <div
                key={`obj-${idx}`}
                className={`timeline-marker ${markerClass}`}
                style={{ left: `${Math.min(Math.max(position, 2), 98)}%`, top: 'calc(50% + 30px)' }}
                onMouseEnter={() => setHoveredItem({ type: 'objective', index: idx })}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {hoveredItem?.type === 'objective' && hoveredItem.index === idx && (
                  <div className="timeline-tooltip">
                    <div className="tooltip-title">
                      {obj.type === 'CHAT_MESSAGE_ROSHAN_KILL' ? 'Roshan Kill' :
                        obj.type === 'CHAT_MESSAGE_FIRSTBLOOD' ? 'First Blood' :
                          obj.key?.includes('rax') ? 'Barracks Destroyed' :
                            obj.key?.includes('tower') ? 'Tower Destroyed' :
                              obj.type === 'CHAT_MESSAGE_MINIBOSS_KILL' ? 'Tormentor Kill' :
                                'Objective'}
                    </div>
                    <div className="tooltip-detail">Time: {formatTime(obj.time)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="time-labels">
          <span>0:00</span>
          <span>10:00</span>
          <span>20:00</span>
          <span>30:00</span>
          <span>40:00</span>
          <span>50:00</span>
          <span>{metadata.match_duration || 'End'}</span>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot radiant-win" />
            <span>Radiant Won Fight</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot dire-win" />
            <span>Dire Won Fight</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot neutral" />
            <span>Close Fight</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot objective" />
            <span>Tower/Objective</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot roshan" />
            <span>Roshan</span>
          </div>
        </div>

        {/* Selected Teamfight Details */}
        {selectedTeamfight !== null && teamfights[selectedTeamfight] && (
          <div className="teamfight-details">
            <div className="teamfight-detail-header">
              <h3>Teamfight #{selectedTeamfight + 1} Details</h3>
              <button className="close-button" onClick={() => setSelectedTeamfight(null)}>
                Close
              </button>
            </div>
            <div className="teamfight-stats-grid">
              <div className="teamfight-stat">
                <div className="teamfight-stat-value">{teamfights[selectedTeamfight].start}</div>
                <div className="teamfight-stat-label">Start Time</div>
              </div>
              <div className="teamfight-stat">
                <div className="teamfight-stat-value">{teamfights[selectedTeamfight].end}</div>
                <div className="teamfight-stat-label">End Time</div>
              </div>
              <div className="teamfight-stat">
                <div className="teamfight-stat-value">
                  {parseTimeToSeconds(teamfights[selectedTeamfight].end) - parseTimeToSeconds(teamfights[selectedTeamfight].start)}s
                </div>
                <div className="teamfight-stat-label">Duration</div>
              </div>
              <div className="teamfight-stat">
                <div className="teamfight-stat-value">{teamfights[selectedTeamfight].deaths}</div>
                <div className="teamfight-stat-label">Deaths</div>
              </div>
              <div className="teamfight-stat">
                <div className={`teamfight-stat-value ${(teamfights[selectedTeamfight].gold_swing || 0) > 0 ? 'radiant' : 'dire'}`}>
                  {(teamfights[selectedTeamfight].gold_swing || 0) > 0 ? '+' : ''}
                  {teamfights[selectedTeamfight].gold_swing || 0}
                </div>
                <div className="teamfight-stat-label">Gold Swing</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player Cards */}
      <div className="players-section">
        <h2 className="section-title">
          <Shield className="section-icon green" />
          Radiant Players
        </h2>
        <div className="players-grid">
          {radiantPlayers.map((player, idx) => (
            <PlayerCard key={idx} player={player} team="radiant" formatItemName={formatItemName} />
          ))}
        </div>

        <h2 className="section-title" style={{ marginTop: '48px' }}>
          <Shield className="section-icon red" />
          Dire Players
        </h2>
        <div className="players-grid">
          {direPlayers.map((player, idx) => (
            <PlayerCard key={idx} player={player} team="dire" formatItemName={formatItemName} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Player Card Component
function PlayerCard({ player, team, formatItemName }) {
  const benchmarkPct = player.benchmarks?.gold_per_min?.pct || 0;

  return (
    <div className={`player-card ${team}`}>
      <h4 className={`player-hero ${team}`}>{player.hero_name}</h4>
      {player.personaname && <div className="player-name">{player.personaname}</div>}
      <div className="player-stats">
        <div className="player-stat-row">
          <span className="stat-label">K/D/A</span>
          <span className="stat-value">{player.kills}/{player.deaths}/{player.assists}</span>
        </div>
        <div className="player-stat-row">
          <span className="stat-label">Net Worth</span>
          <span className="stat-value gold">{(player.net_worth / 1000).toFixed(1)}k</span>
        </div>
        <div className="player-stat-row">
          <span className="stat-label">GPM</span>
          <span className="stat-value gold">{player.gold_per_min}</span>
        </div>
        <div className="player-stat-row">
          <span className="stat-label">Damage</span>
          <span className="stat-value damage">{(player.hero_damage / 1000).toFixed(1)}k</span>
        </div>

        {player.benchmarks?.gold_per_min && (
          <div className="benchmark-section">
            <div className="benchmark-title">Performance</div>
            <div className="benchmark-bar">
              <div className={`benchmark-fill ${team}`} style={{ width: `${benchmarkPct}%` }} />
            </div>
            <div className="benchmark-label">{benchmarkPct.toFixed(1)}th percentile</div>
          </div>
        )}

        {/* Item Timings */}
        {player.items?.key_timings && player.items.key_timings.length > 0 && (
          <div className="item-timings">
            <div className="item-timing-title">Key Item Timings</div>
            <div className="item-timing-list">
              {player.items.key_timings.slice(0, 5).map((item, i) => (
                <div key={i} className="item-timing">
                  <span className="item-name">{formatItemName(item.item)}</span>
                  <span className="item-time">{item.time_formatted || item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchDashboard;
