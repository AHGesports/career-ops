package main

import (
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/santifer/career-ops/dashboard/internal/data"
	"github.com/santifer/career-ops/dashboard/internal/i18n"
	"github.com/santifer/career-ops/dashboard/internal/model"
	profiledata "github.com/santifer/career-ops/dashboard/internal/profile"
	"github.com/santifer/career-ops/dashboard/internal/theme"
	"github.com/santifer/career-ops/dashboard/internal/ui/screens"
)

type viewState int

const (
	viewPipeline viewState = iota
	viewReport
	viewProgress
)

type appModel struct {
	pipeline        screens.PipelineModel
	viewer          screens.ViewerModel
	progress        screens.ProgressModel
	state           viewState
	careerOpsPath   string
	theme           theme.Theme
	progressMetrics model.ProgressMetrics
	activeProfile   profiledata.State
	profileReady    bool
	profileError    string
}

type profileTickMsg struct{}

func watchProfile() tea.Cmd {
	return tea.Tick(100*time.Millisecond, func(time.Time) tea.Msg { return profileTickMsg{} })
}

func (m *appModel) rebuildForProfile() {
	width, height := m.pipeline.Width(), m.pipeline.Height()
	if width <= 0 {
		width = 120
	}
	if height <= 0 {
		height = 40
	}
	apps := data.ParseApplications(m.careerOpsPath)
	if apps == nil {
		apps = []model.CareerApplication{}
	}
	metrics := data.ComputeMetrics(apps)
	m.progressMetrics = data.ComputeProgressMetrics(apps)
	pm := screens.NewPipelineModel(m.theme, apps, metrics, m.careerOpsPath, width, height)
	pm.SetProfileLabel(m.activeProfile.Label())
	for _, app := range apps {
		if app.ReportPath == "" {
			continue
		}
		archetype, tldr, remote, comp := data.LoadReportSummary(m.careerOpsPath, app.ReportPath)
		if archetype != "" || tldr != "" || remote != "" || comp != "" {
			pm.EnrichReport(app.ReportPath, archetype, tldr, remote, comp)
		}
	}
	m.pipeline = pm
	m.state = viewPipeline
}

// syncProfile blocks the UI while a profile swap is in flight and rebuilds
// every in-memory model when the selected owner changes. Returning true tells
// Update to discard a message produced by the previous profile's model.
func (m *appModel) syncProfile() bool {
	next, err := profiledata.Read(m.careerOpsPath)
	if err != nil {
		changed := m.profileReady || m.profileError != err.Error()
		m.profileReady = false
		m.profileError = err.Error()
		m.state = viewPipeline
		return changed
	}
	if next.Status != profiledata.StatusReady {
		changed := m.profileReady || next.ProfileID != m.activeProfile.ProfileID || next.Generation != m.activeProfile.Generation || next.Status != m.activeProfile.Status
		m.activeProfile = next
		m.profileReady = false
		m.profileError = next.Error
		m.state = viewPipeline
		return changed
	}

	changed := !m.profileReady || next.ProfileID != m.activeProfile.ProfileID || next.Generation != m.activeProfile.Generation
	m.activeProfile = next
	m.profileReady = true
	m.profileError = ""
	if changed {
		m.rebuildForProfile()
	}
	return changed
}

func (m *appModel) requireSameReadyProfile() error {
	current, err := profiledata.Read(m.careerOpsPath)
	if err != nil {
		return err
	}
	if current.Status != profiledata.StatusReady || current.ProfileID != m.activeProfile.ProfileID || current.Generation != m.activeProfile.Generation {
		return fmt.Errorf("active profile changed from %s while the dashboard operation was starting", m.activeProfile.ProfileID)
	}
	return nil
}

func (m *appModel) reloadPipelineDataUnlocked() {
	apps := data.ParseApplications(m.careerOpsPath)
	metrics := data.ComputeMetrics(apps)
	m.progressMetrics = data.ComputeProgressMetrics(apps)
	m.pipeline = m.pipeline.WithReloadedData(apps, metrics)
	m.pipeline.SetProfileLabel(m.activeProfile.Label())
}

func (m *appModel) reloadPipelineData() {
	release, err := profiledata.TryOperationLock(m.careerOpsPath, "dashboard refresh")
	if err != nil {
		fmt.Fprintf(os.Stderr, "WARN: dashboard refresh deferred: %v\n", err)
		return
	}
	defer release()
	if err := m.requireSameReadyProfile(); err != nil {
		fmt.Fprintf(os.Stderr, "WARN: dashboard refresh cancelled: %v\n", err)
		return
	}
	m.reloadPipelineDataUnlocked()
}

func (m *appModel) mutateAndReload(purpose string, mutate func() error) error {
	release, err := profiledata.TryOperationLock(m.careerOpsPath, purpose)
	if err != nil {
		return err
	}
	defer release()
	if err := m.requireSameReadyProfile(); err != nil {
		return err
	}
	mutationErr := mutate()
	m.reloadPipelineDataUnlocked()
	return mutationErr
}

func (m appModel) Init() tea.Cmd {
	return watchProfile()
}

// Update manages global app state and routes incoming messages to active screens.
func (m appModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	if _, ok := msg.(profileTickMsg); ok {
		m.syncProfile()
		return m, watchProfile()
	}
	if changed := m.syncProfile(); changed || !m.profileReady {
		return m, nil
	}

	if keyMsg, ok := msg.(tea.KeyMsg); ok {
		switch keyMsg.String() {
		case "t", "T":
			// Toggle language globally, unless the user is actively typing in a text input field
			if !(m.state == viewPipeline && m.pipeline.IsTextInputActive()) {
				i18n.ToggleLang()
			}
		}
	}

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.pipeline.Resize(msg.Width, msg.Height)
		if m.state == viewReport {
			m.viewer.Resize(msg.Width, msg.Height)
		}
		if m.state == viewProgress {
			m.progress.Resize(msg.Width, msg.Height)
		}
		pm, cmd := m.pipeline.Update(msg)
		m.pipeline = pm
		return m, cmd

	case screens.PipelineClosedMsg:
		return m, tea.Quit

	case screens.PipelineLoadReportMsg:
		archetype, tldr, remote, comp := data.LoadReportSummary(msg.CareerOpsPath, msg.ReportPath)
		m.pipeline.EnrichReport(msg.ReportPath, archetype, tldr, remote, comp)
		return m, nil

	case screens.PipelineUpdateStatusMsg:
		err := m.mutateAndReload("dashboard status update", func() error {
			return data.UpdateApplicationStatus(msg.CareerOpsPath, msg.App, msg.NewStatus)
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "WARN: status update failed: %v\n", err)
		}
		return m, nil

	case screens.PipelineUpdateStatusAndNotesMsg:
		// Issue 1380: atomic status + notes write from the discard reason picker.
		err := m.mutateAndReload("dashboard status and notes update", func() error {
			return data.UpdateApplicationStatusAndNotes(msg.CareerOpsPath, msg.App, msg.NewStatus, msg.NotesAppend)
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "WARN: status+notes update failed: %v\n", err)
		}
		return m, nil

	case screens.PipelineRefreshMsg:
		m.reloadPipelineData()
		return m, nil

	case screens.PipelineOpenReportMsg:
		m.viewer = screens.NewViewerModel(
			m.theme,
			m.careerOpsPath,
			msg.Path, msg.Title,
			m.pipeline.Width(), m.pipeline.Height(),
			msg.App,
		)
		m.state = viewReport
		return m, nil

	case screens.ViewerClosedMsg:
		m.state = viewPipeline
		return m, nil

	case screens.ViewerOpenCoverLetterMsg:
		path := msg.Path
		return m, func() tea.Msg {
			if err := openWithDefaultApp(path); err != nil {
				fmt.Fprintf(os.Stderr, "WARN: could not open cover letter: %v\n", err)
			}
			return nil
		}

	case screens.ViewerUpdateStatusMsg:
		normalized := data.NormalizeStatus(msg.NewStatus)
		if normalized == "hired" {
			err := m.mutateAndReload("dashboard hired status update", func() error {
				return data.UpdateApplicationStatus(m.careerOpsPath, msg.App, msg.NewStatus)
			})
			if err != nil {
				fmt.Fprintf(os.Stderr, "WARN: status update failed: %v\n", err)
				return m, nil
			}
			m.state = viewPipeline
			m.pipeline, _ = m.pipeline.StartHiredFlow(msg.App)
			return m, nil
		}
		if normalized == "discarded" || normalized == "skip" {
			m.state = viewPipeline
			m.pipeline, _ = m.pipeline.StartDiscardReasonFlow(msg.App, msg.NewStatus)
			return m, nil
		}

		err := m.mutateAndReload("dashboard viewer status update", func() error {
			return data.UpdateApplicationStatus(m.careerOpsPath, msg.App, msg.NewStatus)
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "WARN: status update failed: %v\n", err)
			return m, nil
		}
		m.viewer.UpdateAppStatus(msg.NewStatus)
		return m, nil

	case screens.PipelineOpenProgressMsg:
		m.progress = screens.NewProgressModel(
			theme.NewTheme("catppuccin-mocha"),
			m.progressMetrics,
			m.pipeline.Width(), m.pipeline.Height(),
		)
		m.state = viewProgress
		return m, nil

	case screens.ProgressClosedMsg:
		m.state = viewPipeline
		return m, nil

	case screens.PipelineOpenURLMsg:
		return m, openCmd(msg.URL)

	case screens.PipelineOpenPDFMsg:
		return m, openCmd(msg.Path)

	case screens.PipelineGeneratePDFMsg:
		return m, runGeneratePDF(msg, m.activeProfile)

	default:
		if m.state == viewReport {
			vm, cmd := m.viewer.Update(msg)
			m.viewer = vm
			return m, cmd
		}
		if m.state == viewProgress {
			pg, cmd := m.progress.Update(msg)
			m.progress = pg
			return m, cmd
		}
		pm, cmd := m.pipeline.Update(msg)
		m.pipeline = pm
		return m, cmd
	}
}

// openCmd wraps openWithDefaultApp (OS-specific) as a tea.Cmd. Shared by the
// job-URL (`o`) and CV-PDF (`d`) actions.
func openCmd(target string) tea.Cmd {
	return func() tea.Msg {
		if err := openWithDefaultApp(target); err != nil {
			fmt.Fprintf(os.Stderr, "WARN: failed to open %q: %v\n", target, err)
		}
		return nil
	}
}

// runGeneratePDF shells out to node generate-pdf.mjs in the career-ops root,
// opens the resulting PDF on success, and reports the outcome back to the
// pipeline screen as a PipelinePDFGeneratedMsg. Runs in a tea.Cmd goroutine,
// so the UI stays responsive while Chromium renders.
func runGeneratePDF(msg screens.PipelineGeneratePDFMsg, expectedProfile profiledata.State) tea.Cmd {
	return func() tea.Msg {
		release, err := profiledata.TryOperationLock(msg.CareerOpsPath, "dashboard PDF generation")
		if err != nil {
			return screens.PipelinePDFGeneratedMsg{Err: fmt.Sprintf("profile operation busy: %v", err)}
		}
		defer release()
		current, err := profiledata.Read(msg.CareerOpsPath)
		if err != nil || current.Status != profiledata.StatusReady || current.ProfileID != expectedProfile.ProfileID || current.Generation != expectedProfile.Generation {
			if err == nil {
				err = fmt.Errorf("active profile changed from %s", expectedProfile.ProfileID)
			}
			return screens.PipelinePDFGeneratedMsg{Err: fmt.Sprintf("PDF generation cancelled: %v", err)}
		}
		args := []string{"generate-pdf.mjs", msg.HTMLPath, msg.PDFPath}
		if msg.Format != "" {
			args = append(args, "--format="+msg.Format)
		}
		if msg.ReportNumber != "" {
			args = append(args, "--report="+msg.ReportNumber)
		}
		cmd := exec.Command("node", args...)
		cmd.Dir = msg.CareerOpsPath
		out, err := cmd.CombinedOutput()
		if err != nil {
			return screens.PipelinePDFGeneratedMsg{Err: summarizeCmdError(err, out)}
		}
		pdfAbs := filepath.Join(msg.CareerOpsPath, filepath.FromSlash(msg.PDFPath))
		if err := openWithDefaultApp(pdfAbs); err != nil {
			return screens.PipelinePDFGeneratedMsg{Err: fmt.Sprintf("PDF generated but could not open: %v", err)}
		}
		return screens.PipelinePDFGeneratedMsg{Path: pdfAbs}
	}
}

// summarizeCmdError condenses a failed command into one help-bar-sized line:
// the last non-empty output line when there is one (generate-pdf.mjs prints
// its error there), otherwise the exec error itself.
func summarizeCmdError(err error, out []byte) string {
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		if line := strings.TrimSpace(lines[i]); line != "" {
			return line
		}
	}
	return err.Error()
}

func (m appModel) View() string {
	if !m.profileReady {
		label := m.activeProfile.Label()
		if label == "" {
			label = "none"
		}
		message := "Profile switch in progress. Dashboard data is hidden until the selected profile is ready."
		if m.profileError != "" {
			message = m.profileError
		} else if m.activeProfile.Status == profiledata.StatusError && m.activeProfile.Error != "" {
			message = m.activeProfile.Error
		}
		return fmt.Sprintf("Career-Ops Dashboard\n\nProfile: %s\n\n%s\n", label, message)
	}
	switch m.state {
	case viewReport:
		return m.viewer.View()
	case viewProgress:
		return m.progress.View()
	default:
		return m.pipeline.View()
	}
}

func main() {
	pathFlag := flag.String("path", ".", "Path to career-ops directory")
	langFlag := flag.String("lang", "", "Language for UI (en, tr). Defaults to auto-detect/en.")
	flag.Parse()

	if *langFlag != "" {
		i18n.SetLang(*langFlag)
	} else if os.Getenv("LANG") != "" {
		i18n.SetLang(os.Getenv("LANG"))
	}

	careerOpsPath := *pathFlag

	t := theme.NewTheme("auto")
	pm := screens.NewPipelineModel(t, []model.CareerApplication{}, model.PipelineMetrics{}, careerOpsPath, 120, 40)

	m := appModel{
		pipeline:      pm,
		careerOpsPath: careerOpsPath,
		theme:         t,
	}
	m.syncProfile()

	p := tea.NewProgram(m, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
