interface SurfacePanelProps {
  toolbar?: React.ReactNode;
  toolbarTitle?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function SurfacePanel({
  toolbar,
  toolbarTitle,
  className = "",
  bodyClassName = "",
  children,
}: SurfacePanelProps) {
  return (
    <div className={`surface ${className}`.trim()}>
      {(toolbar || toolbarTitle) && (
        <div className="surface-toolbar">
          {toolbarTitle && <span className="surface-toolbar-title">{toolbarTitle}</span>}
          {toolbar}
        </div>
      )}
      <div className={`surface-body ${bodyClassName}`.trim()}>{children}</div>
    </div>
  );
}
