from sklearn.ensemble import RandomForestRegressor
from sklearn.decomposition import PCA
import numpy as np
import pickle
import os
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import config

# Load Google Gemini API Key
genai.configure(api_key=config.GEMINI_API_KEY)
embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=config.GEMINI_API_KEY)

def get_embedding(text):
    """Generate text embeddings using Google Gemini API via LangChain."""
    return embedding_model.embed_documents([text])[0]

# Training Data: [Rides Taken, Avg Rating, Complaints, CIBIL Score]
training_texts = [
    "User: User1, Rides Taken: 20, Avg Rating: 4.8, Complaints: 0, CIBIL Score: 750",
    "User: User2, Rides Taken: 5, Avg Rating: 3.2, Complaints: 2, CIBIL Score: 500",
    "User: User3, Rides Taken: 15, Avg Rating: 4.6, Complaints: 0, CIBIL Score: 680",
]

# Generate embeddings for training data
X_train = np.array([get_embedding(text) for text in training_texts])

# Fit PCA model
pca = PCA(n_components=3)
X_train_reduced = pca.fit_transform(X_train)

# Trust Scores
y_train = np.array([90, 40, 80])

# Train Model
model = RandomForestRegressor()
model.fit(X_train_reduced, y_train)

# ✅ Ensure the models directory exists
if not os.path.exists("models"):
    os.makedirs("models")

# Save Model
with open("models/trust_model.pkl", "wb") as f:
    pickle.dump(model, f)

# Save PCA Model
with open("models/pca_model.pkl", "wb") as f:
    pickle.dump(pca, f)

print("✅ Trust Score Model and PCA Model Trained and Saved.")