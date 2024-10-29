// main.go

package main

import (
    "database/sql"
    "fmt"
    "io/ioutil"
    "log"
    "net/http"
    "os"
    "talknet/server/handlers"
    "talknet/server/sessions"

    _ "github.com/mattn/go-sqlite3" // SQLite driver
)

func main() {
    // Open a connection to the database
    dbPath := "./talknet.db"       // Path to your SQLite database file
    sqlFilePath := "./talknet.sql" // Path to your SQL file

    var database *sql.DB

    // Check if the database file exists
    if _, err := os.Stat(dbPath); os.IsNotExist(err) {

        // Create a new database
        db, err := sql.Open("sqlite3", dbPath)
        if err != nil {
            log.Fatal(err)
        }
        database = db

        // Read the SQL file
        sqlData, err := ioutil.ReadFile(sqlFilePath)
        if err != nil {
            log.Fatalf("Error reading SQL file: %v", err)
        }

        // Execute the SQL commands from the file
        _, err = database.Exec(string(sqlData))
        if err != nil {
            log.Fatalf("Error executing SQL commands: %v", err)
        }

    } else if err != nil {
        log.Fatalf("Error checking database file: %v", err)
    } else {
        db, err := sql.Open("sqlite3", dbPath)
        if err != nil {
            log.Fatal(err)
        }
        database = db
    }

    // Ensure database is closed when main function exits
    defer database.Close()

    // Initialize the session management
    sessions.InitSessionManagement()

    // Initialize the database instance in the WebSocket handler
    handlers.InitDB(database)

    // Start the WebSocket hub
    go handlers.HubInstance.Run()

    // Setup static file server
    http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

    // API endpoints
    http.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
        handlers.LoginAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
        handlers.RegisterAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/posts", func(w http.ResponseWriter, r *http.Request) {
        handlers.PostsAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/post", func(w http.ResponseWriter, r *http.Request) {
        handlers.PostAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/add_comment", func(w http.ResponseWriter, r *http.Request) {
        handlers.AddCommentAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
        handlers.ProfileAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/logout", func(w http.ResponseWriter, r *http.Request) {
        handlers.LogoutAPIHandler(w, r)
    })
    http.HandleFunc("/api/like_dislike", func(w http.ResponseWriter, r *http.Request) {
        handlers.LikeDislikeAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/categories", func(w http.ResponseWriter, r *http.Request) {
        handlers.CategoriesAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/online_users", func(w http.ResponseWriter, r *http.Request) {
        handlers.OnlineUsersAPIHandler(database, w, r)
    })
    http.HandleFunc("/api/chat_history", func(w http.ResponseWriter, r *http.Request) {
        handlers.ChatHistoryHandler(database, w, r)
    })

    // Add WebSocket endpoint
    http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        handlers.ServeWs(w, r)
    })

    // Serve index.html for any non-API route
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        http.ServeFile(w, r, "static/pages/index.html")
    })

    // Start the server
    fmt.Println("Server running at http://localhost:8080")
    err := http.ListenAndServe(":8080", nil)
    if err != nil {
        log.Fatal(err)
    }
}
