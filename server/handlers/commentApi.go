package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"talknet/Database"
	"talknet/server/sessions"
)

func AddCommentAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if the user is logged in
	userID, isLoggedIn := sessions.GetSessionUserID(r)
	if !isLoggedIn {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var commentData struct {
		Content string `json:"content"`
		PostID  int    `json:"post_id"`
	}
	err := json.NewDecoder(r.Body).Decode(&commentData)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Validate content
	if commentData.Content == "" {
		http.Error(w, "Comment content cannot be empty", http.StatusBadRequest)
		return
	}

	// Check if the comment exceeds 150 characters
	if len(commentData.Content) > 150 {
		http.Error(w, "Comment content cannot exceed 150 characters", http.StatusBadRequest)
		return
	}

	// Save the comment to the database
	err = Database.CreateComment(db, commentData.PostID, userID, commentData.Content)
	if err != nil {
		http.Error(w, "Failed to add comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}