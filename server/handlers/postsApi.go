package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"talknet/Database"
	"talknet/server/sessions"
	"talknet/structs"
	"time"
)

func PostsAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {

	switch r.Method {
	case http.MethodGet:
		// Fetch posts
		userSessionID, isLoggedIn := sessions.GetSessionUserID(r)

		// Fetch categories
		allCategories, err := Database.GetAllCategories(db)
		if err != nil {
			log.Printf("Failed to get all categories: %v", err)
			http.Error(w, "Failed to load categories", http.StatusInternalServerError)
			return
		}

		// Fetch posts based on selected category
		category := r.URL.Query().Get("category")
		var posts []structs.Post

		if category != "" && category != "All" {
			posts, err = Database.GetPostsByCategory(db, category)
			if err != nil {
				log.Printf("Failed to get posts by category: %v", err)
				http.Error(w, "Failed to load posts", http.StatusInternalServerError)
				return
			}
		} else {
			posts, err = Database.GetAllPosts(db)
			if err != nil {
				log.Printf("Failed to get all posts: %v", err)
				http.Error(w, "Failed to load posts", http.StatusInternalServerError)
				return
			}
		}

		// Prepare post data
		var postDataList []structs.PostData

		for _, post := range posts {
			user, err := Database.GetUserByID(db, post.UserID)
			if err != nil {
				log.Printf("Failed to get user: %v", err)
				continue
			}

			postCategories, err := Database.GetCategoryNamesByPostID(db, post.ID)
			if err != nil {
				log.Printf("Failed to get categories: %v", err)
				continue
			}

			likes, dislikes, err := Database.GetReactionsByPostID(db, post.ID)
			if err != nil {
				log.Printf("Failed to get likes: %v", err)
				continue
			}
			likeCount := len(likes)
			dislikeCount := len(dislikes)
			comments, err := Database.GetCommentsByPostID(db, post.ID)
			if err != nil {
				log.Printf("Failed to get comments: %v", err)
				continue
			}
			reaction := -1
			if isLoggedIn {
				reaction, err = Database.CheckReactionExists(db, post.ID, userSessionID, "post")
				if err != nil {
					log.Printf("Failed to check reaction: %v", err)
					continue
				}
			}

			postDataList = append(postDataList, structs.PostData{
				ID:             post.ID,
				Username:       user.Username,
				Title:          post.Title,
				Content:        post.Content,
				CreatedAt:      post.CreatedAt.Format(time.RFC3339),
				PostCategories: postCategories,
				LikeCount:      likeCount,
				DislikeCount:   dislikeCount,
				CommentCount:   len(comments),
				Reaction:       reaction,
			})
		}

		// Reverse the order of posts
		postDataList = reversePosts(postDataList)

		// Send the data as JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(struct {
			IsLoggedIn    bool               `json:"isLoggedIn"`
			AllCategories []structs.Category `json:"allCategories"`
			Posts         []structs.PostData         `json:"posts"`
		}{
			IsLoggedIn:    isLoggedIn,
			AllCategories: allCategories,
			Posts:         postDataList,
		})

	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}


func PostAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		// Get post details
		postIDStr := r.URL.Query().Get("post_id")
		postID, err := strconv.Atoi(postIDStr)
		if err != nil {
			http.Error(w, "Invalid post ID", http.StatusBadRequest)
			return
		}

		// Fetch the post by ID
		post, err := Database.GetPostByID(db, postID)
		if err != nil {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		// Fetch the user who created the post
		user, err := Database.GetUserByID(db, post.UserID)
		if err != nil {
			http.Error(w, "User not found", http.StatusInternalServerError)
			return
		}

		// Fetch comments for the post
		comments, err := Database.GetCommentsByPostID(db, postID)
		if err != nil {
			log.Printf("Failed to get comments: %v", err)
			http.Error(w, "Failed to load comments", http.StatusInternalServerError)
			return
		}

		// Prepare comments with usernames
		var commentsWithUser []struct {
			structs.Comment
			Username     string `json:"username"`
			CreatedAt    string `json:"createdAt"`
			LikeCount    int    `json:"likeCount"`
			DislikeCount int    `json:"dislikeCount"`
			Reaction     int    `json:"reaction"`
		}
		userSessionID, isLoggedIn := sessions.GetSessionUserID(r)
		for _, comment := range comments {
			commentUser, err := Database.GetUserByID(db, comment.UserID)
			if err != nil {
				log.Printf("Failed to get user for comment: %v", err)
				continue
			}

			likes, dislikes, err := Database.GetReactionsByCommentID(db, comment.ID)
			if err != nil {
				log.Printf("Failed to get likes: %v", err)
				continue
			}
			likeCount := len(likes)
			dislikeCount := len(dislikes)

			reaction := -1
			if isLoggedIn {
				reaction, err = Database.CheckReactionExists(db, comment.ID, userSessionID, "comment")
				if err != nil {
					log.Printf("Failed to check reaction: %v", err)
					continue
				}
			}

			commentsWithUser = append(commentsWithUser, struct {
				structs.Comment
				Username     string `json:"username"`
				CreatedAt    string `json:"createdAt"`
				LikeCount    int    `json:"likeCount"`
				DislikeCount int    `json:"dislikeCount"`
				Reaction     int    `json:"reaction"`
			}{
				Comment:      comment,
				Username:     commentUser.Username,
				CreatedAt:    comment.CreatedAt.Format(time.RFC3339),
				LikeCount:    likeCount,
				DislikeCount: dislikeCount,
				Reaction:     reaction,
			})
		}

		// Send the data as JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(struct {
			Post     structs.Post `json:"post"`
			Username string       `json:"username"`
			Comments interface{}  `json:"comments"`
		}{
			Post:     post,
			Username: user.Username,
			Comments: commentsWithUser,
		})

	case http.MethodPost:
		// Create new post
		userID, isLoggedIn := sessions.GetSessionUserID(r)
		if !isLoggedIn {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var postData struct {
			Title      string   `json:"title"`
			Content    string   `json:"content"`
			Categories []string `json:"categories"`
		}
		err := json.NewDecoder(r.Body).Decode(&postData)
		if err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		// Validate input
		if postData.Title == "" || postData.Content == "" || len(postData.Categories) == 0 {
			http.Error(w, "All fields must be filled and at least one category selected", http.StatusBadRequest)
			return
		}

		if len(postData.Title) > 50 {
			http.Error(w, "Title cannot be more than 50 characters", http.StatusBadRequest)
			return
		}

		if len(postData.Content) > 500 {
			http.Error(w, "Content cannot be more than 500 characters", http.StatusBadRequest)
			return
		}

		transaction, err := db.Begin()
		if err != nil {
			http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
			return
		}

		// Insert into Posts table
		res, err := transaction.Exec("INSERT INTO Posts (user_id, title, content) VALUES (?, ?, ?)", userID, postData.Title, postData.Content)
		if err != nil {
			transaction.Rollback()
			http.Error(w, "Failed to insert post", http.StatusInternalServerError)
			return
		}

		// Get the last inserted post ID
		postID, err := res.LastInsertId()
		if err != nil {
			transaction.Rollback()
			http.Error(w, "Failed to get post ID", http.StatusInternalServerError)
			return
		}

		// Insert each selected category into Post_Categories
		for _, categoryIDStr := range postData.Categories {
			categoryID, err := strconv.Atoi(categoryIDStr)
			if err != nil {
				http.Error(w, "Invalid category ID", http.StatusBadRequest)
				return
			}

			_, err = transaction.Exec("INSERT INTO Post_Categories (post_id, category_id) VALUES (?, ?)", postID, categoryID)
			if err != nil {
				transaction.Rollback()
				http.Error(w, "Failed to insert post categories", http.StatusInternalServerError)
				return
			}
		}

		// Commit the transaction
		if err := transaction.Commit(); err != nil {
			http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
			return
		}

		// Successfully inserted post and categories
		w.WriteHeader(http.StatusCreated)

	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

func reversePosts(posts []structs.PostData) []structs.PostData {
	for i, j := 0, len(posts)-1; i < j; i, j = i+1, j-1 {
		posts[i], posts[j] = posts[j], posts[i]
	}
	return posts
}