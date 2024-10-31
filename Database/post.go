package Database

import (
	"database/sql"
	"talknet/structs"
	"time"
)

// CreatePost inserts a new post into the database.
func CreatePost(db *sql.DB, userID int, title, content string) error {
	_, err := db.Exec("INSERT INTO posts (user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		userID, title, content, time.Now(), time.Now())
	return err
}

// GetPostByID retrieves a post by its ID.
func GetPostByID(db *sql.DB, id int) (structs.Post, error) {
	row := db.QueryRow("SELECT id, user_id, title, content, created_at FROM posts WHERE id = ?", id)
	var post structs.Post
	err := row.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt)
	if err != nil {
		return post, err
	}
	return post, nil
}

func GetAllPosts(db *sql.DB) ([]structs.Post, error) {
	rows, err := db.Query("SELECT id, user_id, title, content, created_at FROM posts")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []structs.Post
	for rows.Next() {
		var post structs.Post
		err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

// Other post-related functions (e.g., UpdatePost, DeletePost) go here.
func GetPostsByCategory(db *sql.DB, category string) ([]structs.Post, error) {
	rows, err := db.Query(`
        SELECT p.id, p.user_id, p.title, p.content, p.created_at
        FROM posts p
        JOIN post_categories pc ON p.id = pc.post_id
        JOIN categories c ON pc.category_id = c.id
        WHERE c.name = ?`, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []structs.Post
	for rows.Next() {
		var post structs.Post
		err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	return posts, nil
}

func GetPostByUserID(db *sql.DB,user_id int) ([]structs.Post, error) {
	rows, err := db.Query("SELECT id, user_id, title, content, created_at FROM posts WHERE user_id = ?",user_id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []structs.Post
	for rows.Next() {
		var post structs.Post
		err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}



func GetLikedPosts(db *sql.DB, userID int) ([]structs.Post, error) {
	rows, err := db.Query(`
			SELECT p.id, p.user_id, p.title, p.content, p.created_at, p.updated_at
			FROM posts p
			INNER JOIN likes_dislikes ld ON p.id = ld.post_id
			WHERE ld.user_id = ? AND ld.like_dislike = 1`, userID)
	if err != nil {
			return nil, err
	}
	defer rows.Close()

	var posts []structs.Post
	for rows.Next() {
			var post structs.Post
			err := rows.Scan(
					&post.ID,
					&post.UserID,
					&post.Title,
					&post.Content,
					&post.CreatedAt,
					&post.UpdatedAt,
			)
			if err != nil {
					return nil, err
			}
			posts = append(posts, post)
	}
	return posts, nil
}
