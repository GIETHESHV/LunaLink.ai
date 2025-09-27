from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from googletrans import Translator as GoogleTranslator
import os
import json
from src.utils import get_llm_response
from src.sign_language_model import predict_sign

app = FastAPI()

# Allow CORS for frontend localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    target_language: str
    mode: str = "chat"  # "chat" or "mindmap"

class MindMapRequest(BaseModel):
    topic: str
    target_language: str = "en"

# Load Argos Translate packages if not already installed
def install_argos_package(from_code: str, to_code: str):
    package_path = f"argos_packages/{from_code}_{to_code}.argosmodel"
    if os.path.exists(package_path):
        argostranslate.package.install_from_path(package_path)
        argostranslate.translate.load_installed_packages()

# Translate text using Argos Translate if package available, else fallback to Googletrans
def translate_text(text: str, from_lang: str, to_lang: str) -> str:
    installed_languages = argostranslate.translate.get_installed_languages()
    from_lang_obj = next((lang for lang in installed_languages if lang.code == from_lang), None)
    to_lang_obj = next((lang for lang in installed_languages if lang.code == to_lang), None)
    if from_lang_obj and to_lang_obj:
        translation = from_lang_obj.get_translation(to_lang_obj)
        if translation:
            return translation.translate(text)
    # Fallback to Googletrans
    google_translator = GoogleTranslator()
    result = google_translator.translate(text, src=from_lang, dest=to_lang)
    return result.text

def generate_mind_map(topic: str, target_language: str = "en"):
    """Generate structured mind map data using LLM."""
    # Translate topic to English if needed
    if target_language != "en":
        topic_english = translate_text(topic, target_language, "en")
    else:
        topic_english = topic

    # Prompt for LLM to generate mind map structure
    prompt = f"""
    Create a mind map for the topic: "{topic_english}"

    Return ONLY valid JSON in this exact format:
    {{
      "topic": "{topic_english}",
      "branches": [
        {{
          "title": "Branch 1 Title",
          "subtopics": ["Subtopic 1", "Subtopic 2"]
        }},
        {{
          "title": "Branch 2 Title",
          "subtopics": ["Subtopic A", "Subtopic B"]
        }}
      ]
    }}

    Generate 3-5 main branches with 2-4 subtopics each. Keep titles concise and relevant.
    """

    # Get LLM response (using empty history and similar conversations for initial generation)
    response = get_llm_response(prompt, [], [], {'compound': 0}, None)

    try:
        # Extract JSON from response
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        json_str = response[json_start:json_end]
        mind_map_data = json.loads(json_str)

        # Translate branch titles and subtopics back to target language if needed
        if target_language != "en":
            for branch in mind_map_data['branches']:
                branch['title'] = translate_text(branch['title'], "en", target_language)
                if branch['subtopics']:
                    branch['subtopics'] = [translate_text(sub, "en", target_language) for sub in branch['subtopics']]

        return mind_map_data
    except json.JSONDecodeError:
        # Fallback to default structure if JSON parsing fails
        return {
            "topic": topic,
            "branches": [
                {
                    "title": "Introduction",
                    "subtopics": ["Overview", "Key Concepts"]
                },
                {
                    "title": "Details",
                    "subtopics": ["Main Points", "Examples"]
                },
                {
                    "title": "Conclusion",
                    "subtopics": ["Summary", "Next Steps"]
                }
            ]
        }

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Translate user message to English if needed
        if request.target_language != "en":
            message_in_english = translate_text(request.message, request.target_language, "en")
        else:
            message_in_english = request.message

        if request.mode == "mindmap":
            # Generate mind map data for the message
            mind_map_data = generate_mind_map(message_in_english, request.target_language)
            return {"mindmap": mind_map_data}
        else:
            # Regular chat response
            # TODO: Replace with actual AI model processing
            ai_response_english = f"Echo: {message_in_english}"

            # Translate AI response back to target language if needed
            if request.target_language != "en":
                ai_response_translated = translate_text(ai_response_english, "en", request.target_language)
            else:
                ai_response_translated = ai_response_english

            return {"response": ai_response_translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mindmap")
async def mindmap_endpoint(request: MindMapRequest):
    try:
        mind_map_data = generate_mind_map(request.topic, request.target_language)
        return mind_map_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_sign")
async def predict_sign_endpoint(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        result = predict_sign(image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
