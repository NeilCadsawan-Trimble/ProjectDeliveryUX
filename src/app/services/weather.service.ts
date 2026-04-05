import { Injectable, inject } from '@angular/core';
import { DataStoreService } from '../data/data-store.service';
import type { ProjectWeather, WeatherCondition, WeatherForecast } from '../data/dashboard-data.types';

interface OWMWeatherEntry {
  id: number;
  main: string;
  description: string;
}

interface OWMCurrentResponse {
  main: { temp: number; feels_like: number; humidity: number };
  weather: OWMWeatherEntry[];
  wind: { speed: number; deg: number };
  uvi?: number;
}

interface OWMForecastItem {
  dt: number;
  dt_txt: string;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: OWMWeatherEntry[];
  wind: { speed: number; deg?: number };
  pop: number;
}

interface OWMForecastResponse {
  list: OWMForecastItem[];
}

interface CacheEntry {
  data: ProjectWeather;
  timestamp: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly dataStore = inject(DataStoreService);
  private readonly cache = new Map<string, CacheEntry>();
  private fetchInProgress = false;
  private lastSuccessTimestamp = 0;

  initialize(): void {
    if (this.fetchInProgress) return;
    if (this.lastSuccessTimestamp && Date.now() - this.lastSuccessTimestamp < CACHE_TTL_MS) return;
    this.fetchInProgress = true;
    this.fetchAllProjectWeather().finally(() => { this.fetchInProgress = false; });
  }

  private async fetchAllProjectWeather(): Promise<void> {
    const projects = this.dataStore.projects();
    const uniqueCities = new Map<string, { city: string; state: string; projectIds: number[] }>();

    for (const p of projects) {
      const key = `${p.city}:${p.state}`;
      const entry = uniqueCities.get(key);
      if (entry) {
        entry.projectIds.push(p.id);
      } else {
        uniqueCities.set(key, { city: p.city, state: p.state, projectIds: [p.id] });
      }
    }

    const locations = [...uniqueCities.values()];
    console.log(`[WeatherService] Fetching live weather for ${locations.length} cities...`);

    const results = await Promise.allSettled(
      locations.map(loc => this.fetchCityWeather(loc.city, loc.state))
    );

    let successCount = 0;
    let globalForecastSet = false;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const loc = locations[i];
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
        for (const projectId of loc.projectIds) {
          const pw: ProjectWeather = { ...result.value, projectId };
          this.dataStore.updateWeather(projectId, pw);
        }
        if (!globalForecastSet && result.value.forecast.length > 0) {
          this.dataStore.weatherForecast.set(result.value.forecast);
          globalForecastSet = true;
        }
      }
    }

    if (successCount > 0) {
      this.lastSuccessTimestamp = Date.now();
      console.log(`[WeatherService] Live weather updated for ${successCount}/${locations.length} cities`);
    } else {
      console.warn('[WeatherService] All weather API calls failed -- using seed data');
    }
  }

  private async fetchCityWeather(city: string, state: string): Promise<Omit<ProjectWeather, 'projectId'> | null> {
    const cacheKey = `${city}:${state}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`);
      if (!res.ok) {
        console.warn(`[WeatherService] API returned ${res.status} for ${city}, ${state}`);
        return null;
      }

      const json = await res.json() as { current: OWMCurrentResponse; forecast: OWMForecastResponse };
      const mapped = this.mapResponse(json.current, json.forecast, city, state);

      this.cache.set(cacheKey, { data: mapped as ProjectWeather, timestamp: Date.now() });
      return mapped;
    } catch (err) {
      console.warn(`[WeatherService] Fetch failed for ${city}, ${state}:`, err);
      return null;
    }
  }

  private mapResponse(
    current: OWMCurrentResponse,
    forecast: OWMForecastResponse,
    city: string,
    state: string,
  ): Omit<ProjectWeather, 'projectId'> {
    const condition = mapCondition(current.weather[0]?.id ?? 800);
    const windDir = degreesToCompass(current.wind.deg);

    const dailyMap = new Map<string, OWMForecastItem[]>();
    for (const item of forecast.list) {
      const dateKey = item.dt_txt.split(' ')[0];
      const arr = dailyMap.get(dateKey) ?? [];
      arr.push(item);
      dailyMap.set(dateKey, arr);
    }

    const today = new Date().toISOString().split('T')[0];
    const days: WeatherForecast[] = [];
    for (const [dateKey, items] of dailyMap) {
      if (dateKey < today) continue;
      if (days.length >= 7) break;

      const dt = new Date(dateKey + 'T12:00:00');
      const dayName = DAY_NAMES[dt.getDay()];
      const dateLabel = `${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}`;

      const highF = Math.round(Math.max(...items.map(i => i.main.temp_max)));
      const lowF = Math.round(Math.min(...items.map(i => i.main.temp_min)));
      const maxPop = Math.round(Math.max(...items.map(i => i.pop)) * 100);
      const maxWind = Math.round(Math.max(...items.map(i => i.wind.speed)));

      const worstWeatherId = items.reduce((worst, item) => {
        const id = item.weather[0]?.id ?? 800;
        return severityRank(id) > severityRank(worst) ? id : worst;
      }, 800);

      const dayCondition = mapCondition(worstWeatherId);
      const impact = computeWorkImpact(worstWeatherId, maxWind, maxPop);
      const note = buildNote(worstWeatherId, maxWind, maxPop);

      days.push({
        date: dateLabel,
        day: dayName,
        condition: dayCondition,
        highF,
        lowF,
        precipPct: maxPop,
        windMph: maxWind,
        workImpact: impact,
        note,
      });
    }

    return {
      city,
      state,
      current: {
        condition,
        tempF: Math.round(current.main.temp),
        feelsLikeF: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        windMph: Math.round(current.wind.speed),
        windDir,
        uvIndex: current.uvi ?? 0,
      },
      forecast: days,
    };
  }
}

function mapCondition(weatherId: number): WeatherCondition {
  if (weatherId >= 200 && weatherId < 300) return 'thunderstorm';
  if (weatherId >= 300 && weatherId < 400) return 'rain';
  if (weatherId >= 500 && weatherId < 600) return 'rain';
  if (weatherId >= 600 && weatherId < 700) return 'snow';
  if (weatherId >= 700 && weatherId < 800) return 'cloudy';
  if (weatherId === 800) return 'sunny';
  if (weatherId === 801) return 'partly-cloudy';
  return 'cloudy';
}

function severityRank(weatherId: number): number {
  if (weatherId >= 200 && weatherId < 300) return 5;
  if (weatherId >= 600 && weatherId < 700) return 4;
  if (weatherId >= 500 && weatherId < 600) return 3;
  if (weatherId >= 300 && weatherId < 400) return 2;
  if (weatherId >= 700 && weatherId < 800) return 1;
  return 0;
}

function computeWorkImpact(weatherId: number, windMph: number, precipPct: number): 'none' | 'minor' | 'major' {
  if (weatherId >= 200 && weatherId < 300) return 'major';
  if (weatherId >= 600 && weatherId < 700) return 'major';
  if (windMph >= 30) return 'major';
  if (weatherId >= 502 && weatherId < 600) return 'major';

  if (weatherId >= 500 && weatherId < 502) return 'minor';
  if (weatherId >= 300 && weatherId < 400) return 'minor';
  if (windMph >= 20) return 'minor';
  if (precipPct >= 60) return 'minor';
  if (weatherId >= 700 && weatherId < 800) return 'minor';

  return 'none';
}

function buildNote(weatherId: number, windMph: number, _precipPct: number): string {
  const parts: string[] = [];
  if (weatherId >= 200 && weatherId < 300) parts.push('Thunderstorm -- suspend outdoor work');
  else if (weatherId >= 600 && weatherId < 700) parts.push('Snow -- hazardous conditions');
  else if (weatherId >= 502 && weatherId < 600) parts.push('Heavy rain -- may delay exterior work');
  else if (weatherId >= 500 && weatherId < 502) parts.push('Light rain expected');
  else if (weatherId >= 300 && weatherId < 400) parts.push('Drizzle expected');

  if (windMph >= 30) parts.push('High winds -- crane operations restricted');
  else if (windMph >= 20) parts.push('Moderate winds -- monitor conditions');

  return parts.join('. ');
}

function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}
