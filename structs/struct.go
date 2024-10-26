package structs

import "time"

type ErrorData struct {
	ErrorMessage string
	Code         string
}

// User represents a user in the forum.
type User struct {
	ID        int       `json:"id"`
	Username string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"password"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Age       int       `json:"age"`
	Gender    string    `json:"gender"`
	CreatedAt time.Time `json:"created_at"`
	Online    bool      `json:"online"` // Added this line
}

// Post represents a forum post.
type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Comment represents a comment on a forum post.
type Comment struct {
	ID        int       `json:"id"`
	PostID    int       `json:"post_id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Like represents a like on a post or comment.
type Like struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	PostID    *int      `json:"post_id,omitempty"`    // Nullable for likes on comments
	CommentID *int      `json:"comment_id,omitempty"` // Nullable for likes on posts
	CreatedAt time.Time `json:"created_at"`
}
type Dislike struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	PostID    *int      `json:"post_id,omitempty"`    // Nullable for likes on comments
	CommentID *int      `json:"comment_id,omitempty"` // Nullable for likes on posts
	CreatedAt time.Time `json:"created_at"`
}


// Category represents a category for posts.
type Category struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}


type PostData struct {
	ID             int                `json:"id"`
	Username       string             `json:"username"`
	Title          string             `json:"title"`
	Content        string             `json:"content"`
	CreatedAt      string             `json:"createdAt"`
	PostCategories []Category `json:"postCategories"`
	LikeCount      int                `json:"likeCount"`
	DislikeCount   int                `json:"dislikeCount"`
	CommentCount   int                `json:"commentCount"`
	Reaction       int                `json:"reaction"`
}
