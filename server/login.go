// server/login.go

package server

import (
    "database/sql"
    "errors"
    "talknet/Database"
    "talknet/structs"
    "regexp"

    "golang.org/x/crypto/bcrypt"
)

// isValidEmail checks if the email has a valid format.
func isValidEmail(email string) bool {
    // Simple regex for email validation
    re := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
    return re.MatchString(email)
}

func LoginUser(db *sql.DB, identifier, password string) (structs.User, error) {
    // Input Validation
    if len(identifier) > 30 {
        return structs.User{}, errors.New("Username or Email cannot exceed 30 characters.")
    }

    if len(password) > 20 {
        return structs.User{}, errors.New("Password cannot exceed 20 characters.")
    }

    var user structs.User
    // Try to get user by username
    user, err := Database.GetUserByUsername(db, identifier)
    if err != nil {
        // If not found, try to get user by email
        user, err = Database.GetUserByEmail(db, identifier)
        if err != nil {
            return user, errors.New("Invalid Username or Password.")
        }
    }

    // Compare password
    err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
    if err != nil {
        return user, errors.New("Invalid Username or Password.")
    }

    return user, nil
}
