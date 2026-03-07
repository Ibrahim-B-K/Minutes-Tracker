import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
import json
import time
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')

def get_best_model():
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods and 'flash' in m.name:
                return m.name
    except: pass
    return 'models/gemini-1.5-flash'

def analyze_document_with_gemini(file_path, available_departments=None):
    print(f"--- 🧠 Starting AI Analysis for: {file_path} ---")
    genai.configure(api_key=GOOGLE_API_KEY)
    
    try:
        uploaded_file = genai.upload_file(path=file_path, display_name="Minutes")
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(1)
            uploaded_file = genai.get_file(uploaded_file.name)
    except Exception as e:
        print(f"❌ Upload Error: {e}")
        return []

    model = genai.GenerativeModel(get_best_model())
    safety = {cat: HarmBlockThreshold.BLOCK_NONE for cat in [
        HarmCategory.HARM_CATEGORY_HARASSMENT, HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT
    ]}
    
    available_departments = available_departments or []
    dept_list_text = '\n'.join(available_departments) if available_departments else '(No department list provided)'

    prompt = f"""
    You are an AI specialized in analyzing Malayalam PDF minutes of meetings. 

    TASK: Extract every actionable issue from this document.

    AVAILABLE DEPARTMENTS (Designation, Department Name):
    {dept_list_text}

    EXTRACTION RULES:
    1. Extract ONLY issues that contain the word .
    2. Look ONLY at the text immediately following "നടപടി:" to find the responsible parties.
    3. For each issue with "നടപടി:", identify ALL mentioned stakeholders (officers/departments).
    4. For EACH stakeholder, extract BOTH the "designation" and the "department" name as written in the text.
    5. CRITICAL INSTRUCTION: You MUST ONLY return a department if it is EXPLICITLY stated in the text. 
    6. ZERO GUESSING ALLOWED: Do NOT add related departments. Do NOT infer a department just because of the context.
    7. Map each extracted pair to the AVAILABLE DEPARTMENTS list.
    8. Do not invent any dates. If no deadline is explicitly given, set "deadline" to "".
    9. Maintain the original Malayalam text for issue_description and location fields.
    10. Summarize each issue in ONE line (max 20 words) for the "issue" field.
    11. Assign priority: High/Medium/Low.

    CRITICAL NEGATIVE EXAMPLES (DO NOT DO THIS):
    - If the "നടപടി" section says "വാട്ടർ അതോറിറ്റി" (Water Authority), ONLY return "Water Authority".
    - If it says "എക്സിക്യുട്ടീവ് എൻജിനീയർ, പൊതുമരാമത്ത് (കെട്ടിടം)", extract Designation: "എക്സിക്യുട്ടീവ് എൻജിനീയർ", Department: "പൊതുമരാമത്ത് (കെട്ടിടം)".
    - if it doesnt have "നടപടി:", ignore the issue completely, even if it mentions a department elsewhere in the text.
    OUTPUT FORMAT: Return ONLY a JSON array of objects. Each object must have:

    {{
    "issue_no": string,
    "departments": [
        {{
            "designation": "english version of Malayalam designation extracted from text",
            "department": "english version of Malayalam department name extracted from text"
        }}
    ],
    "issue": one-line Malayalam summary (max 20 words),
    "issue_description": full Malayalam issue description exactly as in document,
    "location": Malayalam place name if mentioned, else "",
    "priority": High/Medium/Low,
    "deadline": DD-MM-YYYY or ""
    }}

    Do NOT include any text outside the JSON array. Do NOT add explanations or code blocks.
    """

    try:
        response = model.generate_content([uploaded_file, prompt], safety_settings=safety)
        text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"❌ Generation Error: {e}")
        return []


def match_issues_with_gemini(new_issues, existing_issues):
    """
    Use Gemini to semantically match new issues against existing unresolved issues.
    Works with Malayalam text — compares meaning, not exact words.
    
    new_issues: list of dicts with keys: index, issue, issue_description
    existing_issues: list of dicts with keys: id, issue, issue_description, minutes_title
    
    Returns: list of dicts { new_index: int, existing_id: int, confidence: str }
    """
    if not new_issues or not existing_issues:
        return []

    print(f"--- 🔗 Starting Issue Matching: {len(new_issues)} new vs {len(existing_issues)} existing ---")
    genai.configure(api_key=GOOGLE_API_KEY)

    model = genai.GenerativeModel(get_best_model())
    safety = {cat: HarmBlockThreshold.BLOCK_NONE for cat in [
        HarmCategory.HARM_CATEGORY_HARASSMENT, HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT
    ]}

    prompt = f"""
You are an expert at matching government meeting issues written in Malayalam.

TASK: Compare NEW issues (extracted from the latest meeting minutes) against EXISTING issues (from previous meetings). Find which new issues are follow-ups or continuations of existing issues.

NEW ISSUES:
{json.dumps(new_issues, ensure_ascii=False, indent=2)}

EXISTING ISSUES:
{json.dumps(existing_issues, ensure_ascii=False, indent=2)}

MATCHING RULES:
1. Match based on SEMANTIC MEANING, not exact text. The same issue may be described differently across meetings.
2. Consider: same road/location, same infrastructure problem, same department concern, same complaint.
3. Only match if you are reasonably confident they refer to the SAME real-world issue.
4. A new issue can match AT MOST one existing issue.
5. Not every new issue will have a match — only return genuine matches.
6. confidence must be "high" (clearly same issue) or "medium" (likely same issue).

Return a JSON ARRAY of match objects:
- new_index: integer (the "index" field from the new issue)
- existing_id: integer (the "id" field from the matched existing issue)
- confidence: "high" or "medium"

If no matches found, return an empty array [].
Output ONLY PURE JSON.
"""

    try:
        response = model.generate_content(prompt, safety_settings=safety)
        text = response.text.replace("```json", "").replace("```", "").strip()
        matches = json.loads(text)
        print(f"✅ Gemini returned {len(matches)} matches")
        return matches if isinstance(matches, list) else []
    except Exception as e:
        print(f"❌ Matching Error: {e}")
        return []