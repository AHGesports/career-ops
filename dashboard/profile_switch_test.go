package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/santifer/career-ops/dashboard/internal/model"
	"github.com/santifer/career-ops/dashboard/internal/theme"
	"github.com/santifer/career-ops/dashboard/internal/ui/screens"
)

func writeDashboardFile(t *testing.T, path, contents string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatal(err)
	}
}

func writeDashboardProfileState(t *testing.T, root, status, id, name string, generation int) {
	t.Helper()
	if status == "ready" {
		writeDashboardFile(t, filepath.Join(root, ".career-ops", "active-profile"), id+"\n")
	}
	writeDashboardFile(t, filepath.Join(root, ".career-ops", "profile-state.json"), fmt.Sprintf(`{
  "status": %q,
  "profile_id": %q,
  "display_name": %q,
  "generation": %d
}`, status, id, name, generation))
}

func writeDashboardApplications(t *testing.T, root, company, role string) {
	t.Helper()
	writeDashboardFile(t, filepath.Join(root, "data", "applications.md"), fmt.Sprintf(`
| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
| 1 | 2026-01-01 | %s | %s | 4.5/5 | Evaluated | — | — | — |
`, company, role))
}

func TestDashboardHidesOldDataDuringProfileSwitch(t *testing.T) {
	root := t.TempDir()
	themeValue := theme.NewTheme("catppuccin-mocha")
	m := appModel{
		pipeline:      screens.NewPipelineModel(themeValue, []model.CareerApplication{}, model.PipelineMetrics{}, root, 120, 40),
		careerOpsPath: root,
		theme:         themeValue,
	}

	writeDashboardApplications(t, root, "ArshiaCo", "Software Developer")
	writeDashboardProfileState(t, root, "ready", "arshia-hemati", "Arshia Hemati", 1)
	if !m.syncProfile() {
		t.Fatal("expected initial profile load")
	}
	if app, ok := m.pipeline.CurrentApp(); !ok || app.Company != "ArshiaCo" {
		t.Fatalf("expected Arshia data, got %#v, %v", app, ok)
	}

	m.state = viewReport
	writeDashboardProfileState(t, root, "switching", "hannah-aghaei", "Hannah Aghaei", 2)
	if !m.syncProfile() || m.profileReady {
		t.Fatal("expected dashboard to block during profile switch")
	}
	blocked := m.View()
	if strings.Contains(blocked, "ArshiaCo") || !strings.Contains(blocked, "Dashboard data is hidden") {
		t.Fatalf("old profile leaked into blocked view: %q", blocked)
	}

	writeDashboardApplications(t, root, "HannahBio", "Research Scientist")
	writeDashboardProfileState(t, root, "ready", "hannah-aghaei", "Hannah Aghaei", 2)
	if !m.syncProfile() || !m.profileReady {
		t.Fatal("expected Hannah profile to become ready")
	}
	if m.state != viewPipeline {
		t.Fatalf("expected cached viewer to be discarded, got state %v", m.state)
	}
	if app, ok := m.pipeline.CurrentApp(); !ok || app.Company != "HannahBio" {
		t.Fatalf("expected Hannah data, got %#v, %v", app, ok)
	}
	view := m.View()
	if strings.Contains(view, "Arshia Hemati") || !strings.Contains(view, "Hannah Aghaei (hannah-aghaei)") {
		t.Fatalf("dashboard header has wrong profile: %q", view)
	}
}

func TestDashboardLoadsEmptyProfile(t *testing.T) {
	root := t.TempDir()
	themeValue := theme.NewTheme("catppuccin-mocha")
	m := appModel{
		pipeline:      screens.NewPipelineModel(themeValue, []model.CareerApplication{}, model.PipelineMetrics{}, root, 120, 40),
		careerOpsPath: root,
		theme:         themeValue,
	}
	writeDashboardProfileState(t, root, "ready", "hannah-aghaei", "Hannah Aghaei", 1)

	if !m.syncProfile() || !m.profileReady {
		t.Fatal("expected empty profile to load")
	}
	if _, ok := m.pipeline.CurrentApp(); ok {
		t.Fatal("empty profile unexpectedly inherited an application")
	}
	if !strings.Contains(m.View(), "Hannah Aghaei (hannah-aghaei)") {
		t.Fatal("empty profile identity is not shown")
	}
}
