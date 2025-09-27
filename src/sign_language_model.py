import cv2
import numpy as np
from typing import Dict
import tensorflow as tf

# Load a pre-trained TensorFlow model for sign language recognition
# (Assuming you have a trained model saved as 'sign_language_model.h5')
try:
    model = tf.keras.models.load_model('sign_language_model.h5')
    print("Sign language model loaded successfully")
except Exception as e:
    print(f"Warning: Could not load sign language model: {e}")
    model = None

# Try to import mediapipe, fallback if not available
try:
    import mediapipe as mp
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.5
    )
    MEDIAPIPE_AVAILABLE = True
    print("MediaPipe loaded successfully")
except ImportError:
    print("MediaPipe not available, using direct image processing")
    MEDIAPIPE_AVAILABLE = False

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
    Extract hand landmarks from image using MediaPipe if available.
    Returns flattened array of landmark coordinates (x, y, z) for 21 points.
    """
    if not MEDIAPIPE_AVAILABLE:
        return None

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]
        landmarks = []
        for lm in hand_landmarks.landmark:
            landmarks.extend([lm.x, lm.y, lm.z])
        return np.array(landmarks)
    return None

def preprocess_image_for_model(image: np.ndarray, target_size=(224, 224)):
    """
    Preprocess image for direct model input (if model expects images instead of landmarks)
    """
    # Resize image
    resized = cv2.resize(image, target_size)
    # Normalize pixel values
    normalized = resized.astype(np.float32) / 255.0
    # Add batch dimension
    return np.expand_dims(normalized, axis=0)

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
        return {"sign": "Invalid image", "confidence": 0.0}

    # Try to get landmarks first (if MediaPipe is available)
    landmarks = get_hand_landmarks(image)

    if landmarks is not None:
        # Use landmarks if available
        input_data = landmarks.reshape(1, -1)
    else:
        # Fallback to direct image processing
        input_data = preprocess_image_for_model(image)

    try:
        # Predict
        predictions = model.predict(input_data, verbose=0)
        predicted_index = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))

        sign_label = SIGN_LABELS.get(predicted_index, "Unknown")

        return {"sign": sign_label, "confidence": round(confidence * 100, 2)}
    except Exception as e:
        print(f"Prediction error: {e}")
        return {"sign": "Prediction failed", "confidence": 0.0}
