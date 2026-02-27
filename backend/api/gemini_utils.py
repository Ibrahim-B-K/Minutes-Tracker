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
    dept_list_text = '\n'.join(f'- {dept}' for dept in available_departments) if available_departments else '(No department list provided)'

    prompt = f"""
    Analyze this Malayalam PDF. Extract every actionable issue.

    AVAILABLE DEPARTMENTS (master list):
    {dept_list_text}
    
    FORCE RULES:
    1. EXTRACT EVERY ISSUE listed. Do not skip any.
    2. YOU MUST ASSIGN AT LEAST ONE DEPARTMENT.
    3. Department output must be selected ONLY from AVAILABLE DEPARTMENTS above.
    4. If the minute explicitly names a department, choose that exact department from AVAILABLE DEPARTMENTS.
    5. If no department is explicit, infer the best-fit department from AVAILABLE DEPARTMENTS using issue context.
    6. Never invent a new department name.
    7. If uncertain, choose the closest available department; do not leave departments empty.

    Inference hints:
       - 'റോഡ്' (Road), 'പാലം' (Bridge) -> PWD_ROADS
       - 'കെട്ടിടം' (Building), 'സ്കൂൾ അറ്റകുറ്റപ്പണി' (School repair) -> PWD_BUILDINGS
       - 'കുടിവെള്ളം' (Drinking water), 'പൈപ്പ്' (Pipe) -> KWA
       - 'വൈദ്യുതി' (Electricity), 'ലൈൻ' (Line), 'ട്രാൻസ്ഫോർമർ' -> KSEB
       - 'മാലിന്യം' (Waste), 'പഞ്ചായത്ത്' (Panchayat), 'തെരുവുനായ' (Stray dog) -> LSGD
       - 'കൃഷി' (Farming), 'കർഷകർ' (Farmers), 'വിളനാശം' (Crop damage) -> AGRICULTURE
       - 'ക്രമസമാധാനം' (Law & Order), 'ട്രാഫിക്' (Traffic) -> POLICE

    STRICT RULES:
    1. Do NOT invent dates. If no deadline is explicitly mentioned in the text for an issue, the "deadline" field MUST be an empty string "".
    2. Do NOT use today's date or any date like '18-12-25'.
    
    
    Return a JSON ARRAY of objects:
    - issue_no: string
    - departments: ARRAY of strings using exact department names from AVAILABLE DEPARTMENTS only.
    - issue: ONE-LINE Malayalam summary (max 20 words)
    - issue_description: FULL detailed Malayalam issue description (multiple sentences),dont assume anything not in the document.
    - location: Malayalam place name (if mentioned) or "".
    - priority: High/Medium/Low (based on urgency in text, urgency can be inferred from words and high priority for issues that involve MLA/MP/Minister requests)
    - deadline (DD-MM-YYYY or "")
    
    Output ONLY PURE JSON. Do not include any other text.
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