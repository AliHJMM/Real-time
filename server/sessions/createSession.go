package sessions

import (
    "net/http"
    "time"
    "sync"

    "github.com/google/uuid"
)

var (
    sessionStore = map[string]int{}  // Maps sessionID to userID
    userSession  = map[int]string{}  // Maps userID to sessionID
    OnlineUsers  = make(map[int]bool) // Map to track online users
    Mutex        = &sync.Mutex{}      // Mutex to handle concurrent access
)

func CreateSession(w http.ResponseWriter, userID int) {
    // Lock the mutex to ensure thread-safe access
    Mutex.Lock()
    defer Mutex.Unlock()

    // Check if the user already has an active session
    if oldSessionID, exists := userSession[userID]; exists {
        // Invalidate the old session
        delete(sessionStore, oldSessionID)
    }

    // Create a new session
    sessionID := uuid.New().String()
    sessionStore[sessionID] = userID
    userSession[userID] = sessionID

    // Mark user as online
    OnlineUsers[userID] = true

    // Set the session cookie
    http.SetCookie(w, &http.Cookie{
        Name:     "session_id",
        Value:    sessionID,
        Path:     "/",
        Expires:  time.Now().Add(24 * time.Hour),
        HttpOnly: true, // Enhances security by preventing JavaScript access
        Secure:   false, // Set to true if using HTTPS
    })
}
