package Database

import (
	"database/sql"
	"talknet/structs"
	"time"
)

// GetChatHistory retrieves chat messages between two users with pagination.
func GetChatHistory(db *sql.DB, user1ID, user2ID, limit, offset int) ([]structs.Message, error) {
	query := `
        SELECT id, sender_id, receiver_id, content, created_at
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
    `
	rows, err := db.Query(query, user1ID, user2ID, user2ID, user1ID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []structs.Message
	for rows.Next() {
		var msg structs.Message
		var createdAtStr string
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &createdAtStr); err != nil {
			return nil, err
		}
		// Parse the created_at string into time.Time
		msg.CreatedAt, err = time.Parse("2006-01-02T15:04:05Z", createdAtStr)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return messages, nil
}
