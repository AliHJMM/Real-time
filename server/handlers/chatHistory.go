package handlers

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "strconv"
    "talknet/Database"
    "talknet/server/sessions"
)

func ChatHistoryHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
    userID, isLoggedIn := sessions.GetSessionUserID(r)
    if !isLoggedIn {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    otherUserIDStr := r.URL.Query().Get("user_id")
    if otherUserIDStr == "" {
        http.Error(w, "Missing user_id parameter", http.StatusBadRequest)
        return
    }

    otherUserID, err := strconv.Atoi(otherUserIDStr)
    if err != nil {
        http.Error(w, "Invalid user_id parameter", http.StatusBadRequest)
        return
    }

    limitStr := r.URL.Query().Get("limit")
    if limitStr == "" {
        limitStr = "10"
    }
    limit, err := strconv.Atoi(limitStr)
    if err != nil {
        limit = 10
    }

    offsetStr := r.URL.Query().Get("offset")
    if offsetStr == "" {
        offsetStr = "0"
    }
    offset, err := strconv.Atoi(offsetStr)
    if err != nil {
        offset = 0
    }

    messages, err := Database.GetMessages(db, userID, otherUserID, limit, offset)
    if err != nil {
        http.Error(w, "Failed to fetch messages", http.StatusInternalServerError)
        return
    }

    // Reverse messages to be in chronological order
    for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
        messages[i], messages[j] = messages[j], messages[i]
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(messages)
}
