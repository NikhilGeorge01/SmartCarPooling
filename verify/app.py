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

# Set up API keys (Replace with your own keys)
TWITTER_BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAOVCzgEAAAAA%2B3x9xdZCGtYCZoQiNild1NeXOTU%3DId7L3VL8N8vSzuIYDe3n5WNiBrTJ2wr5cftpcphH6ZowmJWLfr"
GEMINI_API_KEY = "AIzaSyBSWfhn5Vhjp4cRm22kl7DwRmn6C5dmmiY"

# Configure Twitter API
client = tweepy.Client(bearer_token=TWITTER_BEARER_TOKEN)

# Configure Gemini AI API
genai.configure(api_key=GEMINI_API_KEY)

# Configure Embeddings Model
embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GEMINI_API_KEY)

# Initialize FAISS Index
index = None  # Will initialize when first embedding is added

# Define train_data with some example cases
train_data = [
    "rides: 10, avg_rating: 4.5, complaints: 1, cibil: 750, social_media: 'positive tweets', trust_score: 85",
    "rides: 5, avg_rating: 3.0, complaints: 2, cibil: 680, social_media: 'neutral tweets', trust_score: 60",
    "rides: 20, avg_rating: 4.8, complaints: 0, cibil: 800, social_media: 'very positive tweets', trust_score: 95",
    "rides: 15, avg_rating: 4.2, complaints: 1, cibil: 720, social_media: 'positive tweets', trust_score: 80",
    "rides: 8, avg_rating: 3.5, complaints: 3, cibil: 690, social_media: 'mixed tweets', trust_score: 65",
    "rides: 12, avg_rating: 4.0, complaints: 2, cibil: 710, social_media: 'neutral tweets', trust_score: 75",
    "rides: 25, avg_rating: 4.9, complaints: 0, cibil: 820, social_media: 'very positive tweets', trust_score: 98",
    "rides: 7, avg_rating: 3.8, complaints: 1, cibil: 700, social_media: 'positive tweets', trust_score: 70",
    "rides: 18, avg_rating: 4.6, complaints: 1, cibil: 760, social_media: 'positive tweets', trust_score: 90",
    "rides: 3, avg_rating: 2.5, complaints: 4, cibil: 650, social_media: 'negative tweets', trust_score: 50",
    "rides: 22, avg_rating: 4.7, complaints: 0, cibil: 810, social_media: 'very positive tweets', trust_score: 97",
    "rides: 9, avg_rating: 3.9, complaints: 2, cibil: 700, social_media: 'neutral tweets', trust_score: 72",
    "rides: 14, avg_rating: 4.3, complaints: 1, cibil: 730, social_media: 'positive tweets', trust_score: 82",
    "rides: 6, avg_rating: 3.2, complaints: 3, cibil: 670, social_media: 'mixed tweets', trust_score: 62",
    "rides: 11, avg_rating: 4.1, complaints: 2, cibil: 710, social_media: 'neutral tweets', trust_score: 74",
    "rides: 30, avg_rating: 5.0, complaints: 0, cibil: 850, social_media: 'very positive tweets', trust_score: 100",
    "rides: 4, avg_rating: 2.8, complaints: 3, cibil: 660, social_media: 'negative tweets', trust_score: 55",
    "rides: 16, avg_rating: 4.4, complaints: 1, cibil: 740, social_media: 'positive tweets', trust_score: 85",
    "rides: 2, avg_rating: 2.0, complaints: 5, cibil: 640, social_media: 'very negative tweets', trust_score: 45",
    "rides: 21, avg_rating: 4.6, complaints: 0, cibil: 800, social_media: 'very positive tweets', trust_score: 95",
    "rides: 13, avg_rating: 4.0, complaints: 2, cibil: 720, social_media: 'neutral tweets', trust_score: 75",
    "rides: 17, avg_rating: 4.5, complaints: 1, cibil: 750, social_media: 'positive tweets', trust_score: 88",
    "rides: 1, avg_rating: 1.5, complaints: 6, cibil: 630, social_media: 'very negative tweets', trust_score: 40",
    "rides: 19, avg_rating: 4.7, complaints: 0, cibil: 780, social_media: 'very positive tweets', trust_score: 92",
    "rides: 23, avg_rating: 4.8, complaints: 0, cibil: 820, social_media: 'very positive tweets', trust_score: 98",
    "rides: 12, avg_rating: 3.7, complaints: 2, cibil: 700, social_media: 'neutral tweets', trust_score: 70",
    "rides: 5, avg_rating: 3.0, complaints: 3, cibil: 680, social_media: 'mixed tweets', trust_score: 60",
    "rides: 27, avg_rating: 4.9, complaints: 0, cibil: 830, social_media: 'very positive tweets', trust_score: 99",
    "rides: 8, avg_rating: 3.4, complaints: 2, cibil: 690, social_media: 'neutral tweets', trust_score: 68",
    "rides: 20, avg_rating: 4.5, complaints: 1, cibil: 760, social_media: 'positive tweets', trust_score: 85"
]
def store_training_embeddings():
    """Embed training data and store it in FAISS"""
    global index

    # Convert training data into text format suitable for embedding
    train_texts = [entry for entry in train_data]
    
    # Generate embeddings for training data
    train_embeddings = embedding_model.embed_documents(train_texts)

    # Initialize FAISS index if not already done
    if index is None:
        index = faiss.IndexFlatL2(len(train_embeddings[0]))  # L2 distance for similarity search

    # Store embeddings in FAISS
    index.add(np.array(train_embeddings))

    print("Training data embeddings stored successfully!")

# Call this function once at the start
store_training_embeddings()


app = Flask(__name__)
CORS(app)  # Enable CORS for the Flask app

def get_tweets(username, count=2, max_retries=3):
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

def analyze_tweet_sentiment(tweets):
    """Analyze sentiment of tweets and return a continuous social media factor between -1 and 1."""
    if not tweets:
        return 0  # Default if no tweets found

    sentiments = [TextBlob(tweet).sentiment.polarity for tweet in tweets]
    avg_sentiment = sum(sentiments) / len(sentiments)  # Average polarity score

    # Ensure score is between -1 and 1
    return max(-1, min(1, avg_sentiment))  

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

    """Use Gemini AI to generate trust score based on input data and past cases."""
    query = f"rides: {rides}, avg_rating: {avg_rating}, complaints: {complaints}, cibil: {cibil}, social_media: '{tweets}'"
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

    Similar cases from past data:
    {similar_cases}

    Based on this, generate a trust score. Provide ONLY a numeric trust score as output.
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return response.text.strip()

@app.route("/predict_trust", methods=["POST"])
def predict_trust():
    global index
    if index is None:
        store_training_embeddings()  # Ensure FAISS is initialized before predictions

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
    social_media_factor = analyze_tweet_sentiment(tweets)

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