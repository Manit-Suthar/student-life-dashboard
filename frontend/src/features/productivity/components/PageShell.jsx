export default function PageShell({ title, subtitle, right, children }) {
  return (
    <div className="w-full">
      {/* Page header row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-white/60">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {/* Big page container card */}
      <div className="rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
