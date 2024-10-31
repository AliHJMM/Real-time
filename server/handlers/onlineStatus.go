package handlers

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "talknet/Database"
    "talknet/server/sessions"
    "talknet/structs"
)

func OnlineUsersAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
    // Ensure the user is authenticated
    userID, isLoggedIn := sessions.GetSessionUserID(r)
    if !isLoggedIn {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Fetch all users
    users, err := Database.GetAllUsers(db)
    if err != nil {
        http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
        return
    }

    // Prepare the response
    var responseUsers []structs.User

    sessions.Mutex.Lock()
    for _, user := range users {
        // Skip the current 
        if user.ID == userID {
            continue
        }

        // Set the online status
        _, isOnline := sessions.OnlineUsers[user.ID]
        user.Online = isOnline

        // Get the last message time
        lastMessageTime, err := Database.GetLastMessageTime(db, userID, user.ID)
        if err != nil {
            // Log the error if needed
            user.LastMessageTime = 0
        } else {
            user.LastMessageTime = lastMessageTime
        }

        responseUsers = append(responseUsers, user)
    }
    sessions.Mutex.Unlock()

    // Return the users as JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(struct {
        Users []structs.User `json:"users"`
    }{
        Users: responseUsers,
    })
}
