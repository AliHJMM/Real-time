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
		return errors.New("username cannot be empty or contain only spaces")
	}

	// Check if the username contains only alphanumeric characters (no special characters)
	validUsername := regexp.MustCompile(`^[a-zA-Z0-9]+$`)
	if !validUsername.MatchString(username) {
		return errors.New("username can only contain alphanumeric characters")
	}

	return nil
}

// ValidatePassword checks if the password is at least 8 characters long, 
// contains at least one uppercase letter, one special character, and one number.
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	// Check for at least one uppercase letter
	hasUppercase := regexp.MustCompile(`[A-Z]`).MatchString(password)
	if !hasUppercase {
		return errors.New("password must contain at least one uppercase letter")
	}

	// Check for at least one number
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	if !hasNumber {
		return errors.New("password must contain at least one number")
	}

	// Check for at least one special character
	hasSpecialChar := regexp.MustCompile(`[!@#~$%^&*(),.?":{}|<>]`).MatchString(password)
	if !hasSpecialChar {
		return errors.New("password must contain at least one special character")
	}

	return nil
}

func RegisterUser(db *sql.DB, username, email, password, firstName, lastName string, age int, gender string) error {
	// Existing validation...
	if err := ValidateUsername(username); err != nil {
		return err
}
if err := ValidatePassword(password); err != nil {
	return err
}
	// Additional validation for new fields
	if firstName == "" || lastName == "" {
			return errors.New("first Name and Last Name cannot be empty")
	}
	if age <= 0 {
			return errors.New("age must be a positive number")
	}
	if gender == "" {
			return errors.New("gender cannot be empty")
	}
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}
	// Proceed to create the user
	return Database.CreateUser(db, username, email, string(hashedPassword), firstName, lastName, age, gender)
}


