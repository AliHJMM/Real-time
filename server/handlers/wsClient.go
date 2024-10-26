package handlers

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
    "talknet/Database"
    "talknet/server/sessions"
    "talknet/structs"

    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true // Adjust this in production
    },
}

type Client struct {
    conn   *websocket.Conn
    send   chan structs.Message
    userID int
}

var db *sql.DB

func InitDB(database *sql.DB) {
    db = database
}

// ServeWs handles WebSocket requests from the peer.
func ServeWs(w http.ResponseWriter, r *http.Request) {
    // Get the user ID from the session
    userID, isLoggedIn := sessions.GetSessionUserID(r)
    if !isLoggedIn {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("Upgrade error:", err)
        return
    }

    client := &Client{
        conn:   conn,
        send:   make(chan structs.Message),
        userID: userID,
    }

    HubInstance.register <- client

    go client.readPump()
    go client.writePump()
}

func (c *Client) readPump() {
    defer func() {
        HubInstance.unregister <- c
        c.conn.Close()
    }()

    for {
        _, messageData, err := c.conn.ReadMessage()
        if err != nil {
            log.Println("Read error:", err)
            break
        }
        var message structs.Message
        err = json.Unmarshal(messageData, &message)
        if err != nil {
            log.Println("Unmarshal error:", err)
            continue
        }
        // Set the sender ID
        message.SenderID = c.userID

        // Save message to the database
        err = SaveMessageToDB(message)
        if err != nil {
            log.Println("Failed to save message:", err)
            continue
        }

        // Broadcast the message to the receiver
        HubInstance.broadcast <- message
    }
}

func (c *Client) writePump() {
    defer c.conn.Close()
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
            err = c.conn.WriteMessage(websocket.TextMessage, messageData)
            if err != nil {
                log.Println("Write error:", err)
                return
            }
        }
    }
}

func SaveMessageToDB(message structs.Message) error {
    return Database.SaveMessage(db, message)
}
