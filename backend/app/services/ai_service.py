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
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            # Fallback parsing
            print(f"JSON Parse Error. Trying to extract block...")
            if "{" in text and "}" in text:
                start = text.find("{")
                end = text.rfind("}") + 1
                try:
                    return json.loads(text[start:end])
                except:
                    pass
            return {"raw_text": text, "error": "Failed to parse JSON"}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def get_section_suggestions(self, section_name: str, job_role: str, experience_level: str, current_content: Any = None) -> dict:
        prompt = f"""
        You are a Principal Career Coach and Expert Resume Writer.
        Provide suggestions and improved content for the '{section_name}' section of a resume.
        
        Target Role: {job_role}
        Experience Level: {experience_level}
        Current Content: {json.dumps(current_content) if current_content else 'None'}
        
        INSTRUCTIONS:
        1. Provide 3-5 specific bullet point suggestions or phrases.
        2. Give 2-3 expert tips on how to make this section stand out.
        3. If 'Current Content' is provided, rewrite it to be more impactful using action verbs and quantifiable results.
        
        OUTPUT FORMAT: Valid JSON only.
        {{
            "suggestions": ["...", "..."],
            "tips": ["...", "..."],
            "improved_content": "..." 
        }}
        """
        response_text = await self._generate_content(prompt)
        return self._clean_and_parse_json(response_text)

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

        prompt = f"""
        You are an Elite Career Consultant. 
        Rewrite the candidate's profile for the Role: {job_role}.
        Target Style: {template_id} ({density_instruction})
        
        Job Description: {job_description}
        Candidate Profile: {resume_str}
        
        RULES:
        1. SUMMARY: Connect achievements directly to the JD. Tone: {density_instruction}.
        2. EXPERIENCE: Use STAR method. Action verbs only.
        3. SKILLS: Logical clustering.
        4. QUANTIFY: Use metrics (%, $, time) everywhere possible.
        5. DENSITY: Follow the instruction: {density_instruction}.
        
        OUTPUT FORMAT: JSON.
        Structure:
        {{
            "full_name": "...",
            "contact_info": {{"email": "...", "phone": "..."}},
            "summary": "...",
            "skills": [...],
            "work_experience": [
                {{
                    "company": "...",
                    "role": "...",
                    "duration": "...",
                    "points": ["...", ...]
                }}
            ],
            "education": [...],
            "projects": [...]
        }}
        """
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
