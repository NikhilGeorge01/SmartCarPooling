import tweepy
import faiss
import numpy as np
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from textblob import TextBlob
import random
import time
import os
import sqlite3  # Import SQLite for database

# Set up API keys (Replace with your own keys)
TWITTER_BEARER_TOKEN = "mAAAAAAAAAAAAAAAAAAAAAOVCzgEAAAAAlHqbT79wC934VqDol9B557UJayw%3Dfsms0TuCaQxGYN2X14tzE96bKd64egmcUlM7CMtv3zb6Fe4K7a"
GEMINI_API_KEY = "AIzaSyBSWfhn5Vhjp4cRm22kl7DwRmn6C5dmmiY"

# Configure Twitter API
client = tweepy.Client(bearer_token=TWITTER_BEARER_TOKEN)

# Configure Gemini AI API
genai.configure(api_key=GEMINI_API_KEY)

# Configure Embeddings Model
embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GEMINI_API_KEY)

# Initialize FAISS Index
index = None  # Will initialize when first embedding is added

# Database Path
DB_PATH = "twitter_sentiment.db"

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for the Flask app

# Initialize SQLite Database
def init_db():
    """Initialize the database and create the table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sentiment_scores (
            username TEXT PRIMARY KEY,
            sentiment_score REAL
        )
    """)
    conn.commit()
    conn.close()

# Call this function at the start of the application
init_db()

# Database Helper Functions
def get_sentiment_from_db(username):
    """Retrieve sentiment score from the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT sentiment_score FROM sentiment_scores WHERE username = ?", (username,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def save_sentiment_to_db(username, sentiment_score):
    """Save sentiment score to the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO sentiment_scores (username, sentiment_score) VALUES (?, ?)", (username, sentiment_score))
    conn.commit()
    conn.close()

# Twitter API Functions
def get_tweets(username, count=10, max_retries=3):
    """Fetch tweets from a Twitter user with rate limit handling."""
    retries = 0
    while retries < max_retries:
        try:
            user = client.get_user(username=username, user_fields=["id"])
            if not user or not user.data:
                return []

            tweets = client.get_users_tweets(user.data.id, max_results=10)
            if tweets and tweets.data:
                return [tweet.text for tweet in random.sample(tweets.data, min(count, len(tweets.data)))]
            return []
        except tweepy.TooManyRequests:
            retries += 1
            print("Rate limit reached, retrying after 60 seconds...")
            time.sleep(60)  # Wait and retry
        except Exception as e:
            print(f"Twitter API Error: {e}")
            return []
    return []

# Sentiment Analysis
def analyze_tweet_sentiment(username, tweets):
    """Analyze sentiment of tweets and return a continuous social media factor between -1 and 1."""
    # Check if sentiment score is already in the database
    sentiment_score = get_sentiment_from_db(username)
    if sentiment_score is not None:
        print(f"Sentiment score for {username} retrieved from database: {sentiment_score}")
        return sentiment_score

    # If not in the database, calculate sentiment score
    if not tweets:
        return 0  # Default if no tweets found

    sentiments = [TextBlob(tweet).sentiment.polarity for tweet in tweets]
    avg_sentiment = sum(sentiments) / len(sentiments)  # Average polarity score

    # Ensure score is between -1 and 1
    sentiment_score = max(-1, min(1, avg_sentiment))

    # Save the sentiment score to the database
    save_sentiment_to_db(username, sentiment_score)
    print(f"Sentiment score for {username} saved to database: {sentiment_score}")

    return sentiment_score

# FAISS Embedding Functions
def store_tweet_embeddings(tweets):
    """Convert tweets to embeddings and store in FAISS."""
    global index
    tweet_embeddings = embedding_model.embed_documents(tweets)

    if index is None:
        index = faiss.IndexFlatL2(len(tweet_embeddings[0]))
    index.add(np.array(tweet_embeddings))

def retrieve_similar_cases(query):
    """Retrieve similar past cases using FAISS."""
    if index is None:
        return []

    # Convert user query (rides, rating, complaints) into an embedding
    query_embedding = embedding_model.embed_query(query)

    # Search FAISS for the closest matches
    _, indices = index.search(np.array([query_embedding]), k=3)

    # Retrieve matching training cases
    return [train_data[i] for i in indices[0] if i < len(train_data)]  # Ensure valid indices

# Trust Score Generation
def generate_trust_score(rides, avg_rating, complaints, cibil, social_media_factor, tweets):
    """Use FAISS-stored training embeddings to find similar cases before generating trust score."""
    query = f"rides: {rides}, avg_rating: {avg_rating}, complaints: {complaints}, cibil: {cibil}, social_media: '{tweets}'"
    
    # Retrieve similar cases from FAISS
    similar_cases = retrieve_similar_cases(query)

    prompt = f"""
    A user with the following details needs a trust score from 0 to 100:
    
    - Rides taken: {rides}
    - Average rating: {avg_rating} (out of 5)
    - Complaints: {complaints}
    - CIBIL score: {cibil}
    - Social media sentiment factor: {social_media_factor}
    
    Recent tweets from the user:
    {tweets}

    Similar cases from past data (retrieved via embeddings):
    {similar_cases}

    Based on this, generate a trust score. Provide ONLY a numeric trust score as output.
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return response.text.strip()

# Flask Endpoint
@app.route("/predict_trust", methods=["POST"])
def predict_trust():
    global index
    # Ensure FAISS is initialized when embeddings are added
    if index is None:
        print("FAISS index is not initialized. It will be initialized when embeddings are added.")

    data = request.json

    # Extract input values
    rides = data.get("rides", 0)
    avg_rating = data.get("avg_rating", 0)
    complaints = data.get("complaints", 0)
    cibil = data.get("cibil", 650)
    twitter_username = data.get("twitter_username", "")

    # Fetch Tweets from Twitter
    tweets = get_tweets(twitter_username, count=10)

    # Analyze Social Media Sentiment
    social_media_factor = analyze_tweet_sentiment(twitter_username, tweets)

    # Store Tweet Embeddings in FAISS
    if tweets:
        store_tweet_embeddings(tweets)

    # Generate Trust Score using AI
    try:
        trust_score = generate_trust_score(rides, avg_rating, complaints, cibil, social_media_factor, tweets)
        return jsonify({"trust_score": trust_score})
    except Exception as e:
        print(f"Error generating trust score: {e}")
        return jsonify({"error": "Error generating trust score"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)