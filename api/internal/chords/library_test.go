package chords_test

import (
	"testing"

	"github.com/chordfinder/api/internal/chords"
)

func TestGetChord(t *testing.T) {
	lib, err := chords.LoadLibrary("../../data/chords.json")
	if err != nil {
		t.Fatalf("failed to load library: %v", err)
	}
	voicing, err := lib.Get("Am")
	if err != nil {
		t.Fatalf("expected Am to exist: %v", err)
	}
	if voicing.Name != "Am" {
		t.Errorf("expected name Am, got %s", voicing.Name)
	}
	if len(voicing.Instruments.Guitar.Frets) == 0 {
		t.Error("expected guitar frets")
	}
	if len(voicing.Instruments.Piano.Keys) == 0 {
		t.Error("expected piano keys")
	}
}

func TestGetMultipleChords(t *testing.T) {
	lib, _ := chords.LoadLibrary("../../data/chords.json")
	for _, name := range []string{"C", "G", "Am", "F", "Em", "Dm"} {
		v, err := lib.Get(name)
		if err != nil {
			t.Errorf("chord %s not found: %v", name, err)
			continue
		}
		if len(v.Instruments.Piano.Keys) == 0 {
			t.Errorf("chord %s missing piano voicing", name)
		}
	}
}

func TestUnknownChordReturnsError(t *testing.T) {
	lib, _ := chords.LoadLibrary("../../data/chords.json")
	_, err := lib.Get("Xyz999")
	if err == nil {
		t.Error("expected error for unknown chord")
	}
}

func TestLibraryHasMinimumChords(t *testing.T) {
	lib, _ := chords.LoadLibrary("../../data/chords.json")
	all := lib.All()
	if len(all) < 50 {
		t.Errorf("expected at least 50 chords, got %d", len(all))
	}
}
