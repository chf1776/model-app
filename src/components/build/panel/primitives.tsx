import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h4 className="text-[10px] font-semibold text-text-tertiary">{children}</h4>;
}

export function Divider() {
  return <div className="my-3 h-px bg-border" />;
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-[10px]">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
