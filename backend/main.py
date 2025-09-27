from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from googletrans import Translator as GoogleTranslator
import argostranslate.package
import argostranslate.translate
import os

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

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Translate user message to English if needed
        if request.target_language != "en":
            message_in_english = translate_text(request.message, request.target_language, "en")
        else:
            message_in_english = request.message

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
