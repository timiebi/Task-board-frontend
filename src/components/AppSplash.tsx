export function AppSplash({ fading = false }: { fading?: boolean }) {
  return (
    <div
      className={`app-splash${fading ? " app-splash--fading" : ""}`}
      role="status"
      aria-busy="true"
      aria-label="Loading Task Board"
    >
      <div className="app-splash-logo" aria-hidden>
        TB
      </div>
      <div className="app-splash-spinner" aria-hidden />
    </div>
  );
}
