package profile

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeTestFile(t *testing.T, path, contents string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestReadStateFile(t *testing.T) {
	root := t.TempDir()
	writeTestFile(t, filepath.Join(root, ".career-ops", "active-profile"), "hannah-aghaei\n")
	writeTestFile(t, filepath.Join(root, ".career-ops", "profile-state.json"), `{
  "status": "ready",
  "profile_id": "hannah-aghaei",
  "display_name": "Hannah Aghaei",
  "generation": 42
}`)

	state, err := Read(root)
	if err != nil {
		t.Fatal(err)
	}
	if state.ProfileID != "hannah-aghaei" || state.Generation != 42 {
		t.Fatalf("unexpected state: %#v", state)
	}
	if got := state.Label(); got != "Hannah Aghaei (hannah-aghaei)" {
		t.Fatalf("unexpected label: %q", got)
	}
}

func TestReadyStateMustMatchActivePointer(t *testing.T) {
	root := t.TempDir()
	writeTestFile(t, filepath.Join(root, ".career-ops", "active-profile"), "arshia-hemati\n")
	writeTestFile(t, filepath.Join(root, ".career-ops", "profile-state.json"), `{
  "status": "ready",
  "profile_id": "hannah-aghaei",
  "generation": 42
}`)

	if _, err := Read(root); err == nil || !strings.Contains(err.Error(), "does not match active pointer") {
		t.Fatalf("expected profile mismatch error, got %v", err)
	}
}

func TestReadLegacyActivePointer(t *testing.T) {
	root := t.TempDir()
	writeTestFile(t, filepath.Join(root, ".career-ops", "active-profile"), "arshia-hemati\n")
	writeTestFile(t, filepath.Join(root, ".career-ops", "profiles", "arshia-hemati", "profile.json"), `{"display_name":"Arshia Hemati"}`)

	state, err := Read(root)
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != StatusReady || state.Label() != "Arshia Hemati (arshia-hemati)" {
		t.Fatalf("unexpected legacy state: %#v", state)
	}
}

func TestReadRequiresActiveProfile(t *testing.T) {
	_, err := Read(t.TempDir())
	if err == nil || !strings.Contains(err.Error(), "no Career-Ops profile is active") {
		t.Fatalf("expected missing-profile error, got %v", err)
	}
}

func TestOperationLockIsExclusiveAndReusable(t *testing.T) {
	root := t.TempDir()
	release, err := TryOperationLock(root, "dashboard test")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := TryOperationLock(root, "second owner"); err == nil {
		t.Fatal("expected second operation lock to fail")
	}
	release()
	releaseAgain, err := TryOperationLock(root, "after release")
	if err != nil {
		t.Fatalf("lock was not reusable: %v", err)
	}
	releaseAgain()
}
