package Database

import (
	"database/sql"
	"fmt"
	"talknet/structs"
)

// CreateUser inserts a new user into the database.
func CreateUser(db *sql.DB, username, email, password, firstName, lastName string, age int, gender string) error {
    query := `
        INSERT INTO users (username, email, password, first_name, last_name, age, gender)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    _, err := db.Exec(query, username, email, password, firstName, lastName, age, gender)
    if err != nil {
        fmt.Println("Error inserting user:", err)
        return err
    }
    return nil
}

// GetUserByUsername retrieves a user by username.

// GetUserByUsername retrieves a user by their username.
func GetUserByUsername(db *sql.DB, username string) (structs.User, error) {
    var user structs.User
    query := `
        SELECT id, username, email, password, first_name, last_name, age, gender, created_at
        FROM users
        WHERE username = ?
    `
    row := db.QueryRow(query, username)
    err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.FirstName, &user.LastName, &user.Age, &user.Gender, &user.CreatedAt)
    if err != nil {
        return user, err
    }
    return user, nil
}

// function to validate username
func IsValidUsername(db *sql.DB, username string) bool {
	row := db.QueryRow("SELECT username FROM users WHERE username = ?", username)
	var user structs.User
	err := row.Scan(&user.Username)
	if err == sql.ErrNoRows {
		return true
	} else if err != nil {
		return false
	}
	return false
}

func GetUserByID(db *sql.DB, id int) (structs.User, error) {
	row := db.QueryRow("SELECT id, username, email, password, created_at FROM users WHERE id = ?", id)
	var user structs.User
	err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt)
	if err != nil {
		return structs.User{}, err
	}
	return user, nil
}


func GetUserIdByPostID(db *sql.DB, id int) (int, error) {
	var userID int
	err := db.QueryRow("SELECT user_id FROM posts WHERE id = ?", id).Scan(&userID)
	if err != nil {
		return 0, err
	}
	return userID, nil
}


func GetUsername(db *sql.DB, id int) (string, error) {
	var username string
	err := db.QueryRow("SELECT username FROM users WHERE id = ?", id).Scan(&username)
	if err != nil {
		return "", err
	}
	return username, nil
}

func GetUserByEmail(db *sql.DB, email string) (structs.User, error) {
    var user structs.User
    query := `
        SELECT id, username, email, password, first_name, last_name, age, gender, created_at
        FROM users
        WHERE email = ?
    `
    row := db.QueryRow(query, email)
    err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.FirstName, &user.LastName, &user.Age, &user.Gender, &user.CreatedAt)
    if err != nil {
        return user, err
    }
    return user, nil
}

// GetAllUsers retrieves all users from the database.
func GetAllUsers(db *sql.DB) ([]structs.User, error) {
    rows, err := db.Query("SELECT id, username, email, first_name, last_name, age, gender, created_at FROM users")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []structs.User
    for rows.Next() {
        var user structs.User
        err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.FirstName, &user.LastName, &user.Age, &user.Gender, &user.CreatedAt)
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    return users, nil
}

// Database/user.go

func GetLastMessageTime(db *sql.DB, userID int, otherUserID int) (int64, error) {
    var lastMessageTime sql.NullInt64
    err := db.QueryRow(`
        SELECT MAX(strftime('%s', created_at))
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
        userID, otherUserID, otherUserID, userID).Scan(&lastMessageTime)
    if err != nil && err != sql.ErrNoRows {
        return 0, err
    }
    if lastMessageTime.Valid {
        return lastMessageTime.Int64, nil
    }
    return 0, nil // No messages exist between users
}
