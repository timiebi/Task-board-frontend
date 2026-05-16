interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PanelHeader({ title, subtitle, action }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <div>
        <h2 className="panel-title">{title}</h2>
        {subtitle && <p className="panel-subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
