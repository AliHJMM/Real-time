package handlers

import (
    "sync"
    "talknet/structs"
)

type Hub struct {
    clients    map[int]map[*Client]bool // Changed to map of clients per user ID
    broadcast  chan structs.Message
    register   chan *Client
    unregister chan *Client
    mutex      sync.Mutex
}

var HubInstance = Hub{
    clients:    make(map[int]map[*Client]bool),
    broadcast:  make(chan structs.Message),
    register:   make(chan *Client),
    unregister: make(chan *Client),
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mutex.Lock()
            // Initialize the map for the user ID if it doesn't exist
            if _, ok := h.clients[client.userID]; !ok {
                h.clients[client.userID] = make(map[*Client]bool)
            }
            // Add the client to the user's connections
            h.clients[client.userID][client] = true
            h.mutex.Unlock()

        case client := <-h.unregister:
            h.mutex.Lock()
            if clients, ok := h.clients[client.userID]; ok {
                if _, ok := clients[client]; ok {
                    delete(clients, client)
                    close(client.send)
                    // Remove the user ID map if no clients remain
                    if len(clients) == 0 {
                        delete(h.clients, client.userID)
                    }
                }
            }
            h.mutex.Unlock()

        case message := <-h.broadcast:
            h.mutex.Lock()
            // Send to all connections of the receiver
            if clients, ok := h.clients[message.ReceiverID]; ok {
                for client := range clients {
                    select {
                    case client.send <- message:
                    default:
                        close(client.send)
                        delete(clients, client)
                    }
                }
                // Clean up if no clients remain
                if len(clients) == 0 {
                    delete(h.clients, message.ReceiverID)
                }
            }
            // Send to all connections of the sender
            if clients, ok := h.clients[message.SenderID]; ok {
                for client := range clients {
                    select {
                    case client.send <- message:
                    default:
                        close(client.send)
                        delete(clients, client)
                    }
                }
                // Clean up if no clients remain
                if len(clients) == 0 {
                    delete(h.clients, message.SenderID)
                }
            }
            h.mutex.Unlock()
        }
    }
}
