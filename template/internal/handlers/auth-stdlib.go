package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"{{PROJECT_NAME}}/internal/config"
	"{{PROJECT_NAME}}/internal/repository"

	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	repo *repository.AuthRepository
	cfg  *config.Config
}

func NewAuthHandler(repo *repository.AuthRepository, cfg *config.Config) *AuthHandler {
	return &AuthHandler{repo: repo, cfg: cfg}
}

func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	url := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=openid+email+profile&access_type=offline",
		h.cfg.GoogleClientID,
		fmt.Sprintf("%s/api/auth/callback", h.cfg.FrontendURL),
	)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Missing authorization code"})
		return
	}

	tokenResp, err := http.PostForm("https://oauth2.googleapis.com/token", map[string][]string{
		"code":          {code},
		"client_id":     {h.cfg.GoogleClientID},
		"client_secret": {h.cfg.GoogleClientSecret},
		"redirect_uri":  {fmt.Sprintf("%s/api/auth/callback", h.cfg.FrontendURL)},
		"grant_type":    {"authorization_code"},
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to exchange token"})
		return
	}
	defer tokenResp.Body.Close()

	body, _ := io.ReadAll(tokenResp.Body)
	var tokenData map[string]interface{}
	json.Unmarshal(body, &tokenData)

	accessToken, ok := tokenData["access_token"].(string)
	if !ok {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Invalid token response"})
		return
	}

	userResp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to get user info"})
		return
	}
	defer userResp.Body.Close()

	var userInfo struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	json.NewDecoder(userResp.Body).Decode(&userInfo)

	if h.cfg.AllowedEmailDomain != "" {
		at := len(userInfo.Email) - len(h.cfg.AllowedEmailDomain)
		if at <= 0 || userInfo.Email[at-1] != '@' || userInfo.Email[at:] != h.cfg.AllowedEmailDomain {
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "Email domain not allowed"})
			return
		}
	}

	user, err := h.repo.FindOrCreateUser(r.Context(), userInfo.Email, userInfo.Name, userInfo.Picture)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create user"})
		return
	}

	expiresAt := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"sub": user.ID,
		"exp": expiresAt.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.cfg.JWTSecret))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to generate token"})
		return
	}

	_, err = h.repo.CreateSession(r.Context(), user.ID, tokenString, expiresAt)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create session"})
		return
	}

	http.Redirect(w, r, fmt.Sprintf("%s/auth/callback?token=%s", h.cfg.FrontendURL, tokenString), http.StatusTemporaryRedirect)
}

func (h *AuthHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID")
	if userID == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Not authenticated"})
		return
	}

	user, err := h.repo.GetUserByID(r.Context(), userID.(string))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to get user"})
		return
	}

	writeJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	token := authHeader
	if len(token) > 7 && token[:7] == "Bearer " {
		token = token[7:]
	}

	if err := h.repo.DeleteSession(r.Context(), token); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to logout"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}
