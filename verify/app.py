import tweepy
import faiss
import numpy as np
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from textblob import TextBlob
import random
import time
import os
import sqlite3
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
import threading
from contextlib import contextmanager
from typing import List, Optional
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API keys from environment variables
TWITTER_BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN')
if not TWITTER_BEARER_TOKEN:
    raise ValueError("TWITTER_BEARER_TOKEN not found in environment variables")

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Configure Twitter API
client = tweepy.Client(bearer_token=TWITTER_BEARER_TOKEN)

# Configure Gemini AI API
genai.configure(api_key=GEMINI_API_KEY)

# Configure Embeddings Model
try:
    embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Error initializing embedding model: {e}")
    embedding_model = None

# Initialize FAISS Index with proper dimensions
def initialize_faiss_index(dim=768):  # default dimension for most embedding models
    try:
        return faiss.IndexFlatL2(dim)
    except Exception as e:
        print(f"Error initializing FAISS index: {e}")
        return None

index = initialize_faiss_index()

# Database Path
DATABASE = "twitter_sentiment.db"

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for the Flask app

def get_db():
    """Get database connection for the current thread"""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    """Close database connection at the end of request"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

# Initialize SQLite Database
def init_db():
    """Initialize the database and create the table if it doesn't exist."""
    with app.app_context():
        db = get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS sentiment_scores (
                username TEXT PRIMARY KEY,
                sentiment_score REAL
            )
        """)
        db.commit()

# Call this function at the start of the application
init_db()

# Database Helper Functions
def get_sentiment_from_db(username):
    """Retrieve sentiment score from the database."""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT sentiment_score FROM sentiment_scores WHERE username = ?", (username,))
        result = cursor.fetchone()
        return result[0] if result else None
    except Exception as e:
        print(f"Database error in get_sentiment: {e}")
        return None

def save_sentiment_to_db(username, sentiment_score):
    """Save sentiment score to the database."""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO sentiment_scores (username, sentiment_score) VALUES (?, ?)",
            (username, sentiment_score)
        )
        db.commit()
    except Exception as e:
        print(f"Database error in save_sentiment: {e}")
        db.rollback()

# Cache for trust scores (24 hour expiry)
trust_score_cache = {}
CACHE_EXPIRY = timedelta(hours=24)

def get_cached_trust_score(key: str) -> Optional[float]:
    """Get cached trust score if valid"""
    if key in trust_score_cache:
        score, timestamp = trust_score_cache[key]
        if datetime.now() - timestamp < CACHE_EXPIRY:
            return score
        del trust_score_cache[key]
    return None

def cache_trust_score(key: str, score: float):
    """Cache a trust score with timestamp"""
    trust_score_cache[key] = (score, datetime.now())

# Twitter API Functions
def get_tweets(username, count=10, max_retries=3):
    """Fetch tweets from a Twitter user with rate limit handling."""
    if not client:
        print("Twitter client not initialized")
        return []
        
    retries = 0
    while retries < max_retries:
        try:
            user = client.get_user(username=username, user_fields=["id"])
            if not user or not user.data:
                print(f"No Twitter user found for username: {username}")
                return []

            tweets = client.get_users_tweets(user.data.id, max_results=count)
            if tweets and tweets.data:
                return [tweet.text for tweet in tweets.data[:count]]
            return []
        except tweepy.TooManyRequests:
            print(f"Twitter rate limit reached for user {username}, proceeding without tweets")
            return []  # Return empty list immediately on rate limit
        except tweepy.Unauthorized:
            print("Twitter API authentication failed")
            return []
        except Exception as e:
            print(f"Twitter API Error: {e}")
            return []
    return []

# Optimized sentiment analysis with parallel processing
@lru_cache(maxsize=1000)
def analyze_single_tweet(tweet: str) -> float:
    """Analyze sentiment of a single tweet"""
    return TextBlob(tweet).sentiment.polarity

def analyze_tweet_sentiment(username: str, tweets: List[str]) -> float:
    """Parallel sentiment analysis of tweets"""
    # Check DB cache first
    sentiment_score = get_sentiment_from_db(username)
    if sentiment_score is not None:
        return sentiment_score

    if not tweets:
        return 0

    # Process tweets in parallel
    with ThreadPoolExecutor(max_workers=4) as executor:
        sentiments = list(executor.map(analyze_single_tweet, tweets))
    
    avg_sentiment = sum(sentiments) / len(sentiments)
    sentiment_score = max(-1, min(1, avg_sentiment))
    
    # Cache in DB
    save_sentiment_to_db(username, sentiment_score)
    return sentiment_score

# Optimized FAISS operations
class EmbeddingManager:
    def __init__(self):
        self.index = None
        self.embedding_cache = {}
        self.lock = Lock()
    
    @lru_cache(maxsize=1000)
    def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding with caching"""
        return embedding_model.embed_query(text)
    
    def store_tweet_embeddings(self, tweets: List[str]):
        """Batch process embeddings"""
        with self.lock:
            embeddings = [self.get_embedding(tweet) for tweet in tweets]
            if self.index is None:
                self.index = initialize_faiss_index(len(embeddings[0]))
            self.index.add(np.array(embeddings))

embedding_manager = EmbeddingManager()

# Optimized trust score generation
@lru_cache(maxsize=100)
def generate_trust_score(rides: int, avg_rating: float, complaints: int, 
                        cibil: int, social_media_factor: float, 
                        tweets_hash: str) -> float:
    """Generate trust score with caching based on input parameters"""
    cache_key = f"{rides}_{avg_rating}_{complaints}_{cibil}_{social_media_factor}_{tweets_hash}"
    cached_score = get_cached_trust_score(cache_key)
    if cached_score is not None:
        return cached_score

    prompt = f"""
    Based on the following metrics, calculate a trust score between 0 and 100. Return ONLY the numeric score.
    
    Metrics:
    - Rides completed: {rides}
    - Average rating: {avg_rating} (out of 5)
    - Number of complaints: {complaints}
    - CIBIL score: {cibil} (out of 900)
    - Social media sentiment: {social_media_factor} (between -1 and 1)

    Please provide a single number between 0 and 100 as the trust score. Do not include any explanation or additional text.
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-pro")  # Using pro model for better control
        generation_config = {
            "temperature": 0.1,  # Lower temperature for more consistent numeric output
            "top_p": 0.1,
            "top_k": 1,
            "max_output_tokens": 8,  # Limiting output length to ensure we get just a number
        }
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]
        
        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Clean the response to ensure we get a valid number
        try:
            score_text = response.text.strip()
            # Remove any non-numeric characters except decimal point
            score_text = ''.join(c for c in score_text if c.isdigit() or c == '.')
            trust_score = float(score_text)
            # Ensure the score is between 0 and 100
            trust_score = max(0, min(100, trust_score))
            cache_trust_score(cache_key, trust_score)
            return trust_score
        except (ValueError, AttributeError) as e:
            print(f"Error parsing trust score: {e}")
            return 50.0  # Default score if parsing fails
            
    except Exception as e:
        print(f"Error in trust score generation: {e}")
        return 50.0  # Default fallback score

# Flask Endpoint
@app.route("/predict_trust", methods=["POST"])
def predict_trust():
    global index
    if index is None:
        print("FAISS index is not initialized. It will be initialized when embeddings are added.")

    data = request.json

    # Extract input values
    rides = data.get("rides", 0)
    avg_rating = data.get("avg_rating", 0)
    complaints = data.get("complaints", 0)
    cibil = data.get("cibil", 650)
    twitter_username = data.get("twitter_username", "")

    # Fetch Tweets from Twitter - if rate limited, proceed with empty tweets
    tweets = get_tweets(twitter_username, count=10)
    
    # Calculate social media factor - will return 0 for empty tweets
    social_media_factor = analyze_tweet_sentiment(twitter_username, tweets)

    # Only store embeddings if we actually have tweets
    if tweets:
        try:
            embedding_manager.store_tweet_embeddings(tweets)
        except Exception as e:
            print(f"Error storing tweet embeddings: {e}")
            # Continue processing even if embedding storage fails

    # Generate Trust Score using AI
    try:
        tweets_hash = hash(tuple(tweets)) if tweets else 0
        trust_score = generate_trust_score(rides, avg_rating, complaints, cibil, social_media_factor, tweets_hash)
        return jsonify({
            "trust_score": trust_score,
            "social_media_factor": social_media_factor,
            "tweets_analyzed": len(tweets),
            "twitter_status": "rate_limited" if not tweets and twitter_username else "success" if tweets else "no_tweets"
        })
    except Exception as e:
        print(f"Error generating trust score: {e}")
        return jsonify({
            "error": "Error generating trust score",
            "twitter_status": "rate_limited" if not tweets and twitter_username else "no_tweets"
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)