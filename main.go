package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"github.com/google/uuid"
	"github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
    ID        string `json:"id"`
    Nickname  string `json:"nickname"`
    Email     string `json:"email"`
    Password  string `json:"password"`
    FirstName string `json:"firstName"`
    LastName  string `json:"lastName"`
    Gender    string `json:"gender"`
    Age       int    `json:"age"`
}

// Response represents a standard API response
type Response struct {
    Message string `json:"message,omitempty"`
    Error   string `json:"error,omitempty"`
}

// LoginRequest represents the login payload
type LoginRequest struct {
    Identifier string `json:"identifier"` // Can be nickname or email
    Password   string `json:"password"`
}

// Session represents a user session
type Session struct {
    UserID string
}

// In-memory session store (for simplicity; consider persistent storage for production)
var sessions = map[string]Session{}

func main() {
    // Connect to the SQLite database
    db, err := sql.Open("sqlite3", "forum.db")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // Initialize the database tables from Forum.sql
    err = initializeDatabase(db, "Forum.sql")
    if err != nil {
        log.Fatal(err)
    }
    log.Println("Tables created successfully!")

    // Serve static files from the "static" directory
    fs := http.FileServer(http.Dir("./static"))
    http.Handle("/", fs)

    // API endpoints
    http.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
        handleRegister(w, r, db)
    })

    http.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
        handleLogin(w, r, db)
    })

    http.HandleFunc("/api/logout", handleLogout)

    http.HandleFunc("/api/check_session", func(w http.ResponseWriter, r *http.Request) {
        handleCheckSession(w, r)
    })

    // Start the server
    fmt.Println("Server is running on http://localhost:8080")
    err = http.ListenAndServe(":8080", nil)
    if err != nil {
        log.Fatal(err)
    }
}

// initializeDatabase reads SQL statements from a file and executes them
func initializeDatabase(db *sql.DB, filename string) error {
    // Read the SQL file
    sqlBytes, err := ioutil.ReadFile(filename)
    if err != nil {
        return fmt.Errorf("failed to read SQL file: %v", err)
    }

    // Execute the SQL statements
    _, err = db.Exec(string(sqlBytes))
    if err != nil {
        return fmt.Errorf("failed to execute SQL statements: %v", err)
    }

    return nil
}

// respondWithJSON is a helper function to send JSON responses
func respondWithJSON(w http.ResponseWriter, status int, payload Response) {
    response, err := json.Marshal(payload)
    if err != nil {
        http.Error(w, "Error processing response", http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    w.Write(response)
}

// handleRegister processes user registration
func handleRegister(w http.ResponseWriter, r *http.Request, db *sql.DB) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var user User
    err := json.NewDecoder(r.Body).Decode(&user)
    if err != nil {
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        log.Println("Error decoding JSON:", err)
        return
    }

    // Validate required fields
    if user.Nickname == "" || user.Email == "" || user.Password == "" {
        http.Error(w, "Nickname, Email, and Password are required", http.StatusBadRequest)
        log.Println("Validation failed: Missing required fields")
        return
    }

    // Hash the password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    if err != nil {
        http.Error(w, "Error hashing password", http.StatusInternalServerError)
        log.Println("Error hashing password:", err)
        return
    }

    // Generate a new UUID for the user
    userID := uuid.New().String()

    // Insert the new user into the database
    _, err = db.Exec(`INSERT INTO Users (id, nickname, email, password, first_name, last_name, gender, age) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        userID, user.Nickname, user.Email, string(hashedPassword), user.FirstName, user.LastName, user.Gender, user.Age)
    if err != nil {
        log.Println("Error inserting user into database:", err)

        // Check for unique constraint violations
        if sqliteErr, ok := err.(sqlite3.Error); ok {
            if sqliteErr.ExtendedCode == sqlite3.ErrConstraintUnique {
                respondWithJSON(w, http.StatusConflict, Response{Error: "Nickname or Email already exists"})
                return
            }
        }

        http.Error(w, "Database error", http.StatusInternalServerError)
        return
    }

    // Respond with success
    respondWithJSON(w, http.StatusCreated, Response{Message: "User registered successfully"})
}


// handleLogin processes user login
func handleLogin(w http.ResponseWriter, r *http.Request, db *sql.DB) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var loginReq LoginRequest
    err := json.NewDecoder(r.Body).Decode(&loginReq)
    if err != nil {
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    if loginReq.Identifier == "" || loginReq.Password == "" {
        http.Error(w, "Identifier and Password are required", http.StatusBadRequest)
        return
    }

    // Fetch user from the database
    var user User
    err = db.QueryRow(`SELECT id, password FROM Users WHERE nickname = ? OR email = ?`, loginReq.Identifier, loginReq.Identifier).
        Scan(&user.ID, &user.Password)
    if err != nil {
        if err == sql.ErrNoRows {
            respondWithJSON(w, http.StatusUnauthorized, Response{Error: "Invalid credentials"})
            return
        }
        http.Error(w, "Database error", http.StatusInternalServerError)
        return
    }

    // Compare the hashed password
    err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginReq.Password))
    if err != nil {
        respondWithJSON(w, http.StatusUnauthorized, Response{Error: "Invalid credentials"})
        return
    }

    // Create a session token
    sessionToken := uuid.New().String()
    sessions[sessionToken] = Session{UserID: user.ID}

    // Set the session token as a cookie
    http.SetCookie(w, &http.Cookie{
        Name:     "session_token",
        Value:    sessionToken,
        Path:     "/",
        HttpOnly: true,
        // Secure:   true, // Uncomment when using HTTPS
    })

    // Respond with success
    respondWithJSON(w, http.StatusOK, Response{Message: "Login successful"})
}

// handleLogout processes user logout
func handleLogout(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    // Retrieve the session token from the cookie
    cookie, err := r.Cookie("session_token")
    if err != nil {
        http.Error(w, "No active session", http.StatusUnauthorized)
        return
    }

    // Delete the session from the session store
    delete(sessions, cookie.Value)

    // Remove the cookie
    http.SetCookie(w, &http.Cookie{
        Name:   "session_token",
        Value:  "",
        Path:   "/",
        MaxAge: -1,
    })

    // Respond with success
    respondWithJSON(w, http.StatusOK, Response{Message: "Logout successful"})
}

// handleCheckSession verifies if a user session is active
func handleCheckSession(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    // Retrieve the session token from the cookie
    cookie, err := r.Cookie("session_token")
    if err != nil {
        http.Error(w, "No active session", http.StatusUnauthorized)
        return
    }

    // Check if the session token exists
    _, exists := sessions[cookie.Value]
    if !exists {
        http.Error(w, "Invalid session", http.StatusUnauthorized)
        return
    }

    // If session exists, respond with success
    respondWithJSON(w, http.StatusOK, Response{Message: "Session active"})
}
