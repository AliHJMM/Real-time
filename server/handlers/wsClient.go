package handlers

import (
    "database/sql"
    "encoding/json"
    "errors"
    "log"
    "net/http"
    "time"
    "talknet/server/sessions"
    "talknet/structs"

    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

type Client struct {
    conn   *websocket.Conn
    send   chan structs.Message
    userID int
}

var db *sql.DB

// InitDB initializes the database instance for the WebSocket handlers
func InitDB(database *sql.DB) {
    db = database
}

// ServeWs handles WebSocket requests from the peer.
func ServeWs(w http.ResponseWriter, r *http.Request) {
    // Authenticate the user
    userID, isLoggedIn := sessions.GetSessionUserID(r)
    if !isLoggedIn {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Upgrade the HTTP connection to a WebSocket
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("WebSocket Upgrade error:", err)
        return
    }

    // Create a new client
    client := &Client{
        conn:   conn,
        send:   make(chan structs.Message),
        userID: userID,
    }

    // Register the client with the hub
    HubInstance.register <- client

    // Start the read and write pumps
    go client.readPump()
    go client.writePump()
}

// readPump pumps messages from the WebSocket connection to the hub.
func (c *Client) readPump() {
    defer func() {
        HubInstance.unregister <- c
        c.conn.Close()
    }()

    for {
        // Read message from WebSocket
        _, messageData, err := c.conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Printf("Unexpected close error: %v", err)
            }
            break
        }

        var message structs.Message
        err = json.Unmarshal(messageData, &message)
        if err != nil {
            log.Println("Unmarshal error:", err)
            // Optionally, send an error message back to the client
            systemMessage := structs.Message{
                SenderID:   0, // System message
                ReceiverID: c.userID,
                Content:    "Invalid message format.",
                CreatedAt:  time.Now(),
            }
            c.send <- systemMessage
            continue
        }

        // Set the sender ID to the current client
        message.SenderID = c.userID

        // Validate message length
        if len(message.Content) > 50 {
            systemMessage := structs.Message{
                SenderID:   0, // System message
                ReceiverID: c.userID,
                Content:    "Cannot send message. The content exceeds 50 characters.",
                CreatedAt:  time.Now(),
            }
            c.send <- systemMessage
            continue
        }

        // Check if the recipient is online
        if !IsUserOnline(message.ReceiverID) {
            // Send a system message back to the sender indicating the recipient is offline
            systemMessage := structs.Message{
                SenderID:   0, // System message
                ReceiverID: c.userID,
                Content:    "Cannot send message. The user is offline.",
                CreatedAt:  time.Now(),
            }
            c.send <- systemMessage
            continue
        }

        // Save message to the database
        err = SaveMessageToDB(&message)
        if err != nil {
            log.Println("Failed to save message:", err)
            // Optionally, notify the sender about the failure
            systemMessage := structs.Message{
                SenderID:   0, // System message
                ReceiverID: c.userID,
                Content:    "Failed to send your message. Please try again.",
                CreatedAt:  time.Now(),
            }
            c.send <- systemMessage
            continue
        }

        // Broadcast the message to both sender and receiver
        HubInstance.broadcast <- message
    }
}

// writePump pumps messages from the hub to the WebSocket connection.
func (c *Client) writePump() {
    defer func() {
        c.conn.Close()
        HubInstance.unregister <- c // Ensure client is unregistered on writePump exit
    }()

    for {
        select {
        case message, ok := <-c.send:
            if !ok {
                // The hub closed the channel
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }

            messageData, err := json.Marshal(message)
            if err != nil {
                log.Println("Marshal error:", err)
                continue
            }

            // Write message to WebSocket
            err = c.conn.WriteMessage(websocket.TextMessage, messageData)
            if err != nil {
                log.Println("Write error:", err)
                return
            }
        }
    }
}

// SaveMessageToDB saves a message to the database and updates the message struct with the ID and timestamp.
func SaveMessageToDB(message *structs.Message) error {
    if len(message.Content) > 50 {
        return errors.New("Message cannot exceed 50 characters.")
    }

    result, err := db.Exec("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
        message.SenderID, message.ReceiverID, message.Content)
    if err != nil {
        return err
    }

    // Get the inserted message ID
    messageID, err := result.LastInsertId()
    if err != nil {
        return err
    }
    message.ID = int(messageID)

    // Fetch the CreatedAt timestamp as Unix timestamp
    var createdAtUnix int64
    err = db.QueryRow("SELECT strftime('%s', created_at) FROM messages WHERE id = ?", messageID).Scan(&createdAtUnix)
    if err != nil {
        return err
    }

    // Set the CreatedAt field
    message.CreatedAt = time.Unix(createdAtUnix, 0)

    log.Printf("Message saved with ID: %d CreatedAt: %s", message.ID, message.CreatedAt.Format(time.RFC3339))

    return nil
}

// IsUserOnline checks if a user is online.
func IsUserOnline(userID int) bool {
    sessions.Mutex.Lock()
    defer sessions.Mutex.Unlock()
    _, isOnline := sessions.OnlineUsers[userID]
    return isOnline
}
