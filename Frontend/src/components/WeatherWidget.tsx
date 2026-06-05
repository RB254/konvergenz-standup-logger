import { useEffect, useState } from "react";
import { Cloud, CloudRain, Snowflake, Sun, CloudSun, CloudFog, Zap } from "lucide-react";

interface WeatherData {
  temp: number;
  code: number;
  label: string;
}

function describeCode(code: number): { label: string; Icon: typeof Sun } {
  if (code === 0) return { label: "Clear sky", Icon: Sun };
  if ([1, 2].includes(code)) return { label: "Mostly clear", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if ([45, 48].includes(code)) return { label: "Foggy", Icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", Icon: CloudRain };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rain", Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", Icon: Snowflake };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", Icon: Zap };
  return { label: "Unknown", Icon: Cloud };
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=-1.286389&longitude=36.817223&current_weather=true";
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("weather failed");
        return r.json();
      })
      .then((j) => {
        if (!alive) return;
        const cw = j?.current_weather;
        if (!cw) throw new Error("no current_weather");
        const { label } = describeCode(cw.weathercode);
        setData({ temp: Math.round(cw.temperature), code: cw.weathercode, label });
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const base =
    "flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1.5 text-xs text-white";

  if (error) {
    return (
      <div className={base}>
        <Cloud className="h-4 w-4" />
        Weather unavailable
      </div>
    );
  }

  if (!data) {
    return (
      <div className={base}>
        <span className="h-3 w-3 animate-pulse rounded-full bg-white/40" />
        Loading weather…
      </div>
    );
  }

  const { Icon, label } = describeCode(data.code);
  return (
    <div className={base}>
      <Icon className="h-4 w-4" />
      <span className="font-semibold">Nairobi</span>
      <span>{data.temp}°C</span>
      <span className="hidden text-white/70 sm:inline">· {label}</span>
    </div>
  );
}
