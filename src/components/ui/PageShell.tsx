import { PanelHeader } from "./PanelHeader";

interface PageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  narrow?: boolean;
  children: React.ReactNode;
}

export function PageShell({
  title,
  subtitle,
  action,
  narrow,
  children,
}: PageShellProps) {
  return (
    <div className={`app-page${narrow ? " app-page--narrow" : ""}`}>
      <PanelHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </div>
  );
}
