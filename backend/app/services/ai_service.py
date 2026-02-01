from typing import Any, List, Dict
import google.generativeai as genai
import ollama
from app.core.config import settings
import json
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential


class AI_Service:
    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        if self.provider == "gemini":
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel('gemini-pro')
            else:
                print(
                    "WARNING: GEMINI_API_KEY is missing. Falling back to Ollama if configured.")
                self.provider = "ollama"

        if self.provider == "ollama":
            self.ollama_client = ollama.AsyncClient(host=settings.OLLAMA_HOST)
            self.model_name = settings.AI_MODEL

    async def _generate_content(self, prompt: str) -> str:
        if self.provider == "gemini":
            response = await self.gemini_model.generate_content_async(prompt)
            return response.text
        else:
            # Ollama implementation
            response = await self.ollama_client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=False
            )
            return response['response']

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def parse_resume(self, text: str) -> dict:
        prompt = f"""
        Extract the following information from the resume text below and return it as a VALID JSON object.
        Fields to extract:
        - full_name
        - email
        - phone
        - skills (list of strings)
        - work_experience (list of objects with company, role, duration, description)
        - education (list of objects with institution, degree, year)
        - projects (list of objects)
        
        Resume Text:
        {text[:10000]}
        """
        response_text = await self._generate_content(prompt)
        return self._clean_and_parse_json(response_text)

    def _clean_and_parse_json(self, text: str) -> dict:
        clean_text = text.replace('```json', '').replace('```', '').strip()
        if "{" in text:
            try:
                # Find the first {
                start = text.find("{")
                json_block = text[start:]

                # Tiny model fix: Handles models that return {[ { ... } ]}
                if json_block.startswith("{["):
                    json_block = json_block[1:-1]  # Strip the outer {}

                # Attempt to find the first complete JSON object
                import json
                decoder = json.JSONDecoder()
                obj, index = decoder.raw_decode(json_block)

                # If we got a list, take the first element
                if isinstance(obj, list) and len(obj) > 0:
                    return obj[0]
                return obj
            except Exception as e:
                print(f"JSON Parsing failed. Error: {e}")
                print(f"Raw text that failed: {text[:500]}...")

        # High-quality fallback if AI is too chatty or fails
        return {
            "suggestions": [
                "Quantify achievements with percentages (e.g., 'Increased efficiency by 20%')",
                "Use strong action verbs like 'Spearheaded', 'Optimized', or 'Architected'",
                "Align keywords directly with the job description requirements"
            ],
            "tips": [
                "Keep this section under 3-4 lines for maximum impact.",
                "Focus on outcomes, not just responsibilities."
            ],
            "improved_content": "A results-driven Professional with expertise in delivering high-impact solutions. Proven ability to optimize workflows and lead cross-functional teams to achieve strategic goals."
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def get_section_suggestions(self, section_name: str, job_role: str, experience_level: str, current_content: Any = None) -> dict:
        # Prompt that forces JSON by ending with "{"
        prompt = f"""
        Job Role: {job_role}
        Resume Section: {section_name}
        Current Content: "{current_content}"

        Provide a JSON object with:
        1. "suggestions": A list of 2-3 professional phrases to add.
        2. "tips": A list of 2 resume writing tips.
        3. "improved_content": A high-impact rewrite of the current content.

        Output only the JSON object.
        JSON: {{
        """
        response_text = await self._generate_content(prompt)

        # Add the { back since we pre-filled it in the prompt
        full_response = "{" + response_text
        print(f"DEBUG: Raw AI Response: {full_response[:200]}...")

        return self._clean_and_parse_json(full_response)

    async def generate_tailored_resume(self, resume_json: dict, job_description: str, job_role: str, template_id: str = "minimal-pro") -> dict:
        resume_str = json.dumps(resume_json)

        # Adjust density/tone based on template
        density_instruction = "Concise and impact-focused"
        if template_id == 'leadership-edge':
            density_instruction = "Achievement-focused, executive tone, emphasis on ROI and leadership."
        elif template_id == 'tech-focused':
            density_instruction = "Densely packed with technical stack details, specific tools, and architectural impact."
        elif template_id == 'academic':
            density_instruction = "Detailed, formal, focusing on publications and research methodology."

        prompt = f"""[INST] You are an expert career consultant.
        Action: Tailor the profile for Role: {job_role}.
        Style: {template_id} ({density_instruction})
        
        Job: {job_description[:1000]}
        Profile: {resume_str}
        
        RULES:
        - SUMMARY: Use {density_instruction} tone.
        - EXPERIENCE: Quantify results using metrics (%, $).
        - Format: VALID JSON ONLY.
        [/INST]"""
        response_text = await self._generate_content(prompt)
        return self._clean_and_parse_json(response_text)

    async def calculate_ats_score(self, resume_text: str, job_description: str) -> dict:
        prompt = f"""
        Evaluate the resume against the Job Description.
        JD: {job_description}
        Resume: {resume_text}
        
        Output JSON:
        {{
            "score": 0-100,
            "match_percentage": 0-100,
            "missing_keywords": [...],
            "feedback": [...],
            "improvement_tips": [...]
        }}
        """
        response_text = await self._generate_content(prompt)
        return self._clean_and_parse_json(response_text)

    async def suggest_job_roles(self, query: str) -> List[str]:
        prompt = f"""
        Act as a Professional Career Advisor. 
        The user is typing a job role: '{query}'.
        Suggest 5 common, real-world job role titles that start with or are highly related to this query.
        Return ONLY a JSON list of strings.
        Example: ["Software Engineer", "Software Architect", "Full Stack Developer"]
        """
        response_text = await self._generate_content(prompt)
        try:
            suggestions = self._clean_and_parse_json(response_text)
            if isinstance(suggestions, list):
                return suggestions
            return []
        except:
            return []


ai_service = AI_Service()
