package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"talknet/Database"
	"talknet/server/sessions"
)

func ChatHistoryHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    // Authenticate the user
    currentUserID, isLoggedIn := sessions.GetSessionUserID(r)
    if !isLoggedIn {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Get query parameters
    userIDStr := r.URL.Query().Get("user_id")
    if userIDStr == "" {
        http.Error(w, "Missing user_id parameter", http.StatusBadRequest)
        return
    }

    userID, err := strconv.Atoi(userIDStr)
    if err != nil {
        http.Error(w, "Invalid user_id parameter", http.StatusBadRequest)
        return
    }

    //Pagination parameters
    limitStr := r.URL.Query().Get("limit")
    limit := 20
    if limitStr != "" {
        limit, err = strconv.Atoi(limitStr)
        if err != nil || limit <= 0 {
            http.Error(w, "Invalid limit parameter", http.StatusBadRequest)
            return
        }
    }

    offsetStr := r.URL.Query().Get("offset")
    offset := 0
    if offsetStr != "" {
        offset, err = strconv.Atoi(offsetStr)
        if err != nil || offset < 0 {
            http.Error(w, "Invalid offset parameter", http.StatusBadRequest)
            return
        }
    }

    // Fetch chat history from the database
    messages, err := Database.GetChatHistory(db, currentUserID, userID, limit, offset)
    if err != nil {
        log.Printf("Error fetching chat history: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    // Respond with JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(messages)
}

