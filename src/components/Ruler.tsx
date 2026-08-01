"use client";

export function Ruler({ min, max }: { min: number | null; max: number | null }) {
  const ticks = [0, 6, 12, 18, 24];
  const xFor = (value: number) => 4 + (value / 24) * 192;

  return (
    <svg className="ruler" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
      <line x1="4" y1="0" x2="196" y2="0" className="rail" />
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={xFor(tick)} y1="0" x2={xFor(tick)} y2="6" className="tick" />
          <text x={xFor(tick)} y="17" className="ticklabel" textAnchor="middle">
            {tick}
          </text>
        </g>
      ))}
      {min != null && max != null && (
        <>
          <line x1={xFor(min)} y1="0" x2={xFor(max)} y2="0" className="fill" />
          <circle cx={xFor(min)} cy="0" r="2.6" className="cap" />
          <circle cx={xFor(max)} cy="0" r="2.6" className="cap" />
        </>
      )}
    </svg>
  );
}
