package handlers
import (
	"net/http"
	"talknet/server/sessions"
)
func LogoutAPIHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
	}
	sessions.LogoutUser(w, r)
	w.WriteHeader(http.StatusOK)
}
