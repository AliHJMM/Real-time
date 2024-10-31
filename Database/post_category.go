package Database

import (
    "database/sql"
    "talknet/structs"
)

// GetCategoriesByPostID retrieves categories for a post by its ID.
func GetCategoryNamesByPostID(db *sql.DB, postID int) ([]structs.Category, error) {
	query := `
		SELECT c.name 
		FROM post_Categories pc
		JOIN categories c ON pc.category_id = c.id
		WHERE pc.post_id = ?
	`

	rows, err := db.Query(query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []structs.Category
	for rows.Next() {
		var category structs.Category
		if err := rows.Scan(&category.Name); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Log the retrieved categories for debugging

	return categories, nil
}
