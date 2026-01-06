import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import os
import json
import time

GOOGLE_API_KEY = "AIzaSyA0NpubI5Q7Y4CmO3JFSytUjkwk0EDAZUM"

def get_best_model():
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods and 'flash' in m.name:
                return m.name
    except: pass
    return 'models/gemini-1.5-flash'

def analyze_document_with_gemini(file_path):
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
    
    prompt = """
    Analyze this Malayalam PDF. Extract every actionable issue.
    
    FORCE RULES:
    1. EXTRACT EVERY ISSUE listed. Do not skip any.
    2. YOU MUST ASSIGN AT LEAST ONE DEPARTMENT. If it is not explicitly mentioned, you MUST INFER it based on these keywords:
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
    - departments: ARRAY of strings (e.g. ["PWD_ROADS", "LSGD"])
    - issue: Malayalam summary
    - location: Malayalam place
    - priority: High/Medium/Low
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