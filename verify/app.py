import tweepy
import faiss
import numpy as np
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from textblob import TextBlob
import random

# ----------------- CONFIGURATION -----------------

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

# ----------------- FLASK APP -----------------
app = Flask(__name__)
CORS(app)  # Enable CORS for the Flask app

# ----------------- FUNCTION TO FETCH TWEETS -----------------
def get_tweets(username, count=2):
    """Fetch any 2 random tweets from a Twitter user."""
    try:
        user = client.get_user(username=username, user_fields=["id"])
        tweets = client.get_users_tweets(user.data.id, max_results=10)  # Fetch more tweets initially

        if tweets.data:
            selected_tweets = random.sample(tweets.data, min(count, len(tweets.data)))  # Pick 2 random tweets
            return [tweet.text for tweet in selected_tweets]
        return []
    except Exception as e:
        print(f"Error fetching tweets: {e}")
        return []

# ----------------- FUNCTION TO ANALYZE SENTIMENT -----------------
def analyze_tweet_sentiment(tweets):
    """Analyze sentiment of tweets and return a continuous social media factor between -1 and 1."""
    if not tweets:
        return 0  # Default if no tweets found

    sentiments = [TextBlob(tweet).sentiment.polarity for tweet in tweets]
    avg_sentiment = sum(sentiments) / len(sentiments)  # Average polarity score

    # Ensure score is between -1 and 1
    return max(-1, min(1, avg_sentiment))  

# ----------------- FUNCTION TO STORE EMBEDDINGS IN FAISS -----------------
def store_tweet_embeddings(tweets):
    """Convert tweets to embeddings and store in FAISS."""
    global index
    tweet_embeddings = embedding_model.embed_documents(tweets)

    if index is None:
        index = faiss.IndexFlatL2(len(tweet_embeddings[0]))
    index.add(np.array(tweet_embeddings))

# ----------------- FUNCTION TO RETRIEVE SIMILAR CASES -----------------
def retrieve_similar_cases(query):
    """Retrieve similar cases from FAISS."""
    if index is None:
        return []
    
    query_embedding = embedding_model.embed_query(query)
    _, indices = index.search(np.array([query_embedding]), k=3)

    return [train_data[i] for i in indices[0] if i < len(train_data)]  # Ensure valid indices

# ----------------- FUNCTION TO GENERATE TRUST SCORE -----------------
def generate_trust_score(rides, avg_rating, complaints, cibil, social_media_factor, tweets):
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

    Similar cases from past data, please follow this accurately in this actually the the avg rating and and complaints are given more importance as the number of rides increase above 4 is a good rating and if complaints are below 10 % of rides then its a good sign and if the cibil score is above 700 then its a good sign if complaints go above 20% of no of rides please reduce ride score drastically:
    {similar_cases}


    Based on this, generate a trust score. Provide ONLY a numeric trust score as output.
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return response.text.strip()

# ----------------- FLASK ROUTE TO PREDICT TRUST SCORE -----------------
@app.route("/predict_trust", methods=["POST"])
def predict_trust():
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

# ----------------- RUN FLASK APP -----------------
if __name__ == "__main__":
    app.run(debug=True, port=5001)