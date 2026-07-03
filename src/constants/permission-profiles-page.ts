export const PERMISSION_PROFILES_PAGE_COPY = {
  saveButton: "Save current permissions",
  saveModalAriaLabel: "Save current permissions",
  saveModalTitle: "Save current permissions",
  saveModalDescription:
    "Capture the currently active integration enablement and per-tool access modes as a reusable profile. Profiles store only permission settings, never provider credentials.",
  profileNameLabel: "Profile name",
  profileNamePlaceholder: "e.g. Research assistant",
  saveSubmit: "Save current settings",
  saveFootnote:
    "Loading a profile applies saved modes to matching installed integrations and tools. New tools that were not present when the profile was saved are left unchanged.",
  cancel: "Cancel",
  savedProfilesEmpty: "No permission profiles saved yet.",
  loadProfile: "Load profile",
  updateFromCurrent: "Update from current",
  deleteProfile: "Delete profile",
  deleteModalAriaLabel: "Delete permission profile",
  deleteModalTitle: "Delete permission profile?",
  deleteModalDescription: (profileName: string) =>
    `This permanently removes "${profileName}" and its saved permission settings. This action cannot be undone.`,
  deleteConfirm: "Delete profile",
} as const;
