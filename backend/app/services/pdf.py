from pypdf import PdfReader
import docx
import asyncio
from functools import partial


def _extract_pdf_sync(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""


def _extract_docx_sync(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return ""


async def extract_text(file_path: str, content_type: str) -> str:
    loop = asyncio.get_event_loop()
    if "pdf" in content_type:
        return await loop.run_in_executor(None, partial(_extract_pdf_sync, file_path))
    elif "word" in content_type or "docx" in content_type:
        return await loop.run_in_executor(None, partial(_extract_docx_sync, file_path))
    return ""
