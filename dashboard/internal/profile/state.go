package profile

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const (
	StatusReady     = "ready"
	StatusSwitching = "switching"
	StatusError     = "error"
)

// State is the small, non-sensitive hand-off published by profile.mjs while it
// swaps the active user layer. The dashboard must not read workspace data until
// the state is ready.
type State struct {
	Status      string `json:"status"`
	ProfileID   string `json:"profile_id"`
	DisplayName string `json:"display_name"`
	Generation  int64  `json:"generation"`
	Error       string `json:"error,omitempty"`
}

// TryOperationLock prevents profile.mjs from swapping the workspace while the
// dashboard is performing a write or a long-running generated-file operation.
func TryOperationLock(root, purpose string) (func(), error) {
	lockPath := filepath.Join(root, ".career-ops", "operation.lock")
	if err := os.MkdirAll(filepath.Dir(lockPath), 0o755); err != nil {
		return nil, err
	}
	file, err := os.OpenFile(lockPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		if errors.Is(err, os.ErrExist) {
			return nil, errors.New("another Career-Ops profile operation is running")
		}
		return nil, err
	}
	token := fmt.Sprintf("%d-%d", os.Getpid(), time.Now().UnixNano())
	payload := struct {
		PID       int    `json:"pid"`
		Purpose   string `json:"purpose"`
		Token     string `json:"token"`
		CreatedAt string `json:"created_at"`
	}{os.Getpid(), purpose, token, time.Now().UTC().Format(time.RFC3339Nano)}
	if err := json.NewEncoder(file).Encode(payload); err != nil {
		file.Close()
		os.Remove(lockPath)
		return nil, err
	}
	if err := file.Close(); err != nil {
		os.Remove(lockPath)
		return nil, err
	}

	var once sync.Once
	return func() {
		once.Do(func() {
			contents, readErr := os.ReadFile(lockPath)
			if readErr != nil {
				return
			}
			var current struct {
				Token string `json:"token"`
			}
			if json.Unmarshal(contents, &current) == nil && current.Token == token {
				_ = os.Remove(lockPath)
			}
		})
	}, nil
}

// Label returns the human-friendly identity shown in the dashboard header.
func (s State) Label() string {
	if s.DisplayName == "" || s.DisplayName == s.ProfileID {
		return s.ProfileID
	}
	return fmt.Sprintf("%s (%s)", s.DisplayName, s.ProfileID)
}

// Read returns the active profile state. Older profile stores without
// profile-state.json remain supported through the active-profile pointer.
func Read(root string) (State, error) {
	statePath := filepath.Join(root, ".career-ops", "profile-state.json")
	contents, err := os.ReadFile(statePath)
	if err == nil {
		var state State
		if err := json.Unmarshal(contents, &state); err != nil {
			return State{}, fmt.Errorf("read profile state: %w", err)
		}
		if state.Status == "" || state.ProfileID == "" {
			return State{}, errors.New("profile state is missing status or profile_id")
		}
		if state.Status == StatusReady {
			active, activeErr := os.ReadFile(filepath.Join(root, ".career-ops", "active-profile"))
			if activeErr != nil {
				return State{}, fmt.Errorf("ready profile has no active pointer: %w", activeErr)
			}
			if activeID := strings.TrimSpace(string(active)); activeID != state.ProfileID {
				return State{}, fmt.Errorf("ready profile state %s does not match active pointer %s", state.ProfileID, activeID)
			}
		}
		return state, nil
	}
	if !errors.Is(err, os.ErrNotExist) {
		return State{}, fmt.Errorf("read profile state: %w", err)
	}

	activePath := filepath.Join(root, ".career-ops", "active-profile")
	active, err := os.ReadFile(activePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return State{}, errors.New("no Career-Ops profile is active; run node scripts/profile.mjs activate <profile-id>")
		}
		return State{}, fmt.Errorf("read active profile: %w", err)
	}
	id := strings.TrimSpace(string(active))
	if id == "" {
		return State{}, errors.New("active Career-Ops profile id is empty")
	}

	displayName := id
	metadataPath := filepath.Join(root, ".career-ops", "profiles", id, "profile.json")
	if metadata, metadataErr := os.ReadFile(metadataPath); metadataErr == nil {
		var value struct {
			DisplayName string `json:"display_name"`
		}
		if json.Unmarshal(metadata, &value) == nil && value.DisplayName != "" {
			displayName = value.DisplayName
		}
	}
	return State{Status: StatusReady, ProfileID: id, DisplayName: displayName}, nil
}
