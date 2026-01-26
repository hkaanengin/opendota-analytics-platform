import logging
from typing import Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.llm_client import BaseLLMClient

logger = logging.getLogger(__name__)


class TeamfightSummarizer:
    """
    Generates concise LLM summaries for individual teamfights.
    """

    def __init__(self, llm_client: "BaseLLMClient"):
        """
        Initialize the summarizer with an LLM client.

        Args:
            llm_client: LLM client instance (Gemini or Claude)
        """
        self.llm_client = llm_client
        self.system_instruction = """You are a Dota 2 analyst providing brief teamfight summaries.
Given teamfight data, provide a 2-4 sentence summary that captures:
- Who initiated or key abilities used
- Key deaths and their impact
- The outcome (which team won the fight)
- Notable plays or turning points

Be specific with hero names. Keep it concise and insightful. Do not use bullet points - write in flowing prose."""

    async def summarize_teamfight(self, teamfight_data: Dict[str, Any]) -> str:
        """
        Generate a 2-4 sentence summary of a teamfight.

        Args:
            teamfight_data: Single teamfight object from match data

        Returns:
            A concise summary string
        """
        try:
            logger.info(f"Generating teamfight summary for fight at {teamfight_data.get('start', 'unknown')}")

            # Build context about the teamfight
            prompt = self._build_prompt(teamfight_data)

            # Get LLM summary
            summary = await self.llm_client.analyze(
                data=teamfight_data,
                prompt=prompt,
                system_instruction=self.system_instruction
            )

            logger.info("Teamfight summary generated successfully")
            return summary.strip()

        except Exception as e:
            logger.error(f"Failed to generate teamfight summary: {e}")
            raise

    def _build_prompt(self, teamfight_data: Dict[str, Any]) -> str:
        """Build a focused prompt for teamfight analysis."""
        start = teamfight_data.get("start", "unknown")
        end = teamfight_data.get("end", "unknown")
        deaths = teamfight_data.get("deaths", 0)
        gold_swing = teamfight_data.get("gold_swing", 0)
        radiant_gold = teamfight_data.get("radiant_gold_delta", 0)
        dire_gold = teamfight_data.get("dire_gold_delta", 0)

        # Determine winner
        if radiant_gold > dire_gold:
            winner = "Radiant"
        elif dire_gold > radiant_gold:
            winner = "Dire"
        else:
            winner = "Neither team clearly"

        return f"""Summarize this Dota 2 teamfight in 2-4 sentences.

Fight timing: {start} to {end}
Total deaths: {deaths}
Gold swing: {gold_swing} in favor of {winner}
Radiant gold gained: {radiant_gold}
Dire gold gained: {dire_gold}

Focus on which heroes made key plays, who died, and what abilities or items were decisive. The player data below shows each hero's contribution."""
