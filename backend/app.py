import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)  # This allows your React app to talk to this Flask app safely

# --- MONGODB CONNECTION ---
# This line connects Python to your local MongoDB server
client = MongoClient("mongodb://localhost:27017/")
# This creates (or opens) a database named "standup_db"
db = client["standup_db"]
# This creates a table (collection) inside that database called "posts"
posts_collection = db["posts"]

@app.route("/")
def home():
    return {"message": "Konvergenz Standup Logger Backend with MongoDB Running"}
# --- ENDPOINT 1: POST /standups (Save a new standup) ---
@app.route("/standups", methods=["POST"])
def create_standup():
    try:
        data = request.json
        
        # Validation Check: Ensure required text fields are present
        if not data.get("author") or not data.get("yesterday") or not data.get("today"):
            return jsonify({"error": "Missing required fields"}), 400
            
        # Create the structured record (The StandupPost Model equivalent in MongoDB)
        new_post = {
            "author": data.get("author"),
            "yesterday": data.get("yesterday"),
            "today": data.get("today"),
            "blockers": data.get("blockers", ""),
            "has_blocker": bool(data.get("has_blocker", False)),
            "file_attachment": data.get("file_attachment", ""),  # Storing as string/URL for simplicity
            "timestamp": datetime.datetime.utcnow().isoformat()   # Saves exactly when it was written
        }
        
        # Save it into the notebook (MongoDB Collection)
        result = posts_collection.insert_one(new_post)
        new_post["_id"] = str(result.inserted_id) # Convert internal ID to a readable string
        
        return jsonify(new_post), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- ENDPOINT 2: GET /standups (Fetch all standups for the live feed) ---
@app.route("/standups", methods=["GET"])
def get_standups():
    try:
        # Fetch everything, sort by latest timestamp first (-1)
        cursor = posts_collection.find().sort("timestamp", -1)
        
        all_posts = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"]) # Make ID readable for JavaScript/React
            all_posts.append(doc)
            
        return jsonify(all_posts), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- ENDPOINT 3: GET /standups/stats (Dashboard data for past 7 days) ---
@app.route("/standups/stats", methods=["GET"])
def get_stats():
    try:
        # Let's read through our database and count things for the dashboard
        cursor = posts_collection.find()
        
        # Simple breakdown dictionary structures to track data
        posts_per_day = {}
        blocker_count = 0
        
        for doc in cursor:
            # Extract only the Date part (YYYY-MM-DD) from the full timestamp string
            date_str = doc["timestamp"].split("T")[0]
            
            # Count posts per day
            posts_per_day[date_str] = posts_per_day.get(date_str, 0) + 1
            
            # Count total blockers
            if doc.get("has_blocker") == True:
                blocker_count += 1
                
        return jsonify({
            "posts_per_day": posts_per_day,
            "total_blockers": blocker_count
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True)