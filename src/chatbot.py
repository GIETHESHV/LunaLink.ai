from src.rule_based_responses import get_rule_based_response
from src.utils import (
    get_llm_response,
    store_conversation,
    retrieve_similar_conversations,
    speak,
    listen,
    get_sentiment,
    translate_text,
)


def main():
    """Main function for the chatbot."""
    print("Chatbot initialized. Type 'exit' to quit.")
    
    # Ask for preferred language
    target_language = input("Enter your preferred language code (e.g., 'en' for English, 'ta' for Tamil, 'es' for Spanish): ").lower()
    
    history = []
    
    while True:
        input_method = input("Choose input method (text/voice): ").lower()
        
        if input_method == 'voice':
            user_input = listen()
            if not user_input:
                continue
        else:
            user_input = input("You: ")

        if user_input.lower() == 'exit':
            break
            
        # 1. Get rule-based response
        response = get_rule_based_response(user_input)
        
        # 2. If no rule-based response, go to AI model
        if not response:
            # Get sentiment of user input
            sentiment_score = get_sentiment(user_input)
            
            # Retrieve similar conversations from long-term memory
            similar_conversations = retrieve_similar_conversations(user_input)
            
            # Get response from AI model with context and sentiment
            response = get_llm_response(user_input, history, similar_conversations, sentiment_score)
            
        # Store the new conversation in long-term memory (in English)
        store_conversation(user_input, response)
        
        # Translate the response to the user's preferred language
        translated_response = translate_text(response, target_language)
            
        print(f"Bot: {translated_response}")
        
        # Ask if user wants the response spoken
        speak_choice = input("Speak response? (y/n): ").lower()
        if speak_choice == 'y':
            speak(translated_response)
        
        # 3. Update short-term history (in English)
        history.append((user_input, response))
        if len(history) > 5:
            history.pop(0)

if __name__ == "__main__":
    main()
