import chromadb
from sentence_transformers import SentenceTransformer
from src.config import GROQ_API_KEY, OLLAMA_HOST, OLLAMA_MODEL
from gtts import gTTS
import os
import speech_recognition as sr
from groq import Groq
import ollama
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from deep_translator import GoogleTranslator
import pocketsphinx

# --- Sentiment Analyzer ---
sentiment_analyzer = SentimentIntensityAnalyzer()

# --- Groq API Client ---
groq_client = Groq(api_key=GROQ_API_KEY)

# --- Ollama Client ---
ollama_client = ollama.Client(host=OLLAMA_HOST)

# --- Vector Database (ChromaDB) ---
model = SentenceTransformer('all-MiniLM-L6-v2')
chroma_client = chromadb.PersistentClient(path="./chroma_db")
conversation_collection = chroma_client.get_or_create_collection("conversation_memory")
document_collection = chroma_client.get_or_create_collection("document_memory")

# --- Voice I/O ---
r = sr.Recognizer()

def get_sentiment(text):
    """Analyzes the sentiment of the given text."""
    return sentiment_analyzer.polarity_scores(text)

def get_llm_response(query, history, similar_conversations, sentiment_score, document_context=None):
    """Gets a response from the chosen LLM, with Ollama as fallback."""
    
    sentiment_instruction = ""
    if sentiment_score['compound'] < -0.5:
        sentiment_instruction = "The user seems upset. Please be extra empathetic and helpful."
    elif sentiment_score['compound'] > 0.5:
        sentiment_instruction = "The user seems happy. Please maintain a positive and cheerful tone."
        
    messages = [
        {
            "role": "system",
            "content": f"You are a helpful assistant. {sentiment_instruction}"
        }
    ]
    
    if document_context: # Add document context to the system message
        messages[0]["content"] += f" You have access to the following document information: {document_context}"

    if similar_conversations:
        for conv in similar_conversations:
            messages.append({"role": "user", "content": conv['user_query']})
            messages.append({"role": "assistant", "content": conv['bot_response']})

    for user_msg, bot_msg in history:
        messages.append({"role": "user", "content": user_msg})
        messages.append({"role": "assistant", "content": bot_msg})
    
    messages.append({"role": "user", "content": query})

    try:
        # Get a response from Groq only
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return "Sorry, I'm having trouble connecting. Please try again later."

def store_conversation(user_query, bot_response):
    """Stores a conversation turn in the vector database."""
    embedding = model.encode(f"User: {user_query}\nBot: {bot_response}").tolist()
    conversation_collection.add( # Changed to conversation_collection
        ids=[str(conversation_collection.count() + 1)],
        embeddings=[embedding],
        metadatas=[{"user_query": user_query, "bot_response": bot_response}]
    )

def retrieve_similar_conversations(query):
    """Retrieves similar conversations from the vector database."""
    query_embedding = model.encode(query).tolist()
    results = conversation_collection.query( # Changed to conversation_collection
        query_embeddings=[query_embedding],
        n_results=3
    )
    
    similar_conversations = []
    if results and results['metadatas'] and results['metadatas'][0]:
        for metadata in results['metadatas'][0]:
            similar_conversations.append({
                'user_query': metadata.get('user_query'),
                'bot_response': metadata.get('bot_response')
            })
            
    return similar_conversations

def store_document_text(document_id: str, text: str):
    """Stores extracted document text in the document vector database."""
    # Simple chunking for now. For very large documents, a more sophisticated chunking strategy might be needed.
    chunks = text.split('\n\n') # Split by double newline for paragraphs
    
    if not chunks:
        return

    embeddings = model.encode(chunks).tolist()
    
    # Generate unique IDs for each chunk
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    
    metadatas = [{"document_id": document_id, "chunk_text": chunk} for chunk in chunks]
    
    document_collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas
    )
    print(f"Stored {len(chunks)} chunks for document {document_id} in document_memory.")

def retrieve_document_context(query: str, n_results: int = 3) -> str:
    """Retrieves relevant document chunks from the document vector database based on a query."""
    query_embedding = model.encode(query).tolist()
    results = document_collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=['metadatas']
    )
    
    context_chunks = []
    if results and results['metadatas'] and results['metadatas'][0]:
        for metadata in results['metadatas'][0]:
            if 'chunk_text' in metadata:
                context_chunks.append(metadata['chunk_text'])
                
    return "\n\n".join(context_chunks)

def speak(text):
    """Converts text to speech and plays it."""
    tts = gTTS(text=text, lang='en')
    tts.save("response.mp3")
    os.system("start response.mp3")

def listen():
    """Listens for voice input and converts it to text using PocketSphinx."""
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        audio = recognizer.listen(source)
    try:
        text = recognizer.recognize_sphinx(audio)
        print(f"Recognized: {text}")
        return text
    except sr.UnknownValueError:
        print("PocketSphinx could not understand audio")
        return ""
    except sr.RequestError as e:
        print(f"PocketSphinx error; {e}")
        return ""

def translate_text(text, target_language='en'):
  """
  Translates text to the specified target language.
  """
  try:
    # You can change the target language to any supported language code (e.g., 'es', 'fr', 'ta' for Tamil)
    translated_text = GoogleTranslator(source='auto', target=target_language).translate(text)
    return translated_text
  except Exception as e:
    print(f"Error during translation: {e}")
    return text # Return original text if translation fails
