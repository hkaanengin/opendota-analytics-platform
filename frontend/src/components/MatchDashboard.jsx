import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatchAnalysis, getTeamfightSummary } from '../services/api';
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

// Objective Icon SVG Components
const TowerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="objective-icon">
    <path d="M12 2L8 6v2H6v2H4v10h6v-4h4v4h6V10h-2V8h-2V6l-4-4zm0 3.4L14 7.4V9h2v2h2v7h-2v-4H8v4H6v-7h2V9h2V7.4l2-2z"/>
    <rect x="10" y="11" width="4" height="3" rx="0.5"/>
  </svg>
);

const RoshanIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="objective-icon roshan-icon">
    <ellipse cx="12" cy="13" rx="8" ry="7"/>
    <circle cx="9" cy="11" r="1.5" fill="#0f172a"/>
    <circle cx="15" cy="11" r="1.5" fill="#0f172a"/>
    <path d="M8 16c0 0 2 2 4 2s4-2 4-2" stroke="#0f172a" strokeWidth="1.5" fill="none"/>
    <path d="M6 8L4 4M18 8L20 4M8 6L7 3M16 6L17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CourierIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="objective-icon">
    <ellipse cx="12" cy="14" rx="6" ry="5"/>
    <circle cx="12" cy="8" r="4"/>
    <circle cx="10" cy="7" r="1" fill="#0f172a"/>
    <circle cx="14" cy="7" r="1" fill="#0f172a"/>
    <path d="M7 18l-2 3M17 18l2 3M10 19l-1 2M14 19l1 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <ellipse cx="12" cy="11" rx="1.5" ry="1" fill="#fbbf24"/>
  </svg>
);

const TormentorIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="objective-icon">
    <polygon points="12,2 22,12 12,22 2,12"/>
    <circle cx="12" cy="12" r="4" fill="#0f172a"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="#0f172a" strokeWidth="1.5"/>
  </svg>
);

const FirstBloodIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="objective-icon">
    <path d="M12 2C12 2 6 10 6 15c0 3.3 2.7 6 6 6s6-2.7 6-6c0-5-6-13-6-13z"/>
    <ellipse cx="10" cy="14" rx="1.5" ry="2" fill="rgba(255,255,255,0.3)"/>
  </svg>
);

const BarracksIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="objective-icon">
    <rect x="3" y="10" width="18" height="11" rx="1"/>
    <polygon points="12,3 2,10 22,10"/>
    <rect x="6" y="14" width="3" height="4" fill="#0f172a"/>
    <rect x="15" y="14" width="3" height="4" fill="#0f172a"/>
    <rect x="10" y="13" width="4" height="5" fill="#0f172a"/>
  </svg>
);

const AncientIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="objective-icon">
    <polygon points="12,1 15,8 23,9 17,14 19,22 12,18 5,22 7,14 1,9 9,8"/>
    <circle cx="12" cy="12" r="3" fill="#0f172a"/>
  </svg>
);

// Objective Icon Component with team glow
const ObjectiveIconWrapper = ({ type, team, description }) => {
  const getIcon = () => {
    // Check description for more specific icon selection
    const desc = (description || '').toLowerCase();

    if (type === 'roshan') return <RoshanIcon />;
    if (type === 'aegis') return <RoshanIcon />;
    if (desc.includes('aegis')) return <RoshanIcon />;
    if (type === 'tormentor') return <TormentorIcon />;
    if (type === 'first_blood') return <FirstBloodIcon />;
    if (type === 'courier') return <CourierIcon />;
    if (type === 'building') {
      if (desc.includes('rax') || desc.includes('barrack')) return <BarracksIcon />;
      if (desc.includes('ancient')) return <AncientIcon />;
      return <TowerIcon />;
    }
    return <TowerIcon />; // Default
  };

  return (
    <div className={`objective-icon-wrapper ${team || ''}`}>
      <div className="objective-icon-glow" />
      {getIcon()}
    </div>
  );
};

// Combined Advantage Chart Component (Gold + XP)
const AdvantageChart = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const svgRef = useRef(null);

  const width = 900;
  const height = 380;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 35;
  const paddingBottom = 50;

  if (!data || data.length === 0) return null;

  const goldValues = data.map(d => d.gold);
  const xpValues = data.map(d => d.xp);
  const allValues = [...goldValues, ...xpValues];

  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);

  // Calculate nice round numbers for Y-axis based on actual data
  const getNiceNumber = (val) => {
    if (val === 0) return 0;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(val))));
    const normalized = Math.abs(val) / magnitude;
    let nice;
    if (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 5) nice = 5;
    else nice = 10;
    return nice * magnitude * Math.sign(val);
  };

  // Add 15% padding to data range
  const padding = Math.max(Math.abs(dataMax), Math.abs(dataMin)) * 0.15 || 1000;
  const rawMin = dataMin - padding;
  const rawMax = dataMax + padding;

  // Always include 0 in the chart
  const chartMin = Math.min(rawMin, 0);
  const chartMax = Math.max(rawMax, 0);

  // Round to nice numbers
  const niceMin = chartMin < 0 ? -getNiceNumber(Math.abs(chartMin) * 1.1) : 0;
  const niceMax = getNiceNumber(chartMax * 1.1);

  const range = niceMax - niceMin || 1;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (i) => paddingLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
  const getY = (val) => paddingTop + chartHeight - ((val - niceMin) / range) * chartHeight;

  const goldPoints = data.map((d, i) => `${getX(i)},${getY(d.gold)}`).join(' ');
  const xpPoints = data.map((d, i) => `${getX(i)},${getY(d.xp)}`).join(' ');

  // Generate time labels (every 5 minutes for readability)
  const timeLabels = [];
  for (let i = 0; i < data.length; i += 5) {
    timeLabels.push({ index: i, label: `${i}:00` });
  }
  // Add last point if not already included
  if (data.length > 1 && (data.length - 1) % 5 !== 0) {
    timeLabels.push({ index: data.length - 1, label: `${data.length - 1}:00` });
  }

  // Generate Y-axis grid values dynamically
  const yGridValues = [];
  const gridStep = getNiceNumber((niceMax - niceMin) / 4);
  for (let v = niceMin; v <= niceMax + gridStep / 2; v += gridStep) {
    yGridValues.push(Math.round(v));
  }
  // Ensure 0 is included
  if (!yGridValues.includes(0) && niceMin < 0 && niceMax > 0) {
    yGridValues.push(0);
    yGridValues.sort((a, b) => b - a);
  }

  // Handle mouse move on SVG using native SVG coordinates
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    // Transform screen coordinates to SVG coordinates
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    // Calculate data index from SVG x coordinate
    const relativeX = svgP.x - paddingLeft;
    const dataIndex = Math.round((relativeX / chartWidth) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, dataIndex));

    // Check if within chart bounds
    if (svgP.x >= paddingLeft && svgP.x <= width - paddingRight) {
      setHoveredIndex(clampedIndex);
    } else {
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const formatValue = (val) => {
    if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(0)}k`;
    }
    return val.toString();
  };

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;
  const zeroY = getY(0);

  // Calculate tooltip position as percentage
  const tooltipLeftPercent = hoveredIndex !== null
    ? ((getX(hoveredIndex) - paddingLeft) / chartWidth) * 100
    : 0;

  return (
    <div className="advantage-chart-container">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="advantage-chart-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Radiant area (above zero) - subtle green tint */}
        <rect
          x={paddingLeft}
          y={paddingTop}
          width={chartWidth}
          height={Math.max(0, zeroY - paddingTop)}
          fill="rgba(74, 222, 128, 0.06)"
        />

        {/* Dire area (below zero) - subtle red tint */}
        <rect
          x={paddingLeft}
          y={zeroY}
          width={chartWidth}
          height={Math.max(0, height - paddingBottom - zeroY)}
          fill="rgba(248, 113, 113, 0.1)"
        />

        {/* Horizontal grid lines */}
        {yGridValues.map((val) => (
          <g key={val}>
            <line
              x1={paddingLeft}
              y1={getY(val)}
              x2={width - paddingRight}
              y2={getY(val)}
              stroke={val === 0 ? '#64748b' : '#334155'}
              strokeWidth={val === 0 ? 1.5 : 0.5}
            />
            <text
              x={paddingLeft - 10}
              y={getY(val) + 4}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="12"
            >
              {formatValue(val)}
            </text>
          </g>
        ))}

        {/* Team labels */}
        <text
          x={paddingLeft + 10}
          y={paddingTop + 18}
          fill="#4ade80"
          fontSize="13"
          fontWeight="600"
        >
          Radiant
        </text>
        <text
          x={paddingLeft + 10}
          y={height - paddingBottom - 8}
          fill="#f87171"
          fontSize="13"
          fontWeight="600"
        >
          Dire
        </text>

        {/* X-axis time labels */}
        {timeLabels.map(({ index, label }) => (
          <g key={index}>
            <line
              x1={getX(index)}
              y1={height - paddingBottom}
              x2={getX(index)}
              y2={height - paddingBottom + 5}
              stroke="#475569"
              strokeWidth="1"
            />
            <text
              x={getX(index)}
              y={height - paddingBottom + 20}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              {label}
            </text>
          </g>
        ))}

        {/* XP Line (light purple) */}
        <polyline
          points={xpPoints}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Gold Line (yellow/gold) */}
        <polyline
          points={goldPoints}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Hover indicator */}
        {hoveredIndex !== null && hoveredData && (
          <>
            {/* Vertical line */}
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop}
              x2={getX(hoveredIndex)}
              y2={height - paddingBottom}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            {/* Gold point */}
            <circle
              cx={getX(hoveredIndex)}
              cy={getY(hoveredData.gold)}
              r="6"
              fill="#fbbf24"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* XP point */}
            <circle
              cx={getX(hoveredIndex)}
              cy={getY(hoveredData.xp)}
              r="6"
              fill="#a78bfa"
              stroke="#0f172a"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && hoveredData && (
        <div
          className="advantage-tooltip"
          style={{
            left: `calc(${paddingLeft / width * 100}% + ${tooltipLeftPercent}% * ${chartWidth / width})`,
          }}
        >
          <div className="advantage-tooltip-time">{hoveredIndex}:00</div>
          <div className="advantage-tooltip-row">
            <span className="advantage-tooltip-dot gold"></span>
            <span className="advantage-tooltip-label">Gold:</span>
            <span className={`advantage-tooltip-value ${hoveredData.gold >= 0 ? 'radiant' : 'dire'}`}>
              {hoveredData.gold >= 0 ? '+' : ''}{hoveredData.gold.toLocaleString()}
            </span>
          </div>
          <div className="advantage-tooltip-row">
            <span className="advantage-tooltip-dot xp"></span>
            <span className="advantage-tooltip-label">XP:</span>
            <span className={`advantage-tooltip-value ${hoveredData.xp >= 0 ? 'radiant' : 'dire'}`}>
              {hoveredData.xp >= 0 ? '+' : ''}{hoveredData.xp.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="advantage-legend">
        <div className="advantage-legend-item">
          <span className="advantage-legend-dot xp"></span>
          <span>Experience</span>
        </div>
        <div className="advantage-legend-item">
          <span className="advantage-legend-dot gold"></span>
          <span>Gold</span>
        </div>
      </div>
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
  const [teamfightSummary, setTeamfightSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const summaryCacheRef = useRef({});  // Cache summaries by teamfight index

  useEffect(() => {
    if (matchId) {
      fetchMatchData(matchId);
      // Clear summary cache when loading a new match
      summaryCacheRef.current = {};
      setSelectedTeamfight(null);
      setTeamfightSummary(null);
    }
  }, [matchId]);

  // Fetch teamfight summary when a teamfight is selected (with caching)
  useEffect(() => {
    if (selectedTeamfight === null || !matchData?.teamfights_summary?.teamfights?.[selectedTeamfight]) {
      setTeamfightSummary(null);
      return;
    }

    // Check cache first
    if (summaryCacheRef.current[selectedTeamfight]) {
      setTeamfightSummary(summaryCacheRef.current[selectedTeamfight]);
      setSummaryLoading(false);
      return;
    }

    // Fetch from API
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setTeamfightSummary(null);
      try {
        const teamfight = matchData.teamfights_summary.teamfights[selectedTeamfight];
        const response = await getTeamfightSummary(teamfight);
        const summary = response.summary;
        setTeamfightSummary(summary);
        // Cache the result
        summaryCacheRef.current[selectedTeamfight] = summary;
      } catch (err) {
        console.error('Failed to fetch teamfight summary:', err);
        setTeamfightSummary('Failed to generate summary.');
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [selectedTeamfight, matchData]);

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

      {/* Radiant Advantage Chart (Gold & XP) */}
      <div className="card section-card">
        <h2 className="section-title">
          <TrendingUp className="section-icon yellow" />
          Gold & XP Advantage
        </h2>
        <AdvantageChart data={advantageData} />
      </div>

      {/* Match Timeline */}
      <div className="card section-card">
        <h2 className="section-title">
          <Zap className="section-icon purple" />
          Match Timeline
        </h2>

        <div className="timeline-container">
          {/* Teamfight row (above line) */}
          <div className="timeline-row teamfights-row">
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
          </div>

          {/* Timeline line */}
          <div className="timeline-line" />

          {/* Objectives row (below line) */}
          <div className="timeline-row objectives-row">
            {objectives.map((obj, idx) => {
              // Parse time - handle both "MM:SS" string format and seconds number
              const objTimeSeconds = parseTimeToSeconds(obj.time);
              const position = (objTimeSeconds / durationSeconds) * 100;

              // Get display title
              const getObjectiveTitle = () => {
                if (obj.description) return obj.description;
                switch (obj.type) {
                  case 'roshan': return 'Roshan Kill';
                  case 'tormentor': return 'Tormentor Kill';
                  case 'first_blood': return 'First Blood';
                  case 'building': return 'Building Destroyed';
                  case 'courier': return 'Courier Killed';
                  default: return 'Objective';
                }
              };

              return (
                <div
                  key={`obj-${idx}`}
                  className="timeline-marker objective-icon-marker"
                  style={{ left: `${Math.min(Math.max(position, 2), 98)}%` }}
                  onMouseEnter={() => setHoveredItem({ type: 'objective', index: idx })}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <ObjectiveIconWrapper
                    type={obj.type}
                    team={obj.team}
                    description={obj.description}
                  />
                  {hoveredItem?.type === 'objective' && hoveredItem.index === idx && (
                    <div className="timeline-tooltip below">
                      <div className="tooltip-title">{getObjectiveTitle()}</div>
                      <div className="tooltip-detail">Time: {obj.time}</div>
                      {obj.team && (
                        <div className={`tooltip-detail ${obj.team}`}>
                          Team: {obj.team.charAt(0).toUpperCase() + obj.team.slice(1)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
            <div className="legend-icon-wrapper radiant">
              <TowerIcon />
            </div>
            <span>Tower</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon-wrapper radiant">
              <BarracksIcon />
            </div>
            <span>Barracks</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon-wrapper">
              <RoshanIcon />
            </div>
            <span>Roshan</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon-wrapper">
              <TormentorIcon />
            </div>
            <span>Tormentor</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon-wrapper">
              <CourierIcon />
            </div>
            <span>Courier</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon-wrapper">
              <FirstBloodIcon />
            </div>
            <span>First Blood</span>
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
            <div className="teamfight-summary">
              <div className="teamfight-summary-label">AI Summary</div>
              {summaryLoading ? (
                <div className="teamfight-summary-loading">Generating summary...</div>
              ) : teamfightSummary ? (
                <div className="teamfight-summary-text">{teamfightSummary}</div>
              ) : null}
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
  const [isHovered, setIsHovered] = useState(false);

  // Calculate average of all benchmarks (excluding tower_damage)
  const calculateAvgBenchmark = () => {
    if (!player.benchmarks) return 0;
    const benchmarkKeys = [
      'gold_per_min',
      'xp_per_min',
      'kills_per_min',
      'last_hits_per_min',
      'hero_damage_per_min',
      'hero_healing_per_min'
    ];
    const values = benchmarkKeys
      .map(key => player.benchmarks[key]?.pct)
      .filter(val => val != null);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const benchmarkPct = calculateAvgBenchmark();

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num?.toFixed?.(0) || num || 0;
  };

  const getBenchmarkColor = (pct) => {
    if (pct < 20) return 'benchmark-red';
    if (pct < 40) return 'benchmark-orange';
    if (pct < 60) return 'benchmark-yellow';
    if (pct < 80) return 'benchmark-blue';
    return 'benchmark-green';
  };

  return (
    <div
      className={`player-card ${team}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

        {player.benchmarks && benchmarkPct > 0 && (
          <div className="benchmark-section">
            <div className="benchmark-title">Performance (Avg)</div>
            <div className="benchmark-bar">
              <div className={`benchmark-fill ${team}`} style={{ width: `${benchmarkPct}%` }} />
            </div>
            <div className="benchmark-label">{benchmarkPct.toFixed(1)}th percentile</div>
          </div>
        )}

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

      {/* Floating Popup on Hover */}
      {isHovered && (
        <div className={`player-popup ${team}`}>
          <div className="popup-header">
            <h4 className={`popup-hero ${team}`}>{player.hero_name}</h4>
            {player.personaname && <span className="popup-name">{player.personaname}</span>}
          </div>

          <div className="popup-content">
            {/* Two Column Layout */}
            <div className="popup-columns">
              {/* Left Column */}
              <div className="popup-column">
                <div className="popup-section-title">Combat</div>
                <div className="popup-stat">
                  <span>K/D/A</span>
                  <span>{player.kills}/{player.deaths}/{player.assists}</span>
                </div>
                <div className="popup-stat">
                  <span>Hero Damage</span>
                  <span className="damage">{formatNumber(player.hero_damage)}</span>
                </div>
                <div className="popup-stat">
                  <span>Tower Damage</span>
                  <span>{formatNumber(player.tower_damage)}</span>
                </div>
                <div className="popup-stat">
                  <span>Healing</span>
                  <span className="healing">{formatNumber(player.hero_healing)}</span>
                </div>
                <div className="popup-stat">
                  <span>Damage Taken</span>
                  <span className="damage">{formatNumber(player.damage_taken)}</span>
                </div>

                <div className="popup-section-title">Economy</div>
                <div className="popup-stat">
                  <span>Net Worth</span>
                  <span className="gold">{formatNumber(player.net_worth)}</span>
                </div>
                <div className="popup-stat">
                  <span>GPM / XPM</span>
                  <span className="gold">{player.gold_per_min} / {player.xp_per_min}</span>
                </div>
                <div className="popup-stat">
                  <span>Last Hits</span>
                  <span>{player.last_hits} / {player.denies}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="popup-column">
                <div className="popup-section-title">Game</div>
                <div className="popup-stat">
                  <span>Time Dead</span>
                  <span>{player.time_spent_dead || '0:00'}</span>
                </div>
                <div className="popup-stat">
                  <span>Fight Participation</span>
                  <span>{((player.teamfight_participation || 0) * 100).toFixed(0)}%</span>
                </div>

                {player.support_stats && (
                  <>
                    <div className="popup-section-title">Support</div>
                    <div className="popup-stat">
                      <span>Wards(O/S)</span>
                      <span>{player.support_stats.observer_placed || 0} / {player.support_stats.sentry_placed || 0}</span>
                    </div>
                    <div className="popup-stat">
                      <span>Camps Stacked</span>
                      <span>{player.support_stats.camp_stacked || 0}</span>
                    </div>
                    <div className="popup-stat">
                      <span>Stuns</span>
                      <span>{(player.support_stats.stuns || 0).toFixed(1)}s</span>
                    </div>
                  </>
                )}

                {player.benchmarks && (
                  <>
                    <div className="popup-section-title">Benchmarks</div>
                    <div className="popup-benchmarks">
                      {player.benchmarks.gold_per_min && (
                        <div className="popup-benchmark">
                          <span className={`popup-benchmark-value ${getBenchmarkColor(player.benchmarks.gold_per_min.pct)}`}>{player.benchmarks.gold_per_min.pct.toFixed(0)}%</span>
                          <span className="popup-benchmark-label">GPM</span>
                        </div>
                      )}
                      {player.benchmarks.xp_per_min && (
                        <div className="popup-benchmark">
                          <span className={`popup-benchmark-value ${getBenchmarkColor(player.benchmarks.xp_per_min.pct)}`}>{player.benchmarks.xp_per_min.pct.toFixed(0)}%</span>
                          <span className="popup-benchmark-label">XPM</span>
                        </div>
                      )}
                      {player.benchmarks.last_hits_per_min && (
                        <div className="popup-benchmark">
                          <span className={`popup-benchmark-value ${getBenchmarkColor(player.benchmarks.last_hits_per_min.pct)}`}>{player.benchmarks.last_hits_per_min.pct.toFixed(0)}%</span>
                          <span className="popup-benchmark-label">LH</span>
                        </div>
                      )}
                      {player.benchmarks.kills_per_min && (
                        <div className="popup-benchmark">
                          <span className={`popup-benchmark-value ${getBenchmarkColor(player.benchmarks.kills_per_min.pct)}`}>{player.benchmarks.kills_per_min.pct.toFixed(0)}%</span>
                          <span className="popup-benchmark-label">Kills</span>
                        </div>
                      )}
                      {player.benchmarks.hero_damage_per_min && (
                        <div className="popup-benchmark">
                          <span className={`popup-benchmark-value ${getBenchmarkColor(player.benchmarks.hero_damage_per_min.pct)}`}>{player.benchmarks.hero_damage_per_min.pct.toFixed(0)}%</span>
                          <span className="popup-benchmark-label">DMG</span>
                        </div>
                      )}
                      {player.benchmarks.hero_healing_per_min && (
                        <div className="popup-benchmark">
                          <span className={`popup-benchmark-value ${getBenchmarkColor(player.benchmarks.hero_healing_per_min.pct)}`}>{player.benchmarks.hero_healing_per_min.pct.toFixed(0)}%</span>
                          <span className="popup-benchmark-label">Heal</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Final Build - Full Width */}
            {player.items?.final_build && player.items.final_build.filter(item => item != null).length > 0 && (
              <div className="popup-build">
                <div className="popup-section-title">Final Build</div>
                <div className="popup-items">
                  {player.items.final_build.filter(item => item != null).map((item, i) => (
                    <span key={i} className="popup-item">{item}</span>
                  ))}
                  {player.items.neutral && (
                    <span className="popup-item neutral">{player.items.neutral}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchDashboard;
