package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"talknet/server"
)

func RegisterAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Process the registration form
	var credentials struct {
    Username  string `json:"username"`
    Email     string `json:"email"`
    Password  string `json:"password"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Age       int    `json:"age"`
    Gender    string `json:"gender"`
}
	err := json.NewDecoder(r.Body).Decode(&credentials)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err= server.RegisterUser(db, credentials.Username, credentials.Email, credentials.Password,credentials.FirstName,credentials.LastName,credentials.Age,credentials.Gender)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("User registered successfully"))
}
