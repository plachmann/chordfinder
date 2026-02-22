package chords

import (
	"math"
	"math/cmplx"

	"github.com/madelynnblue/go-dsp/fft"
)

// DetectionResult holds a chord name and confidence level.
type DetectionResult struct {
	Name       string
	Confidence string // "high", "medium", "low"
}

var chordTemplates map[string][12]float64

func init() {
	chordTemplates = buildTemplates()
}

func buildTemplates() map[string][12]float64 {
	notes := []string{"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"}
	types := []struct {
		suffix    string
		intervals []int
	}{
		{"", []int{0, 4, 7}},
		{"m", []int{0, 3, 7}},
		{"7", []int{0, 4, 7, 10}},
		{"maj7", []int{0, 4, 7, 11}},
		{"m7", []int{0, 3, 7, 10}},
	}

	templates := make(map[string][12]float64)
	for rootIdx, root := range notes {
		for _, ct := range types {
			var chroma [12]float64
			for _, interval := range ct.intervals {
				chroma[(rootIdx+interval)%12] = 1.0
			}
			norm := l2Norm(chroma)
			if norm > 0 {
				for i := range chroma {
					chroma[i] /= norm
				}
			}
			templates[root+ct.suffix] = chroma
		}
	}
	return templates
}

// DetectChord detects the most likely chord in a PCM audio buffer.
// audio: mono float32 samples normalized to [-1, 1], sr: sample rate in Hz.
func DetectChord(audio []float32, sr int) DetectionResult {
	if rms(audio) < 0.001 {
		return DetectionResult{Name: "?", Confidence: "low"}
	}

	chroma := computeChroma(audio, sr)
	norm := l2Norm(chroma)
	if norm < 1e-6 {
		return DetectionResult{Name: "?", Confidence: "low"}
	}
	for i := range chroma {
		chroma[i] /= norm
	}

	bestName := "?"
	bestScore := -1.0
	for name, template := range chordTemplates {
		score := dot(chroma, template)
		if score > bestScore {
			bestScore = score
			bestName = name
		}
	}

	var confidence string
	switch {
	case bestScore > 0.85:
		confidence = "high"
	case bestScore > 0.70:
		confidence = "medium"
	default:
		confidence = "low"
	}
	return DetectionResult{Name: bestName, Confidence: confidence}
}

// computeChroma builds a 12-bin chromagram from the audio using FFT.
func computeChroma(audio []float32, sr int) [12]float64 {
	in := make([]float64, len(audio))
	for i, v := range audio {
		in[i] = float64(v)
	}

	spectrum := fft.FFTReal(in)
	freqRes := float64(sr) / float64(len(in))

	var chroma [12]float64
	for k := 1; k < len(spectrum)/2; k++ {
		freq := float64(k) * freqRes
		if freq < 27.5 || freq > 4186 { // piano range A0–C8
			continue
		}
		magnitude := cmplx.Abs(spectrum[k])
		// Map frequency to pitch class: MIDI = 12*log2(f/440) + 69
		midi := 12*math.Log2(freq/440.0) + 69
		bin := int(math.Round(midi)) % 12
		if bin < 0 {
			bin += 12
		}
		chroma[bin] += magnitude
	}
	return chroma
}

func rms(samples []float32) float64 {
	var sum float64
	for _, v := range samples {
		sum += float64(v) * float64(v)
	}
	return math.Sqrt(sum / float64(len(samples)))
}

func l2Norm(v [12]float64) float64 {
	var sum float64
	for _, x := range v {
		sum += x * x
	}
	return math.Sqrt(sum)
}

func dot(a, b [12]float64) float64 {
	var sum float64
	for i := range a {
		sum += a[i] * b[i]
	}
	return sum
}
