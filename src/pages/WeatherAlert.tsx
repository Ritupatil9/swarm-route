import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

type AQIData = {
  aqi: number;
  category: string;
  pm25?: number;
  pm10?: number;
};

const mockAQI = (): AQIData => ({ aqi: 72, category: "Moderate", pm25: 18, pm10: 35 });

const WeatherAlert = () => {
  const [data, setData] = useState<AQIData | null>(null);

  useEffect(() => {
    // Placeholder: in future, call a real AQI API
    setData(mockAQI());
  }, []);

  const refresh = () => {
    setData(mockAQI());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Air Quality & Forecast</h2>

        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Current AQI</div>
              <div className="text-3xl font-bold">{data ? data.aqi : "--"}</div>
              <div className="text-sm mt-1">{data ? data.category : "--"}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">PM2.5</div>
              <div className="font-medium">{data?.pm25 ?? "--"} µg/m³</div>
              <div className="text-sm text-muted-foreground mt-2">PM10</div>
              <div className="font-medium">{data?.pm10 ?? "--"} µg/m³</div>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={refresh}>Refresh</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-medium mb-2">Forecast (next 24h)</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Now — AQI: {data?.aqi ?? "--"} ({data?.category ?? "--"})</li>
            <li>+3 hours — AQI: {data ? data.aqi + 5 : "--"} (Moderate)</li>
            <li>+6 hours — AQI: {data ? data.aqi + 10 : "--"} (Unhealthy for Sensitive Groups)</li>
            <li>+12 hours — AQI: {data ? Math.max(20, data.aqi - 15) : "--"} (Good/Moderate)</li>
          </ul>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default WeatherAlert;
