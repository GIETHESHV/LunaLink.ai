from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import pytesseract
from PIL import Image
import io
from pdfminer.high_level import extract_text as extract_text_from_pdf
from docx import Document
from src.rule_based_responses import get_rule_based_response
from src.utils import (
    get_llm_response,
    store_conversation,
    retrieve_similar_conversations,
    get_sentiment,
    store_document_text,
    retrieve_document_context,
    translate_text,  # <-- Import the new function
)
# from src.sign_language_model import predict_sign
from fastapi.middleware.cors import CORSMiddleware
import uuid
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

history = []

class ChatMessage(BaseModel):
    message: str
    target_language: Optional[str] = None

@app.post("/chat")
def chat(chat_message: ChatMessage):
    user_input = chat_message.message
    
    # 1. Get NLU response (intent, sentiment, and pre-defined response)
    sentiment = get_sentiment(user_input) # Get sentiment for the current user input
    rule_response = get_rule_based_response(user_input)
    
    response = None
    if rule_response:
        response = rule_response
    else:
        # Retrieve similar conversations from long-term memory
        similar_conversations = retrieve_similar_conversations(user_input)
        
        # Retrieve relevant document context
        document_context = retrieve_document_context(user_input)
        
        # Get response from AI model with context and sentiment
        response = get_llm_response(user_input, history, similar_conversations, sentiment, document_context)
        
    # Store the new conversation in long-term memory
    store_conversation(user_input, response)
        
    # 3. Update short-term history
    history.append((user_input, response))
    if len(history) > 5:
        history.pop(0)
        
    if chat_message.target_language and chat_message.target_language != 'en':
        response = translate_text(response, chat_message.target_language)
        
    return {"response": response}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    extracted_text = ""
    try:
        contents = await file.read()
        
        if file.content_type.startswith("image/"):
            image = Image.open(io.BytesIO(contents))
            # Convert to grayscale
            image = image.convert('L')
            # Apply binary thresholding (example: pixels > 128 become 255, others 0)
            # This threshold value might need tuning based on image quality
            image = image.point(lambda x: 0 if x < 128 else 255, '1')
            extracted_text = pytesseract.image_to_string(image)
        elif file.content_type == "application/pdf":
            # pdfminer.six expects a file-like object
            extracted_text = extract_text_from_pdf(io.BytesIO(contents))
        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            document = Document(io.BytesIO(contents))
            for paragraph in document.paragraphs:
                extracted_text += paragraph.text + "\n"
        else:
            return {"error": f"Unsupported file type: {file.content_type}"}
            
        if extracted_text:
            doc_id = str(uuid.uuid4())
            store_document_text(doc_id, extracted_text)
            return {"message": "File processed and text stored successfully!"}
        else:
            return {"message": "No text extracted from the file.", "text": ""}
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict_sign")
async def predict_sign_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    result = predict_sign(contents)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
