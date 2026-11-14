"use client";

export default function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn text-xs">
      {label}
    </button>
  );
}
