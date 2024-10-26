package sessions

import (
    "net/http"
)

func GetSessionUserID(r *http.Request) (int, bool) {
    cookie, err := r.Cookie("session_id")
    if err != nil {
        return -1, false
    }

    sessionID := cookie.Value

    Mutex.Lock()
    userID, ok := sessionStore[sessionID]
    Mutex.Unlock()
    if !ok {
        return -1, false
    }

    Mutex.Lock()
    currentSessionID, exists := userSession[userID]
    Mutex.Unlock()
    if !exists || currentSessionID != sessionID {
        // The session is invalid or has been replaced
        return -1, false
    }

    return userID, true
}
