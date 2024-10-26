package Database

import (
    "database/sql"
    "talknet/structs"
)

func SaveMessage(db *sql.DB, message structs.Message) error {
    _, err := db.Exec("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
        message.SenderID, message.ReceiverID, message.Content)
    return err
}

func GetMessages(db *sql.DB, userID int, otherUserID int, limit int, offset int) ([]structs.Message, error) {
    rows, err := db.Query(`
        SELECT id, sender_id, receiver_id, content, created_at
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        userID, otherUserID, otherUserID, userID, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var messages []structs.Message
    for rows.Next() {
        var message structs.Message
        err := rows.Scan(&message.ID, &message.SenderID, &message.ReceiverID, &message.Content, &message.CreatedAt)
        if err != nil {
            return nil, err
        }
        messages = append(messages, message)
    }
    return messages, nil
}
