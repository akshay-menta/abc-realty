"""
LLM Service — Provider interface for Groq and optional cloud fallbacks.
Switch via LLM_PROVIDER in .env:
  - "groq"      → Groq free tier (recommended for deploy) — https://console.groq.com/keys
  - "gemini"    → Google Gemini free tier — https://aistudio.google.com/apikey
  - "openai"    → OpenAI paid API
  - "anthropic" → Anthropic paid API
"""

import requests
from config import Config


class LLMService:
    def __init__(self):
        self.provider = Config.LLM_PROVIDER

    def chat(self, messages: list, system_prompt: str = "") -> str:
        """Send a chat request to the configured LLM provider."""
        if self.provider == "groq":
            return self._openai_compatible_chat(
                messages,
                system_prompt,
                base_url="https://api.groq.com/openai/v1",
                api_key=Config.GROQ_API_KEY,
                model=Config.GROQ_MODEL,
                label="Groq",
            )
        if self.provider == "gemini":
            return self._gemini_chat(messages, system_prompt)
        if self.provider == "openai":
            return self._openai_compatible_chat(
                messages,
                system_prompt,
                base_url="https://api.openai.com/v1",
                api_key=Config.OPENAI_API_KEY,
                model=Config.OPENAI_MODEL,
                label="OpenAI",
            )
        if self.provider == "anthropic":
            return self._anthropic_chat(messages, system_prompt)
        return "LLM provider not configured. Set LLM_PROVIDER and the matching API key in .env."

    def _openai_compatible_chat(self, messages, system_prompt, base_url, api_key, model, label):
        if not api_key:
            return (
                f"{label} API key is missing. Add it to backend/.env, or switch LLM_PROVIDER. "
                f"Free keys: Groq → https://console.groq.com/keys · Gemini → https://aistudio.google.com/apikey"
            )
        try:
            all_messages = []
            if system_prompt:
                all_messages.append({"role": "system", "content": system_prompt})
            all_messages.extend(messages)
            response = requests.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": all_messages,
                    "temperature": 0.3,
                },
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except requests.exceptions.HTTPError as e:
            detail = ""
            try:
                detail = e.response.json()
            except Exception:
                detail = e.response.text if e.response is not None else str(e)
            return f"{label} error: {detail}"
        except Exception as e:
            return f"{label} error: {str(e)}"

    def _gemini_chat(self, messages: list, system_prompt: str) -> str:
        if not Config.GEMINI_API_KEY:
            return (
                "Gemini API key is missing. Get a free key at https://aistudio.google.com/apikey "
                "and set GEMINI_API_KEY in backend/.env (LLM_PROVIDER=gemini)."
            )
        try:
            contents = []
            for m in messages:
                role = "user" if m.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

            payload = {
                "contents": contents,
                "generationConfig": {"temperature": 0.3},
            }
            if system_prompt:
                payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{Config.GEMINI_MODEL}:generateContent"
            )
            response = requests.post(
                url,
                params={"key": Config.GEMINI_API_KEY},
                json=payload,
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except requests.exceptions.HTTPError as e:
            detail = ""
            try:
                detail = e.response.json()
            except Exception:
                detail = e.response.text if e.response is not None else str(e)
            return f"Gemini error: {detail}"
        except Exception as e:
            return f"Gemini error: {str(e)}"


    def _anthropic_chat(self, messages: list, system_prompt: str) -> str:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model=Config.ANTHROPIC_MODEL,
                max_tokens=1024,
                system=system_prompt or "You are a helpful real estate assistant.",
                messages=messages,
            )
            return response.content[0].text
        except Exception as e:
            return f"Anthropic error: {str(e)}"
