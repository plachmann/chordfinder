package chords_test

import (
	"testing"

	"github.com/chordfinder/api/internal/chords"
)

func TestSectionDetectorAccumulates(t *testing.T) {
	sd := chords.NewSectionDetector()
	for i := 0; i < 10; i++ {
		sd.AddChord("C", "high")
		sd.AddChord("G", "high")
	}
	sections := sd.GetSections()
	if len(sections) == 0 {
		t.Error("expected at least one section")
	}
}

func TestSectionDetectorLabelFormat(t *testing.T) {
	sd := chords.NewSectionDetector()
	for _, c := range []string{"Am", "F", "C", "G", "Am", "F", "C", "G"} {
		sd.AddChord(c, "high")
	}
	sections := sd.GetSections()
	if len(sections) == 0 {
		t.Fatal("expected sections")
	}
	if sections[0].Label == "" {
		t.Error("expected non-empty label")
	}
	if len(sections[0].Chords) == 0 {
		t.Error("expected chords in section")
	}
}

func TestSectionDetectorIgnoresLowConfidenceUnknown(t *testing.T) {
	sd := chords.NewSectionDetector()
	for i := 0; i < 5; i++ {
		sd.AddChord("?", "low")
	}
	for _, c := range []string{"C", "G", "Am", "F", "C", "G", "Am", "F"} {
		sd.AddChord(c, "high")
	}
	sections := sd.GetSections()
	for _, s := range sections {
		for _, chord := range s.Chords {
			if chord == "?" {
				t.Error("unknown chord should not appear in sections")
			}
		}
	}
}
