import { tool } from "ai";
import { z } from "zod";

/* ---------- weather (Open-Meteo: free, no API key) ---------- */

export const getWeather = tool({
  description: "Get the current weather for a city.",
  inputSchema: z.object({
    city: z.string().describe("City name, e.g. 'London'"),
  }),
  execute: async ({ city }) => {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    ).then((r) => r.json());

    const place = geo?.results?.[0];
    if (!place) return { error: `Could not find a city called "${city}".` };

    const wx = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,wind_speed_10m,weather_code`
    ).then((r) => r.json());

    return {
      city: place.name,
      country: place.country,
      temperatureC: wx.current?.temperature_2m,
      windKmh: wx.current?.wind_speed_10m,
      weatherCode: wx.current?.weather_code,
    };
  },
});

/* ---------- calculator (small safe parser, no eval) ---------- */

function evaluate(expr: string): number {
  const tokens = expr.match(/\d+\.?\d*|[()+\-*/^%]/g);
  if (!tokens || tokens.join("") !== expr.replace(/\s+/g, "")) {
    throw new Error("Unsupported characters in expression");
  }
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function primary(): number {
    const t = next();
    if (t === "(") {
      const v = addSub();
      if (next() !== ")") throw new Error("Missing )");
      return v;
    }
    if (t === "-") return -primary();
    if (t === "+") return primary();
    const n = Number(t);
    if (Number.isNaN(n)) throw new Error("Unexpected token");
    return n;
  }
  function power(): number {
    const base = primary();
    if (peek() === "^") {
      next();
      return Math.pow(base, power());
    }
    return base;
  }
  function mulDiv(): number {
    let v = power();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = next();
      const r = power();
      v = op === "*" ? v * r : op === "/" ? v / r : v % r;
    }
    return v;
  }
  function addSub(): number {
    let v = mulDiv();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const r = mulDiv();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }

  const result = addSub();
  if (pos !== tokens.length) throw new Error("Unexpected trailing input");
  return result;
}

export const calculator = tool({
  description:
    "Evaluate a math expression using + - * / % ^ and parentheses. Use this for any arithmetic instead of computing it yourself.",
  inputSchema: z.object({
    expression: z.string().describe("e.g. '(12.5 * 4) + 3^2'"),
  }),
  execute: async ({ expression }) => {
    try {
      return { expression, result: evaluate(expression) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});

/* ---------- current time ---------- */

export const getCurrentTime = tool({
  description: "Get the current date and time in a given IANA time zone.",
  inputSchema: z.object({
    timeZone: z.string().describe("IANA zone, e.g. 'Europe/London'"),
  }),
  execute: async ({ timeZone }) => {
    try {
      return {
        timeZone,
        now: new Date().toLocaleString("en-GB", { timeZone, dateStyle: "full", timeStyle: "medium" }),
      };
    } catch {
      return { error: `Unknown time zone "${timeZone}".` };
    }
  },
});

export const tools = { getWeather, calculator, getCurrentTime };
