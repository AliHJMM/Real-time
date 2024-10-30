// server/registerUser.go

package server

import (
    "database/sql"
    "errors"
    "regexp"
    "strings"
    "talknet/Database"

    "golang.org/x/crypto/bcrypt"
)

// ValidateUsername checks if the username is valid (non-empty, no spaces only, and no special characters).
func ValidateUsername(username string) error {
    // Check if the username is empty or contains only spaces
    if strings.TrimSpace(username) == "" {
        return errors.New("Nickname cannot be empty or contain only spaces.")
    }

    // Check if the username contains only alphanumeric characters (no special characters)
    validUsername := regexp.MustCompile(`^[a-zA-Z0-9]+$`)
    if !validUsername.MatchString(username) {
        return errors.New("Nickname can only contain alphanumeric characters.")
    }

    return nil
}

// ValidatePassword checks if the password is at least 8 characters long, 
// contains at least one uppercase letter, one special character, and one number.
func ValidatePassword(password string) error {
    if len(password) < 8 {
        return errors.New("Password must be at least 8 characters long.")
    }

    // Check for at least one uppercase letter
    hasUppercase := regexp.MustCompile(`[A-Z]`).MatchString(password)
    if !hasUppercase {
        return errors.New("Password must contain at least one uppercase letter.")
    }

    // Check for at least one number
    hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
    if !hasNumber {
        return errors.New("Password must contain at least one number.")
    }

    // Check for at least one special character
    hasSpecialChar := regexp.MustCompile(`[!@#~$%^&*(),.?":{}|<>]`).MatchString(password)
    if !hasSpecialChar {
        return errors.New("Password must contain at least one special character.")
    }

    return nil
}



// RegisterUser registers a new user with validated inputs.
func RegisterUser(db *sql.DB, username, email, password, firstName, lastName string, age int, gender string) error {
    // Validate Nickname (Username)
    if len(username) > 20 {
        return errors.New("Nickname cannot exceed 20 characters.")
    }
    if err := ValidateUsername(username); err != nil {
        return err
    }

    // Validate Email
    if len(email) > 30 {
        return errors.New("Email cannot exceed 30 characters.")
    }
    if !isValidEmail(email) {
        return errors.New("Please enter a valid email address.")
    }

    // Validate Password
    if len(password) > 20 {
        return errors.New("Password cannot exceed 20 characters.")
    }
    if err := ValidatePassword(password); err != nil {
        return err
    }

    // Validate First Name
    if len(firstName) > 20 {
        return errors.New("First Name cannot exceed 20 characters.")
    }
    if strings.TrimSpace(firstName) == "" {
        return errors.New("First Name cannot be empty.")
    }

    // Validate Last Name
    if len(lastName) > 20 {
        return errors.New("Last Name cannot exceed 20 characters.")
    }
    if strings.TrimSpace(lastName) == "" {
        return errors.New("Last Name cannot be empty.")
    }

    // Validate Age
    if age <= 0 || age > 999 {
        return errors.New("Age must be a positive number up to 999.")
    }

    // Validate Gender
    if gender != "Male" && gender != "Female" {
        return errors.New("Gender must be either Male or Female.")
    }

    // Hash the password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return errors.New("Failed to hash password.")
    }

    // Proceed to create the user
    err = Database.CreateUser(db, username, email, string(hashedPassword), firstName, lastName, age, gender)
    if err != nil {
        // Check for unique constraint violations
        if strings.Contains(err.Error(), "UNIQUE constraint failed") {
            if strings.Contains(err.Error(), "users.email") {
                return errors.New("Email is already in use.")
            }
            if strings.Contains(err.Error(), "users.username") {
                return errors.New("Nickname is already taken.")
            }
        }
        return errors.New("Failed to register user. Please try again.")
    }

    return nil
}
