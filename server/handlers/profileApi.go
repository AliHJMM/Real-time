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

func ProfileAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    userID, isLoggedIn := sessions.GetSessionUserID(r)
    if !isLoggedIn {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Check if the user requests their profile or someone else's profile
    var profileID int
    if r.URL.Query().Get("id") == "" {
        profileID = userID
    } else {
        profileIDStr := r.URL.Query().Get("id")
        var err error
        profileID, err = strconv.Atoi(profileIDStr)
        if err != nil {
            log.Printf("Failed to parse profile ID: %v", err)
            http.Error(w, "Invalid profile ID", http.StatusBadRequest)
            return
        }
    }

    username, err := Database.GetUsername(db, profileID)
    if err != nil {
        log.Printf("Failed to get username: %v", err)
        http.Error(w, "User not found", http.StatusUnauthorized)
        return
    }

    isHisProfile := profileID == userID

    // Fetch My Posts
    posts, err := Database.GetPostByUserID(db, profileID)
    if err != nil {
        log.Printf("Failed to get posts: %v", err)
        http.Error(w, "Failed to load posts", http.StatusInternalServerError)
        return
    }

    // Fetch Liked Posts
    likedPosts, err := Database.GetLikedPosts(db, profileID)
    if err != nil {
        log.Printf("Failed to get liked posts: %v", err)
        http.Error(w, "Failed to load liked posts", http.StatusInternalServerError)
        return
    }

    // Prepare post data
    var myPostDataList []structs.PostData
    var likedPostDataList []structs.PostData

    // Process My Posts
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
            reaction, err = Database.CheckReactionExists(db, post.ID, userID, "post")
            if err != nil {
                log.Printf("Failed to check reaction: %v", err)
                continue
            }
        }

        myPostDataList = append(myPostDataList, structs.PostData{
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

    // Process Liked Posts
    for _, post := range likedPosts {
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
            reaction, err = Database.CheckReactionExists(db, post.ID, userID, "post")
            if err != nil {
                log.Printf("Failed to check reaction: %v", err)
                continue
            }
        }

        likedPostDataList = append(likedPostDataList, structs.PostData{
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

    // Send the data as JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(struct {
        MyPosts      []structs.PostData `json:"myPosts"`
        LikedPosts   []structs.PostData `json:"likedPosts"`
        IsHisProfile bool               `json:"isHisProfile"`
        Username     string             `json:"username"`
        UserID       int                `json:"userID"` // Added this line
    }{
        MyPosts:      myPostDataList,
        LikedPosts:   likedPostDataList,
        IsHisProfile: isHisProfile,
        Username:     username,
        UserID:       profileID,
    })
}
