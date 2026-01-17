from pypdf import PdfReader
import docx


def extract_text_from_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return ""


def extract_text(file_path: str, content_type: str) -> str:
    if "pdf" in content_type:
        return extract_text_from_pdf(file_path)
    elif "word" in content_type or "docx" in content_type:
        return extract_text_from_docx(file_path)
    return ""
