import google.generativeai as genai
import asyncio
import logging
import json
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class SubAgent:
    """
    A specialized sub-agent that performs focused analysis on a specific aspect of match data.
    """

    def __init__(self, api_key: str, agent_name: str, system_instruction: str):
        """
        Initialize a sub-agent with specialized instructions.

        Args:
            api_key: Google Gemini API key
            agent_name: Name of this agent (e.g., "Overview Agent")
            system_instruction: Detailed instructions for what this agent should analyze
        """
        genai.configure(api_key=api_key)
        self.agent_name = agent_name
        self.model = genai.GenerativeModel(
            'models/gemini-2.5-flash',
            system_instruction=system_instruction
        )
        logger.info(f"Initialized {agent_name}")

    async def analyze(self, data: Dict[str, Any], prompt: str) -> Dict[str, Any]:
        """
        Analyze the provided data section and return detailed insights.

        Args:
            data: The data section to analyze (e.g., teamfights, player stats)
            prompt: The specific analysis request

        Returns:
            Dict containing analysis results with content and metadata
        """
        try:
            logger.info(f"{self.agent_name} starting analysis...")

            # Prepare the input
            data_json = json.dumps(data, indent=2)
            full_prompt = f"{prompt}\n\nData to analyze:\n{data_json}"

            # Generate analysis
            response = self.model.generate_content(full_prompt)

            logger.info(f"{self.agent_name} completed analysis")

            return {
                "agent": self.agent_name,
                "content": response.text,
                "status": "success"
            }

        except Exception as e:
            logger.error(f"{self.agent_name} failed: {e}")
            return {
                "agent": self.agent_name,
                "content": f"Analysis failed: {str(e)}",
                "status": "error"
            }


class MatchAnalysisOrchestrator:
    """
    Orchestrates multiple sub-agents to analyze different aspects of a Dota 2 match.
    """

    def __init__(self, api_key: str):
        """
        Initialize the orchestrator with sub-agents.

        Args:
            api_key: Google Gemini API key
        """
        self.api_key = api_key
        logger.info("Initializing Match Analysis Orchestrator")

        # Define agent configurations
        self.agent_configs = {
            "overview": {
                "name": "Match Overview Agent",
                "system_instruction": """You are a Dota 2 match overview analyst. Your role is to provide a comprehensive overview of the match.

            Analyze the provided match metadata and objectives to create a detailed overview that includes:
            1. Winner and victory type
            2. Match duration and game mode
            3. Score breakdown (kills)
            4. First blood timing and context
            5. Key objectives timeline (towers, barracks, Roshan kills with timestamps)
            6. Overall tempo assessment (early/mid/late game focused)
            7. Critical moments that defined the match

            Provide 8-12 sentences of detailed analysis. Be specific with timestamps and statistics.
            Structure your response in clear paragraphs."""
                        },
                        "teamfights": {
                            "name": "Teamfight Analysis Agent",
                            "system_instruction": """You are a Dota 2 teamfight analyst. Your role is to analyze teamfights and identify game-changing moments.

            Analyze the provided teamfight data to create a comprehensive breakdown that includes:
            1. Total number of teamfights
            2. Identify 3-5 critical teamfights that had the biggest impact on the match outcome
            3. For each critical teamfight:
            - Timestamp and location (based on death positions)
            - What happened (who initiated, key deaths, abilities used)
            - Gold and XP swing
            - Impact on match (High/Medium/Low with reasoning)
            4. Teamfight win rate for each team
            5. Most impactful player in teamfights

            Provide 15-20 sentences of detailed analysis. Be specific about which heroes did what.
            Use timestamps in MM:SS format. Structure your response with clear sections for each critical teamfight."""
                        },
                        "players": {
                            "name": "Player Performance Agent",
                            "system_instruction": """You are a Dota 2 player performance analyst. Your role is to analyze individual player performances comprehensively.

            Analyze the provided player data to create detailed performance assessments that include:
            1. Identify the MVP candidate(s) with clear reasoning
            2. For each of the 10 players, provide:
            - Hero name and player name
            - KDA analysis (kills/deaths/assists)
            - Benchmark highlights (which stats were exceptional - above 80th percentile, or poor - below 30th percentile)
            - Key contributions (hero damage, tower damage, healing if significant)
            - Item build effectiveness and timing analysis
            - Overall performance rating (Exceptional/Good/Average/Below Average)
            3. Identify standout performances and underperformers
            4. Team performance comparison (Radiant vs Dire)

            Provide 25-35 sentences of detailed analysis (2-3 sentences per player + MVP section).
            Be specific with numbers and percentiles. Structure by team (Radiant first, then Dire)."""
            }
        }

        self.agents = {}

    def _initialize_agents(self):
        """Initialize all sub-agents (done per request to avoid keeping models in memory)"""
        for agent_key, config in self.agent_configs.items():
            self.agents[agent_key] = SubAgent(
                api_key=self.api_key,
                agent_name=config["name"],
                system_instruction=config["system_instruction"]
            )

    def _extract_match_sections(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Split match data into logical sections for each agent.

        Args:
            match_data: Full match data from MCP tool

        Returns:
            Dict with sections for each agent
        """
        return {
            "overview": {
                "metadata": match_data.get("metadata", {}),
                "objectives": match_data.get("objectives", []),
                "chat": match_data.get("chat", [])
            },
            "teamfights": {
                "teamfights_summary": match_data.get("teamfights_summary", {}),
                "match_duration": match_data.get("metadata", {}).get("duration", 0)
            },
            "players": {
                "players_summary": match_data.get("players_summary", {}),
                "match_metadata": {
                    "duration": match_data.get("metadata", {}).get("duration", 0),
                    "radiant_win": match_data.get("metadata", {}).get("radiant_win", False)
                }
            }
        }

    def _format_seconds_to_time(self, seconds: int) -> str:
        """Convert seconds to MM:SS format"""
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes}:{secs:02d}"

    async def analyze_match(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Coordinate all sub-agents to analyze a match comprehensively.

        Args:
            match_data: Full match data from get_match_details MCP tool

        Returns:
            Structured analysis results from all agents
        """
        start_time = datetime.now()
        logger.info(f"Starting multi-agent analysis for match {match_data.get('metadata', {}).get('match_id', 'unknown')}")

        # Initialize agents
        self._initialize_agents()

        # Extract sections
        sections = self._extract_match_sections(match_data)

        # Define analysis tasks for each agent
        tasks = [
            self.agents["overview"].analyze(
                data=sections["overview"],
                prompt="Analyze this Dota 2 match and provide a comprehensive overview. Include winner, duration, key objectives timeline, and critical moments."
            ),
            self.agents["teamfights"].analyze(
                data=sections["teamfights"],
                prompt="Analyze the teamfights in this match. Identify 3-5 critical teamfights that decided the game. For each, explain what happened, the gold/XP swing, and the impact."
            ),
            self.agents["players"].analyze(
                data=sections["players"],
                prompt="Analyze each player's performance in detail. Identify the MVP, assess all 10 players, highlight exceptional performances and underperformers."
            )
        ]

        # Run all agents in parallel
        logger.info("Running 3 agents in parallel...")
        results = await asyncio.gather(*tasks)

        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        # Structure the results
        analysis_result = {
            "match_id": match_data.get("metadata", {}).get("match_id"),
            "analysis_timestamp": datetime.now().isoformat(),
            "processing_time_ms": round(processing_time, 2),
            "agents_used": len(results),
            "sections": {
                "overview": {
                    "title": "Match Overview",
                    "agent": results[0]["agent"],
                    "content": results[0]["content"],
                    "status": results[0]["status"]
                },
                "teamfights": {
                    "title": "Teamfight Analysis",
                    "agent": results[1]["agent"],
                    "content": results[1]["content"],
                    "status": results[1]["status"]
                },
                "players": {
                    "title": "Player Performance",
                    "agent": results[2]["agent"],
                    "content": results[2]["content"],
                    "status": results[2]["status"]
                }
            },
            "metadata": {
                "winner": "Radiant" if match_data.get("metadata", {}).get("radiant_win") else "Dire",
                "duration": self._format_seconds_to_time(match_data.get("metadata", {}).get("duration", 0)),
                "radiant_score": match_data.get("metadata", {}).get("radiant_score"),
                "dire_score": match_data.get("metadata", {}).get("dire_score")
            }
        }

        logger.info(f"Multi-agent analysis completed in {processing_time:.2f}ms")
        return analysis_result
