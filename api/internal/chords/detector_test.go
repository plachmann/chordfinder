package chords_test

import (
	"math"
	"testing"

	"github.com/chordfinder/api/internal/chords"
)

func makeSine(freqHz, durationS float64, sr int) []float32 {
	n := int(durationS * float64(sr))
	samples := make([]float32, n)
	for i := range samples {
		samples[i] = float32(math.Sin(2 * math.Pi * freqHz * float64(i) / float64(sr)))
	}
	return samples
}

func TestDetectChordReturnsSomething(t *testing.T) {
	audio := makeSine(440.0, 1.0, 16000) // A4
	result := chords.DetectChord(audio, 16000)
	if result.Name == "" {
		t.Error("expected a chord name")
	}
	if result.Confidence == "" {
		t.Error("expected a confidence level")
	}
}

func TestDetectChordSilenceReturnsUnknown(t *testing.T) {
	silence := make([]float32, 16000)
	result := chords.DetectChord(silence, 16000)
	if result.Name != "?" {
		t.Errorf("expected '?' for silence, got %s", result.Name)
	}
}

func TestConfidenceIsValid(t *testing.T) {
	audio := makeSine(261.63, 1.0, 16000) // C4
	result := chords.DetectChord(audio, 16000)
	valid := map[string]bool{"high": true, "medium": true, "low": true, "none": true}
	if !valid[result.Confidence] {
		t.Errorf("unexpected confidence: %s", result.Confidence)
	}
}
