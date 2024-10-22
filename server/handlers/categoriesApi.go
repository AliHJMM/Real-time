package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"talknet/Database"
)

func CategoriesAPIHandler(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	// Fetch categories
	categories, err := Database.GetAllCategories(db)
	if err != nil {
		log.Printf("Failed to get categories: %v", err)
		http.Error(w, "Failed to load categories", http.StatusInternalServerError)
		return
	}
	// Send categories as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}