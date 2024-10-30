// handlers/registerApi.go

package handlers

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "talknet/server"
)

func RegisterAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method Not Allowed. Please use POST.", http.StatusMethodNotAllowed)
        return
    }
    
    // Process the registration form
    var credentials struct {
        Username  string `json:"username"`      // Changed to match nickname
        Email     string `json:"email"`
        Password  string `json:"password"`
        FirstName string `json:"first_name"`
        LastName  string `json:"last_name"`
        Age       int    `json:"age"`
        Gender    string `json:"gender"`
    }
    err := json.NewDecoder(r.Body).Decode(&credentials)
    if err != nil {
        http.Error(w, "Invalid input. Please check your data and try again.", http.StatusBadRequest)
        return
    }

    // Call the server's RegisterUser function
    err = server.RegisterUser(db, credentials.Username, credentials.Email, credentials.Password, credentials.FirstName, credentials.LastName, credentials.Age, credentials.Gender)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest) // Send the custom error message
        return
    }
    w.WriteHeader(http.StatusCreated)
    w.Write([]byte("User registered successfully. You can now log in."))
}
