package chords

const sectionWindow = 8

// Section represents a detected song section.
type Section struct {
	Label  string
	Chords []string
}

// SectionDetector accumulates chords and groups them into labeled sections.
type SectionDetector struct {
	chords []string
}

func NewSectionDetector() *SectionDetector {
	return &SectionDetector{}
}

func (sd *SectionDetector) AddChord(name, confidence string) {
	if name == "?" && confidence == "low" {
		return
	}
	sd.chords = append(sd.chords, name)
}

func (sd *SectionDetector) GetSections() []Section {
	if len(sd.chords) == 0 {
		return nil
	}

	seen := map[string]string{}
	var sections []Section
	labelIdx := 0

	for i := 0; i < len(sd.chords); i += sectionWindow {
		end := i + sectionWindow
		if end > len(sd.chords) {
			end = len(sd.chords)
		}
		chunk := sd.chords[i:end]
		key := joinChords(chunk)

		label, ok := seen[key]
		if !ok {
			label = "Section " + string(rune('A'+labelIdx))
			seen[key] = label
			labelIdx++
		}
		if len(sections) > 0 && sections[len(sections)-1].Label == label {
			continue
		}
		sections = append(sections, Section{
			Label:  label,
			Chords: uniqueChords(chunk),
		})
	}
	return sections
}

func joinChords(chords []string) string {
	result := ""
	for i, c := range chords {
		if i > 0 {
			result += ","
		}
		result += c
	}
	return result
}

func uniqueChords(chords []string) []string {
	seen := map[string]bool{}
	var result []string
	for _, c := range chords {
		if !seen[c] {
			seen[c] = true
			result = append(result, c)
		}
	}
	return result
}
