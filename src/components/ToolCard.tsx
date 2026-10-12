"use client";

import type { ReactNode } from "react";

export type ToolPart = {
  type: string; // "tool-getWeather", "tool-calculator", ...
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

type Json = Record<string, unknown>;

/* ---------- weather icons (simple line icons, 40x40) ---------- */

type Kind = "sun" | "cloud" | "rain" | "snow" | "storm" | "fog" | "unknown";

function weatherInfo(code: number): { label: string; kind: Kind } {
  if (code === 0) return { label: "Clear sky", kind: "sun" };
  if (code === 1) return { label: "Mostly clear", kind: "sun" };
  if (code === 2) return { label: "Partly cloudy", kind: "cloud" };
  if (code === 3) return { label: "Overcast", kind: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", kind: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", kind: "rain" };
  if (code >= 61 && code <= 67) return { label: "Rain", kind: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", kind: "snow" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", kind: "rain" };
  if (code === 85 || code === 86) return { label: "Snow showers", kind: "snow" };
  if (code >= 95 && code <= 99) return { label: "Thunderstorm", kind: "storm" };
  return { label: "Conditions unavailable", kind: "unknown" };
}

const CLOUD = "M11 28h18a6 6 0 0 0 .9-11.9A9 9 0 0 0 12.3 14.6A7 7 0 0 0 11 28z";

function WeatherIcon({ kind, className }: { kind: Kind; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {kind === "sun" && (
        <>
          <circle cx="20" cy="20" r="7" />
          <path d="M20 5v4M20 31v4M5 20h4M31 20h4M9.4 9.4l2.8 2.8M27.8 27.8l2.8 2.8M9.4 30.6l2.8-2.8M27.8 12.2l2.8-2.8" />
        </>
      )}
      {(kind === "cloud" || kind === "unknown") && <path d={CLOUD} />}
      {kind === "rain" && (
        <>
          <path d={CLOUD} />
          <path d="M14 31l-2 5M20 31l-2 5M26 31l-2 5" />
        </>
      )}
      {kind === "snow" && (
        <>
          <path d={CLOUD} />
          <path d="M14 33h.01M20 36h.01M26 33h.01" strokeWidth="3" />
        </>
      )}
      {kind === "storm" && (
        <>
          <path d={CLOUD} />
          <path d="M21 29l-4 6h5l-3 5" />
        </>
      )}
      {kind === "fog" && <path d="M8 14h24M12 20h20M8 26h24M12 32h20" />}
    </svg>
  );
}

/* ---------- result views ---------- */

function WeatherResult({ data }: { data: Json }) {
  const temp = typeof data.temperatureC === "number" ? Math.round(data.temperatureC) : null;
  const wind = typeof data.windKmh === "number" ? Math.round(data.windKmh) : null;
  const info = weatherInfo(typeof data.weatherCode === "number" ? data.weatherCode : -1);
  const place = [data.city, data.country].filter((v) => typeof v === "string").join(", ");

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-canvas px-4 py-3">
      <WeatherIcon kind={info.kind} className="h-12 w-12 shrink-0 text-accent" />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-light tabular-nums">{temp ?? "–"}</span>
          <span className="text-lg text-muted">°C</span>
        </div>
        <p className="truncate font-medium">{place || "Unknown place"}</p>
        <p className="text-sm text-muted">
          {info.label}
          {wind !== null ? `, wind ${wind} km/h` : ""}
        </p>
      </div>
    </div>
  );
}

function CalculatorResult({ data }: { data: Json }) {
  const result =
    typeof data.result === "number"
      ? data.result.toLocaleString("en-GB", { maximumFractionDigits: 8 })
      : "–";
  return (
    <div className="inline-flex max-w-full flex-wrap items-baseline gap-x-3 rounded-xl border border-line bg-canvas px-4 py-3">
      <span className="break-all text-muted tabular-nums">{String(data.expression ?? "")}</span>
      <span className="text-muted">=</span>
      <span className="text-2xl font-medium tabular-nums">{result}</span>
    </div>
  );
}

function TimeResult({ data }: { data: Json }) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-4 py-3">
      <p className="text-lg font-medium tabular-nums">{String(data.now ?? "")}</p>
      <p className="text-sm text-muted">{String(data.timeZone ?? "")}</p>
    </div>
  );
}

function Status({ label, tone = "busy" }: { label: string; tone?: "busy" | "error" }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-muted">
      <span
        aria-hidden
        className={
          "h-2 w-2 rounded-full " +
          (tone === "error" ? "bg-red-500" : "bg-accent motion-safe:animate-pulse")
        }
      />
      {label}
    </div>
  );
}

const runningText: Record<string, string> = {
  getWeather: "Checking the weather",
  calculator: "Calculating",
  getCurrentTime: "Checking the time",
};

/* ---------- main component ---------- */

export default function ToolCard({ part }: { part: ToolPart }) {
  const name = part.type.replace(/^tool-/, "");
  const output = (part.output ?? undefined) as Json | undefined;
  const running = part.state === "input-streaming" || part.state === "input-available";

  let body: ReactNode;
  if (part.state === "output-error") {
    body = <Status tone="error" label={part.errorText ?? "The tool failed"} />;
  } else if (running) {
    body = <Status label={`${runningText[name] ?? `Running ${name}`}...`} />;
  } else if (output && typeof output.error === "string") {
    body = <Status tone="error" label={output.error} />;
  } else if (output && name === "getWeather") {
    body = <WeatherResult data={output} />;
  } else if (output && name === "calculator") {
    body = <CalculatorResult data={output} />;
  } else if (output && name === "getCurrentTime") {
    body = <TimeResult data={output} />;
  } else {
    body = <Status label={`${name} finished`} />;
  }

  return (
    <div className="my-3">
      {body}
      <details className="mt-1.5 text-xs text-muted">
        <summary className="inline-block cursor-pointer select-none hover:text-ink">Show details</summary>
        <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-canvas p-2">
          {JSON.stringify({ tool: name, input: part.input ?? {}, output: part.output }, null, 2)}
        </pre>
      </details>
    </div>
  );
}