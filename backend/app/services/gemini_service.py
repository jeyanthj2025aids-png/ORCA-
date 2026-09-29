import json
import logging
import time
from typing import Any, Optional, Type
from pydantic import BaseModel
from google import genai
from google.genai import types
from backend.app.core.config import settings

logger = logging.getLogger("orca.gemini")
logging.basicConfig(level=logging.INFO)

class GeminiService:
    """
    Official Google GenAI SDK Service for ORCA.
    Supports:
    - Structured JSON outputs via Pydantic schemas
    - Multilingual synthesis (Tamil, Hindi, English, Malayalam, etc.)
    - Agent-specific prompts & tool synthesis
    - Automatic model fallback & retry
    - Token and latency tracking
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.default_model = settings.GEMINI_MODEL
        self.reasoning_model = settings.GEMINI_REASONING_MODEL
        self.fallback_models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]
        self._client: Optional[genai.Client] = None
        
        if self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"Gemini client initialized successfully with model {self.default_model}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")

    @property
    def is_operational(self) -> bool:
        return self._client is not None and bool(self.api_key)

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: Optional[str] = None
    ) -> str:
        """
        Generate plain text or formatted markdown using Gemini.
        """
        if not self._client:
            return "Gemini API key is not configured. Running in local simulation mode."
        
        target_model = model or self.default_model
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
        )
        
        start_time = time.time()
        try:
            response = await self._client.aio.models.generate_content(
                model=target_model,
                contents=prompt,
                config=config
            )
            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Gemini generation succeeded on {target_model} in {duration_ms}ms")
            return response.text or ""
        except Exception as e:
            logger.warning(f"Primary model {target_model} failed ({e}), attempting fallback...")
            for fallback in self.fallback_models:
                if fallback == target_model:
                    continue
                try:
                    response = await self._client.aio.models.generate_content(
                        model=fallback,
                        contents=prompt,
                        config=config
                    )
                    logger.info(f"Gemini fallback succeeded on {fallback}")
                    return response.text or ""
                except Exception as fb_err:
                    logger.warning(f"Fallback {fallback} error: {fb_err}")
            
            logger.error(f"All Gemini models exhausted. Returning error: {e}")
            raise RuntimeError(f"Gemini generation error: {e}")

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Type[BaseModel],
        system_instruction: Optional[str] = None,
        model: Optional[str] = None
    ) -> BaseModel:
        """
        Enforce rigid JSON structured output adhering strictly to Pydantic schema.
        """
        if not self._client:
            raise RuntimeError("Gemini API is not configured.")
        
        target_model = model or self.default_model
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.1
        )
        
        start_time = time.time()
        try:
            response = await self._client.aio.models.generate_content(
                model=target_model,
                contents=prompt,
                config=config
            )
            duration_ms = int((time.time() - start_time) * 1000)
            logger.info(f"Structured output succeeded on {target_model} in {duration_ms}ms")
            
            text_payload = response.text
            if not text_payload:
                raise ValueError("Empty response from Gemini")
            
            parsed_json = json.loads(text_payload)
            return response_schema.model_validate(parsed_json)
        except Exception as e:
            logger.warning(f"Structured generation error with model {target_model}: {e}")
            # Try parsing or fallback
            for fallback in self.fallback_models:
                if fallback == target_model:
                    continue
                try:
                    fb_resp = await self._client.aio.models.generate_content(
                        model=fallback,
                        contents=prompt,
                        config=config
                    )
                    if fb_resp.text:
                        return response_schema.model_validate(json.loads(fb_resp.text))
                except Exception as fb_err:
                    logger.warning(f"Fallback {fallback} failed: {fb_err}")
            raise e

gemini_service = GeminiService()
