interface DropIndicatorLineProps {
  depth: number;
}

export function DropIndicatorLine({ depth }: DropIndicatorLineProps) {
  return (
    <div
      className="relative flex h-[2px] items-center"
      style={{ marginLeft: depth * 20 }}
    >
      {/* Circle */}
      <div className="absolute -left-[3px] -top-[2px] h-[6px] w-[6px] rounded-full bg-accent" />
      {/* Line */}
      <div className="h-[2px] w-full bg-accent" />
    </div>
  );
}
