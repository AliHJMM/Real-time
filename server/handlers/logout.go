package handlers
import (
	"net/http"
	"talknet/server/sessions"
)
func LogoutAPIHandler(w http.ResponseWriter, r *http.Request) {
	sessions.LogoutUser(w, r)
	w.WriteHeader(http.StatusOK)
}