# Accessibility verification

The map has one focusable canvas, a live textual inspector, a single-reference entry field, and previous/next controls. Counts, reading dates, and journal ownership are available as text; tens of thousands of accessibility nodes are unnecessary. Keyboard arrows inspect cells, Home/End move to scope boundaries, Enter opens details, and scrolling keeps the inspected cell visible. Touch taps open the same detail dialog. Visible focus has a double outline; metric/layout/navigation controls expose selected states.

Dialogs make background content inert, trap keyboard focus, support Escape, and restore focus to the trigger or a valid fallback when a deleted trigger disappears. Conflict dialogs can overlay an editing dialog without exposing the underlying dialog to traversal. Validation and persistence errors use alerts; successful saves and inspection use polite status announcements. Recovery offers named buttons and explicit destinations.

Automated checks use Playwright Chromium and WebKit on macOS, plus the enabled Firefox Linux CI project. They cover keyboard logging, focus wrapping/restoration, text inspection, map scrolling, transfer/recovery dialogs, and accessibility snapshots. Other browser workflows cover edits, journal switching, validation, conflicts, deletion/Undo, and Trash restart recovery. Browser accessibility trees and keyboard automation verify semantics and operation, not synthesized speech.

## Assistive-technology manual checks

VoiceOver with Safari/Chrome on macOS and NVDA with Firefox on Windows have **not been manually verified in this environment**. Do not interpret browser accessibility snapshots as screen-reader certification. Before claiming verified support, record browser/OS/screen-reader versions and run these checks with the actual assistive technology:

1. Navigate headings, current-page navigation, journal destination/view scope, period fields, metric/layout controls, and the text inspector; confirm names, selected states, counts, and last-read dates are spoken.
2. Log a passage, hear an invalid reference, correct it, save, edit notes, and switch journals. Confirm alerts and saved statuses are announced without losing the draft.
3. Enter a verse in the inspector, open details, close with Escape, and confirm focus restoration. With map keyboard interaction enabled, navigate to End and confirm visible inspection and announcements.
4. Move/copy a reading and test a remote update conflict. Confirm only the top dialog is traversable and returning to Edit restores focus.
5. Delete/Undo, reload and restore from Trash, choose a different destination, and test ID conflicts and permanent-deletion confirmation. Confirm error and recovery actions are announced and operable.

Remaining limitations: screen readers may reserve canvas arrow keys in browse mode; use the text inspector or switch to focus interaction. Mobile emulation is not physical-device certification. Large Trash batches list each stored reading and can be lengthy. Color alone does not identify exact metrics; inspect the textual counts and dates or use standalone metrics.

Clear-journal confirmation identifies and snapshots the logging destination independently of the viewed aggregate scope. It keeps that destination stable if another tab changes selection, and read-only archive inspection disables clearing. Errors expose the actual persistence or destination failure while retaining existing data.
