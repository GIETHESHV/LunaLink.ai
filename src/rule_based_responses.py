import re

# Simple rule-based responses
RULES = {
    r"how are you": "I am a bot, but I'm doing great! Thanks for asking.",
    r"what is your name": "I am a chatbot created for the Yuva Competition.",
    r"bye|goodbye": "Goodbye! Have a great day!",

}

def get_rule_based_response(query):
    """Checks for a rule-based response."""
    for pattern, response in RULES.items():
        if re.search(pattern, query, re.IGNORECASE):
            return response
    return None
