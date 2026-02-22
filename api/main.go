package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/chordfinder/api/internal/transport"
)

func main() {
	h := transport.NewHandler()
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})
	r.Post("/sessions", h.CreateSession)
	r.Delete("/sessions/{sessionID}", func(w http.ResponseWriter, req *http.Request) {
		h.DeleteSession(w, req, chi.URLParam(req, "sessionID"))
	})
	r.Get("/sessions/{sessionID}/stream", func(w http.ResponseWriter, req *http.Request) {
		h.ServeStream(w, req, chi.URLParam(req, "sessionID"))
	})

	log.Println("ChordFinder API listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
