import cv2
import mediapipe as mp
import numpy as np
from typing import Dict
import tensorflow as tf

# Load a pre-trained TensorFlow model for sign language recognition
# (Assuming you have a trained model saved as 'sign_language_model.h5')
try:
    model = tf.keras.models.load_model('sign_language_model.h5')
except Exception as e:
    print(f"Warning: Could not load sign language model: {e}")
    model = None

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)

# Mapping of model output indices to sign labels
SIGN_LABELS = {
    0: "A",
    1: "B",
    2: "C",
    3: "D",
    4: "E",
    5: "F",
    6: "G",
    7: "H",
    8: "I",
    9: "J",
    10: "K",
    11: "L",
    12: "M",
    13: "N",
    14: "O",
    15: "P",
    16: "Q",
    17: "R",
    18: "S",
    19: "T",
    20: "U",
    21: "V",
    22: "W",
    23: "X",
    24: "Y",
    25: "Z",
    # Add more labels if your model supports them
}

def get_hand_landmarks(image: np.ndarray) -> np.ndarray:
    """
    Extract hand landmarks from image using MediaPipe.
    Returns flattened array of landmark coordinates (x, y, z) for 21 points.
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]
        landmarks = []
        for lm in hand_landmarks.landmark:
            landmarks.extend([lm.x, lm.y, lm.z])
        return np.array(landmarks)
    return None

def predict_sign(image_bytes: bytes) -> Dict[str, float]:
    """
    Predict sign from image bytes using the TensorFlow model.
    """
    if model is None:
        return {"sign": "Model not loaded", "confidence": 0.0}

    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return {"sign": "", "confidence": 0.0}

    # Get landmarks
    landmarks = get_hand_landmarks(image)

    if landmarks is None:
        return {"sign": "No hand detected", "confidence": 0.0}

    # Prepare input for model
    input_data = landmarks.reshape(1, -1)  # Reshape for batch size 1

    # Predict
    predictions = model.predict(input_data)
    predicted_index = np.argmax(predictions)
    confidence = float(np.max(predictions))

    sign_label = SIGN_LABELS.get(predicted_index, "Unknown")

    return {"sign": sign_label, "confidence": round(confidence * 100, 2)}
