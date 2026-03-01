package chords

import (
	"encoding/json"
	"fmt"
	"os"
)

type StringedVoicing struct {
	Frets    []int  `json:"frets"`
	Fingers  []int  `json:"fingers"`
	Position int    `json:"position"`
	Barre    *Barre `json:"barre,omitempty"`
}

type Barre struct {
	Fret    int   `json:"fret"`
	Strings []int `json:"strings"`
}

type PianoVoicing struct {
	Keys []string `json:"keys"`
}

type Instruments struct {
	Guitar   []StringedVoicing `json:"guitar"`
	Banjo    []StringedVoicing `json:"banjo"`
	Mandolin []StringedVoicing `json:"mandolin"`
	Piano    []PianoVoicing    `json:"piano"`
}

type ChordVoicing struct {
	Name        string      `json:"name"`
	DisplayName string      `json:"display_name"`
	Instruments Instruments `json:"instruments"`
}

type Library struct {
	data map[string]ChordVoicing
}

func LoadLibrary(path string) (*Library, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read chord library: %w", err)
	}
	var data map[string]ChordVoicing
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, fmt.Errorf("parse chord library: %w", err)
	}
	return &Library{data: data}, nil
}

func (l *Library) Get(name string) (ChordVoicing, error) {
	v, ok := l.data[name]
	if !ok {
		return ChordVoicing{}, fmt.Errorf("chord %q not found", name)
	}
	return v, nil
}

func (l *Library) All() []ChordVoicing {
	result := make([]ChordVoicing, 0, len(l.data))
	for _, v := range l.data {
		result = append(result, v)
	}
	return result
}
