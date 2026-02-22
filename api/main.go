package main

import (
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"
	"runtime"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/chordfinder/api/internal/chords"
	"github.com/chordfinder/api/internal/transport"
)

func main() {
	_, filename, _, _ := runtime.Caller(0)
	dataPath := filepath.Join(filepath.Dir(filename), "data", "chords.json")
	lib, err := chords.LoadLibrary(dataPath)
	if err != nil {
		log.Fatalf("failed to load chord library: %v", err)
	}

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
	r.Get("/chords/{chordName}", func(w http.ResponseWriter, req *http.Request) {
		name := chi.URLParam(req, "chordName")
		voicing, err := lib.Get(name)
		if err != nil {
			http.Error(w, "chord not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(voicing)
	})

	log.Println("ChordFinder API listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
