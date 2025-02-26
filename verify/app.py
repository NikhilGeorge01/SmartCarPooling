import tweepy
import faiss
import numpy as np
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from flask import Flask, request, jsonify
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

# ----------------- TRAINING DATASET -----------------

train_data = [
    "rides: 5, avg_rating: 3.5, complaints: 3, cibil: 650, social_media: 'bad' -> trust_score: 41.75",
    "rides: 10, avg_rating: 3.0, complaints: 5, cibil: 670, social_media: 'terrible' -> trust_score: 45.40",
    "rides: 15, avg_rating: 3.2, complaints: 4, cibil: 660, social_media: 'neutral' -> trust_score: 52.55",
    "rides: 20, avg_rating: 3.8, complaints: 2, cibil: 690, social_media: 'decent' -> trust_score: 62.30",
    "rides: 25, avg_rating: 4.0, complaints: 1, cibil: 710, social_media: 'good' -> trust_score: 73.50",
    "rides: 30, avg_rating: 4.2, complaints: 1, cibil: 730, social_media: 'excellent' -> trust_score: 87.60",
    "rides: 35, avg_rating: 4.1, complaints: 2, cibil: 720, social_media: 'average' -> trust_score: 81.15",
    "rides: 40, avg_rating: 4.5, complaints: 0, cibil: 750, social_media: 'amazing' -> trust_score: 95.80",
    "rides: 45, avg_rating: 4.4, complaints: 1, cibil: 740, social_media: 'satisfactory' -> trust_score: 88.70",
    "rides: 50, avg_rating: 4.7, complaints: 0, cibil: 780, social_media: 'perfect' -> trust_score: 100.45",
    "rides: 55, avg_rating: 4.6, complaints: 1, cibil: 790, social_media: 'excellent' -> trust_score: 99.00",
    "rides: 60, avg_rating: 4.8, complaints: 0, cibil: 800, social_media: 'top service' -> trust_score: 100.80",
    "rides: 65, avg_rating: 4.9, complaints: 0, cibil: 810, social_media: 'flawless' -> trust_score: 100.90",
    "rides: 70, avg_rating: 5.0, complaints: 0, cibil: 820, social_media: 'outstanding' -> trust_score: 100.00",
    "rides: 75, avg_rating: 4.6, complaints: 1, cibil: 830, social_media: 'recommended' -> trust_score: 98.35",
    "rides: 80, avg_rating: 4.3, complaints: 2, cibil: 840, social_media: 'okay' -> trust_score: 94.50",
    "rides: 85, avg_rating: 4.2, complaints: 3, cibil: 850, social_media: 'great' -> trust_score: 91.85",
    "rides: 90, avg_rating: 4.7, complaints: 1, cibil: 860, social_media: 'fantastic' -> trust_score: 98.75",
    "rides: 95, avg_rating: 4.8, complaints: 0, cibil: 870, social_media: 'exceptional' -> trust_score: 99.90",
    "rides: 100, avg_rating: 5.0, complaints: 0, cibil: 880, social_media: 'perfect' -> trust_score: 100.00",
]
train_data += [
    "rides: 6, avg_rating: 3.6, complaints: 2, cibil: 655, social_media: 'bad' -> trust_score: 43.20",
    "rides: 12, avg_rating: 3.1, complaints: 5, cibil: 675, social_media: 'terrible' -> trust_score: 47.10",
    "rides: 18, avg_rating: 3.4, complaints: 4, cibil: 665, social_media: 'neutral' -> trust_score: 54.75",
    "rides: 22, avg_rating: 3.9, complaints: 2, cibil: 695, social_media: 'decent' -> trust_score: 64.80",
    "rides: 28, avg_rating: 4.1, complaints: 1, cibil: 715, social_media: 'good' -> trust_score: 77.25",
    "rides: 32, avg_rating: 4.3, complaints: 1, cibil: 735, social_media: 'excellent' -> trust_score: 89.90",
    "rides: 38, avg_rating: 4.0, complaints: 2, cibil: 725, social_media: 'average' -> trust_score: 83.50",
    "rides: 42, avg_rating: 4.6, complaints: 0, cibil: 755, social_media: 'amazing' -> trust_score: 97.10",
    "rides: 48, avg_rating: 4.5, complaints: 1, cibil: 745, social_media: 'satisfactory' -> trust_score: 91.60",
    "rides: 52, avg_rating: 4.8, complaints: 0, cibil: 785, social_media: 'perfect' -> trust_score: 101.00",
    "rides: 58, avg_rating: 4.7, complaints: 1, cibil: 795, social_media: 'excellent' -> trust_score: 99.75",
    "rides: 63, avg_rating: 4.9, complaints: 0, cibil: 805, social_media: 'top service' -> trust_score: 101.25",
    "rides: 68, avg_rating: 5.0, complaints: 0, cibil: 815, social_media: 'flawless' -> trust_score: 101.50",
    "rides: 73, avg_rating: 4.6, complaints: 1, cibil: 825, social_media: 'recommended' -> trust_score: 99.15",
    "rides: 78, avg_rating: 4.4, complaints: 2, cibil: 835, social_media: 'okay' -> trust_score: 95.00",
    "rides: 83, avg_rating: 4.3, complaints: 3, cibil: 845, social_media: 'great' -> trust_score: 92.40",
    "rides: 88, avg_rating: 4.8, complaints: 1, cibil: 855, social_media: 'fantastic' -> trust_score: 99.25",
    "rides: 93, avg_rating: 4.9, complaints: 0, cibil: 865, social_media: 'exceptional' -> trust_score: 100.10",
    "rides: 98, avg_rating: 5.0, complaints: 0, cibil: 875, social_media: 'perfect' -> trust_score: 100.50",
    "rides: 100, avg_rating: 5.0, complaints: 0, cibil: 890, social_media: 'legendary' -> trust_score: 100.75",
]

# Convert training data to embeddings & store in FAISS
train_embeddings = embedding_model.embed_documents(train_data)

index = faiss.IndexFlatL2(len(train_embeddings[0]))
index.add(np.array(train_embeddings))

# ----------------- FLASK APP -----------------
app = Flask(__name__)

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
    trust_score = generate_trust_score(rides, avg_rating, complaints, cibil, social_media_factor, tweets)

    return jsonify({"trust_score": trust_score})

# ----------------- RUN FLASK APP -----------------
if __name__ == "__main__":
    app.run(debug=True)
