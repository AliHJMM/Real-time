package handlers
import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"talknet/Database"
	"talknet/server/sessions"
)

func LikeDislikeAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		log.Println("Invalid request method")
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var requestData struct {
		PostID int    `json:"postId"`
		Action string `json:"action"` // "like" or "dislike"
		Type   string `json:"type"`   // "post" or "comment"
	}
	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	userID, isLoggedIn := sessions.GetSessionUserID(r)
	if !isLoggedIn {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	val, err := Database.CheckReactionExists(db, requestData.PostID, userID, requestData.Type)
	if (val == 1 && requestData.Action == "like") || (val == 0 && requestData.Action == "dislike") {
		Database.RemoveLikeDislike(db, userID, requestData.PostID, requestData.Type)
		requestData.Action = "Delete"
	} else {

		// Remove any existing like/dislike by this user on this post
		_, err = Database.RemoveLikeDislike(db, userID, requestData.PostID, requestData.Type)
		if err != nil {
			log.Println("Error removing existing like/dislike:", err)
			http.Error(w, "Database Error", http.StatusInternalServerError)
			return
		}

		// Add new like/dislike
		if requestData.Type == "post" {
			if requestData.Action == "like" {
				err = Database.CreateLike(db, userID, &requestData.PostID, nil)
			} else if requestData.Action == "dislike" {
				err = Database.CreateDislike(db, userID, &requestData.PostID, nil)
			}
		} else if requestData.Type == "comment" {
			if requestData.Action == "like" {
				err = Database.CreateLike(db, userID, nil, &requestData.PostID)
			} else if requestData.Action == "dislike" {
				err = Database.CreateDislike(db, userID, nil, &requestData.PostID)
			}
		}

		if err != nil {
			log.Println("Error creating like/dislike:", err)
			http.Error(w, "Database Error", http.StatusInternalServerError)
			return
		}
	}

	// Get updated like/dislike counts
	likeCount, dislikeCount, err := Database.GetLikeDislikeCounts(db, requestData.PostID, requestData.Type)
	if err != nil {
		log.Println("Error getting like/dislike counts:", err)
		http.Error(w, "Database Error", http.StatusInternalServerError)
		return
	}

	// Send the updated counts back to the client
	responseData := map[string]interface{}{
		"likeCount":    likeCount,
		"dislikeCount": dislikeCount,
		"action":       requestData.Action,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseData)
}