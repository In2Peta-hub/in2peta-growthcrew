import json
import re
import requests
from typing import Dict, Any, Optional, List
from config import CONFIG
from services.gemini_service import GeminiService

class AICaptionService:
    @staticmethod
    def generate_post(
        topic: str,
        tone: str = "Warm & Engaging",
        format_type: str = "feed",
        call_to_action: str = "",
        custom_instructions: str = "",
        platforms: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate high-converting multi-platform social media posts.
        Primary Engine: In2Peta DeepSeek-Flash (code.in2peta.com/v1)
        Fallback Engine: Google Gemini 3.5 Flash
        """
        target_platforms = platforms or ["facebook", "instagram", "linkedin", "x", "reddit", "youtube", "discord"]
        platforms_str = ", ".join(target_platforms)

        cta_clause = (
            f"Call To Action: {call_to_action}"
            if call_to_action
            else "Call To Action: Create an engaging, organic CTA tailored specifically to this topic."
        )
        custom_clause = f"Special Instructions: {custom_instructions}" if custom_instructions else ""

        prompt = f"""You are GrowthCrew AI, an elite multi-channel social media creative director and copywriter.
Generate a captivating, high-performing post designed for simultaneous broadcasting across these platforms: {platforms_str}.

Topic / Theme: {topic}
Tone of Voice: {tone}
Format: {format_type}
{cta_clause}
{custom_clause}

CRITICAL MULTI-PLATFORM GUIDELINES:
1. Hook: Punchy, scroll-stopping opening hook (under 120 characters) that works great on X, LinkedIn, and Facebook/Instagram feeds.
2. Caption: High-value, conversational body copy with natural spacing, line breaks, and tasteful aesthetic emojis.
3. Hashtags: 5-8 trending, targeted hashtags.
4. Visual Direction: Inspiring creative prompt for high-resolution visual/AI imagery.
5. Visual Keyword: 2-3 word keyword describing the scene.

Respond ONLY with a valid JSON object matching this schema (no markdown formatting, no code block backticks):
{{
  "hook": "A scroll-stopping opening hook (under 120 chars)",
  "caption": "The main broadcast caption with clean line breaks and emojis. Do not repeat the hook or hashtags here.",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
  "visualPrompt": "Detailed creative direction for an AI image or video scene",
  "visualKeyword": "2-3 word search keyword",
  "platforms": {json.dumps(target_platforms)}
}}"""

        # 1. Primary Engine: In2Peta API (DeepSeek-Flash)
        in2peta_url = f"{CONFIG.IN2PETA_API_URL.rstrip('/')}/chat/completions"
        in2peta_key = CONFIG.IN2PETA_API_KEY or "sk-in2peta-litellm-dev-master"
        in2peta_model = CONFIG.IN2PETA_MODEL or "deepseek-v4-flash"

        try:
            headers = {
                "Authorization": f"Bearer {in2peta_key}",
                "Content-Type": "application/json"
            }
            body = {
                "model": in2peta_model,
                "messages": [
                    {"role": "system", "content": "You are GrowthCrew AI, an elite multi-platform social media marketing director. Respond ONLY in valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            res = requests.post(in2peta_url, headers=headers, json=body, timeout=35)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    raw_content = choices[0]["message"].get("content", "").strip()
                    # Strip markdown block quotes if present
                    clean = re.sub(r"^```json\s*", "", raw_content, flags=re.IGNORECASE)
                    clean = re.sub(r"^```\s*", "", clean)
                    clean = re.sub(r"\s*```$", "", clean).strip()
                    parsed = json.loads(clean)
                    parsed["engine"] = f"In2Peta ({in2peta_model})"
                    parsed["modelUsed"] = "DeepSeek-Flash (In2Peta API)"
                    print(f"[In2Peta] Successfully generated multi-platform post using {in2peta_model}!")
                    return parsed
        except Exception as e:
            print(f"[In2Peta] DeepSeek-Flash request notice: {e}. Falling back to Gemini...")

        # 2. Fallback Engine: Google Gemini Service
        try:
            gemini_res = GeminiService.generate_post(
                topic=topic,
                tone=tone,
                format_type=format_type,
                call_to_action=call_to_action,
                custom_instructions=custom_instructions
            )
            if gemini_res:
                gemini_res["engine"] = "Google Gemini 3.5"
                gemini_res["modelUsed"] = "Gemini 3.5 Flash"
                gemini_res["platforms"] = target_platforms
                return gemini_res
        except Exception as e:
            print(f"[Gemini] Fallback notice: {e}")

        # 3. Creative Offline Fallback
        return {
            "hook": f"Stop scrolling: Here's the truth about {topic}! 🚀",
            "caption": f"When it comes to {topic}, the difference between good and great always comes down to execution.\n\nAt GrowthCrew, we focus on delivering real, measurable results without the guesswork.\n\nFrom concept to completion, we streamline the process so you can focus on scaling.\n\n{call_to_action or 'What do you think? Drop your thoughts below! 👇'}",
            "hashtags": ["#GrowthCrew", "#Innovation", "#MarketingAutomation", "#MultiPlatform", "#Scalora"],
            "visualPrompt": f"High quality cinematic photography representing {topic}",
            "visualKeyword": topic.split(" ")[0] if topic else "modern growth",
            "engine": "GrowthCrew Smart Fallback",
            "modelUsed": "DeepSeek-Flash (Smart Fallback)",
            "platforms": target_platforms
        }
