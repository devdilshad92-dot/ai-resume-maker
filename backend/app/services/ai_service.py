import google.generativeai as genai
from app.core.config import settings
import json
from tenacity import retry, stop_after_attempt, wait_exponential

genai.configure(api_key=settings.GEMINI_API_KEY)


class AI_Service:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def parse_resume(self, text: str) -> dict:
        prompt = f"""
        You are an expert Resume Parser. 
        Extract the following information from the resume text below and return it as a VALID JSON object.
        Do NOT wrap in markdown code blocks. Just return the raw JSON.
        
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
        response = await self.model.generate_content_async(prompt)
        return self._clean_and_parse_json(response.text)

    def _clean_and_parse_json(self, text: str) -> dict:
        # Improve cleaning logic to handle common LLM markdown wrappers
        clean_text = text.replace('```json', '').replace('```', '').strip()
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            # Fallback or simple repair could go here
            print(f"JSON Parse Error. Raw text: {text[:100]}")
            return {"raw_text": text, "error": "Failed to parse JSON"}

    async def generate_tailored_resume(self, resume_json: dict, job_description: str, job_role: str) -> dict:
        resume_str = json.dumps(resume_json)
        prompt = f"""
        You are a Professional Resume Writer and Career Coach. 
        Your task is to rewrite the candidate's resume to perfectly match the Job Description (JD).
        
        Target Role: {job_role}
        
        Job Description:
        {job_description}
        
        Candidate's Profile (JSON):
        {resume_str}
        
        INSTRUCTIONS:
        1. Analyze the JD Use keywords from the JD.
        2. Rewrite the "Professional Summary" to align with the JD.
        3. Rewrite "Work Experience" bullet points using the STAR method (Situation, Task, Action, Result) to highlight relevant achievements.
        4. Prioritize skills mentioned in the JD.
        5. Keep the tone professional, concise, and impact-driven.
        6. Do NOT invent false information. Only enhance what is there.
        
        OUTPUT FORMAT: 
        Return a VALID JSON object with the tailored resume sections.
        Structure:
        {{
            "full_name": "...",
            "contact_info": {{...}},
            "summary": "...",
            "skills": [...],
            "work_experience": [
                {{
                    "company": "...",
                    "role": "...",
                    "duration": "...",
                    "points": ["Action verb + quantifiable result...", ...]
                }}
            ],
            "education": [...],
            "projects": [...]
        }}
        Do NOT wrap in markdown.
        """
        response = await self.model.generate_content_async(prompt)
        return self._clean_and_parse_json(response.text)

    async def calculate_ats_score(self, resume_text: str, job_description: str) -> dict:
        prompt = f"""
        You are an ATS (Applicant Tracking System) Expert.
        Evaluate the following resume against the Job Description.
        
        Job Description:
        {job_description}
        
        Resume Content:
        {resume_text}
        
        Task:
        1. Calculate a match percentage (0-100).
        2. Identify missing keywords.
        3. Provide specific feedback on formatting and content.
        
        Output JSON:
        {{
            "score": 75,
            "match_percentage": 75,
            "missing_keywords": ["python", "fastapi", ...],
            "feedback": [
                "Good use of action verbs.",
                "Missing 'Docker' experience mentioned in JD."
            ],
            "improvement_tips": [
                "Add a skills section...",
                "Quantify your sales achievements."
            ]
        }}
        Do NOT wrap in markdown.
        """
        response = await self.model.generate_content_async(prompt)
        return self._clean_and_parse_json(response.text)


ai_service = AI_Service()
