package server

import (
	"database/sql"
	"talknet/Database"
	"talknet/structs"
	"golang.org/x/crypto/bcrypt"
)

func LoginUser(db *sql.DB, identifier, password string) (structs.User, error) {
    var user structs.User
    // Try to get user by username
    user, err := Database.GetUserByUsername(db, identifier)
    if err != nil {
        // If not found, try to get user by email
        user, err = Database.GetUserByEmail(db, identifier)
        if err != nil {
            return user, err
        }
    }

    // Compare password
    err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
    if err != nil {
        return user, err
    }

    return user, nil
}

