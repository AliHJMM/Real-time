package handlers

import (
    "sync"
    "talknet/structs"
)

type Hub struct {
    clients    map[int]*Client
    broadcast  chan structs.Message
    register   chan *Client
    unregister chan *Client
    mutex      sync.Mutex
}

var HubInstance = Hub{
    clients:    make(map[int]*Client),
    broadcast:  make(chan structs.Message),
    register:   make(chan *Client),
    unregister: make(chan *Client),
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mutex.Lock()
            h.clients[client.userID] = client
            h.mutex.Unlock()
        case client := <-h.unregister:
            h.mutex.Lock()
            if _, ok := h.clients[client.userID]; ok {
                delete(h.clients, client.userID)
                close(client.send)
            }
            h.mutex.Unlock()
        case message := <-h.broadcast:
            h.mutex.Lock()
            // Send to receiver
            if receiver, ok := h.clients[message.ReceiverID]; ok {
                select {
                case receiver.send <- message:
                default:
                    close(receiver.send)
                    delete(h.clients, receiver.userID)
                }
            }
            // Send to sender
            if sender, ok := h.clients[message.SenderID]; ok {
                select {
                case sender.send <- message:
                default:
                    close(sender.send)
                    delete(h.clients, sender.userID)
                }
            }
            h.mutex.Unlock()
        }
    }
}
