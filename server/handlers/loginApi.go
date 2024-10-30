// handlers/loginApi.go

package handlers

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "talknet/server"
    "talknet/server/sessions"
)

func LoginAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method Not Allowed. Please use POST.", http.StatusMethodNotAllowed)
        return
    }
    // Process the login form
    var credentials struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }
    err := json.NewDecoder(r.Body).Decode(&credentials)
    if err != nil {
        http.Error(w, "Invalid input. Please check your data and try again.", http.StatusBadRequest)
        return
    }

    user, err := server.LoginUser(db, credentials.Username, credentials.Password)
    if err != nil {
        http.Error(w, err.Error(), http.StatusUnauthorized) // Send custom error message
        return
    }
    sessions.CreateSession(w, user.ID)
    w.WriteHeader(http.StatusOK)
}
