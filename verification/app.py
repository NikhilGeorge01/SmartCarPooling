from flask import Flask, request, jsonify
import faiss
import numpy as np
import google.generativeai as genai
import config
import pickle
import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings

app = Flask(__name__)

# ✅ Load Google Gemini API Key
genai.configure(api_key=config.GEMINI_API_KEY)
embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=config.GEMINI_API_KEY)

# ✅ Initialize FAISS Index
vector_size = 768
index_path = "models/faiss_index.bin"

index = faiss.IndexFlatL2(vector_size)

# ✅ Try to Load Existing Index
if os.path.exists(index_path):
    try:
        index = faiss.read_index(index_path)
        print("✅ FAISS index loaded successfully.")
    except Exception as e:
        print(f"⚠️ FAISS index corrupted, creating a new one. Error: {e}")
        index = faiss.IndexFlatL2(vector_size)
else:
    print("🆕 No FAISS index found, starting fresh.")

# ✅ Load Pre-trained ML Trust Score Model
model_path = "models/trust_model.pkl"
pca_model_path = "models/pca_model.pkl"
if os.path.exists(model_path) and os.path.exists(pca_model_path):
    try:
        with open(model_path, "rb") as f:
            trust_model = pickle.load(f)  # ✅ Use built-in pickle
        with open(pca_model_path, "rb") as f:
            pca = pickle.load(f)  # ✅ Load fitted PCA model
        print("✅ Trust score model and PCA model loaded.")
    except Exception as e:
        raise FileNotFoundError(f"❌ Error loading models: {e}")
else:
    raise FileNotFoundError("❌ Trust model or PCA model not found! Run train_model.py first.")

def get_embedding(text):
    """Generate text embeddings using Google Gemini API via LangChain."""
    return embedding_model.embed_documents([text])[0]

@app.route("/verify", methods=["POST"])
def verify_user():
    """Handles user verification and generates a trust score."""
    try:
        data = request.json
        name = data.get("name")
        email = data.get("email")
        ride_history = data.get("ride_history", "")
        social_media = data.get("social_media", "")

        if not name or not email:
            return jsonify({"error": "Name and email are required"}), 400

        # ✅ Generate user vector from text
        user_text = f"User: {name}, Email: {email}, Ride History: {ride_history}, Social Media: {social_media}"
        user_vector = get_embedding(user_text)

        # Convert user_vector to a NumPy array and reshape it
        user_vector = np.array(user_vector).reshape(1, -1)

        # Reduce dimensionality of the embedding using the fitted PCA model
        user_vector_reduced = pca.transform(user_vector)

        # ✅ Store embedding in FAISS
        index.add(user_vector)
        faiss.write_index(index, index_path)

        # ✅ Predict Trust Score
        trust_score = trust_model.predict(user_vector_reduced)[0]

        return jsonify({
            "message": "User verification complete.",
            "trust_score": round(trust_score, 2)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)