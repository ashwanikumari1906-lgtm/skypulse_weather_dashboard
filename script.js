/**
 * SkyPulse Weather Monitoring Dashboard
 * script.js - Real-Time Weather Application powered by Open-Meteo APIs
 * 
 * Features:
 * - 100% Free Live Weather Data: Uses Open-Meteo Geocoding & Forecast APIs (No API key needed)
 * - Real temperature, feels-like, humidity, wind speed & direction, pressure, UV index, and high/low
 * - Real 5-day daily forecast and 24-hour hourly outlook
 * - Search by city name with support for Delhi, London, Tokyo, Mumbai, and all cities worldwide
 * - Fast HTML5 Geolocation support ("My Location" GPS coordinates)
 * - Celsius (°C) and Fahrenheit (°F) conversion toggle
 * - Dynamic theme switching based on live weather conditions
 * - Friendly error handling for invalid cities and network connectivity issues
 * - Clearly labeled Demo Mode option for offline simulation (never disguised as real data)
 */

// =============================================================================
// 1. Application State & Local Preferences
// =============================================================================

const APP_STATE = {
  currentCity: localStorage.getItem('skypulse_last_city') || 'Delhi',
  currentUnit: localStorage.getItem('skypulse_unit') || 'C', // 'C' or 'F'
  dataMode: localStorage.getItem('skypulse_data_mode') || 'real', // 'real' or 'demo'
  apiKey: localStorage.getItem('skypulse_api_key') || '',
  currentWeatherData: null,
  isLiveAPI: true
};

// =============================================================================
// 2. High-Quality SVG Weather Icons (Fully self-contained, no external fonts)
// =============================================================================

const WEATHER_ICONS = {
  sunny: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </radialGradient>
      </defs>
      <g stroke="#f59e0b" stroke-width="3" stroke-linecap="round">
        <line x1="32" y1="6" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="58" />
        <line x1="6" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="58" y2="32" />
        <line x1="13.6" y1="13.6" x2="19.3" y2="19.3" />
        <line x1="44.7" y1="44.7" x2="50.4" y2="50.4" />
        <line x1="13.6" y1="50.4" x2="19.3" y2="44.7" />
        <line x1="44.7" y1="19.3" x2="50.4" y2="13.6" />
      </g>
      <circle cx="32" cy="32" r="14" fill="url(#sunGrad)" />
    </svg>`,

  partlyCloudy: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <circle cx="24" cy="24" r="11" fill="#f59e0b" />
      <path d="M46 44H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.1A10 10 0 0 1 46 44z" fill="#94a3b8" opacity="0.95" />
      <path d="M44 42H22a8 8 0 0 1-1-15.9 12 12 0 0 1 22.8-3.3A8 8 0 0 1 44 42z" fill="#cbd5e1" />
    </svg>`,

  cloudy: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path d="M46 48H18a12 12 0 0 1-1.5-23.9 16 16 0 0 1 30.5-4.6A12 12 0 0 1 46 48z" fill="#64748b" />
      <path d="M48 44H22a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.1A10 10 0 0 1 48 44z" fill="#cbd5e1" />
    </svg>`,

  rainy: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path d="M46 38H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.1A10 10 0 0 1 46 38z" fill="#64748b" />
      <g stroke="#38bdf8" stroke-width="3" stroke-linecap="round">
        <line x1="22" y1="44" x2="19" y2="52" />
        <line x1="32" y1="44" x2="29" y2="52" />
        <line x1="42" y1="44" x2="39" y2="52" />
      </g>
    </svg>`,

  stormy: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path d="M46 36H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.1A10 10 0 0 1 46 36z" fill="#475569" />
      <polygon points="32,36 24,48 31,48 27,60 39,46 33,46" fill="#facc15" />
    </svg>`,

  snowy: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path d="M46 38H20a10 10 0 0 1-1.3-19.9 14 14 0 0 1 26.6-4.1A10 10 0 0 1 46 38z" fill="#94a3b8" />
      <g fill="#e0f2fe">
        <circle cx="22" cy="48" r="2.5" />
        <circle cx="32" cy="52" r="2.5" />
        <circle cx="42" cy="47" r="2.5" />
      </g>
    </svg>`,

  nightClear: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="moonGrad" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </radialGradient>
      </defs>
      <path d="M38 12a18 18 0 1 0 14 29.5A18 18 0 0 1 38 12z" fill="url(#moonGrad)" />
      <circle cx="16" cy="18" r="1.5" fill="#fef08a" />
      <circle cx="48" cy="18" r="1.5" fill="#fef08a" />
    </svg>`,

  foggy: `
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <path d="M44 30H20a8 8 0 0 1-1-15.9 12 12 0 0 1 22.8-3.3A8 8 0 0 1 44 30z" fill="#94a3b8" opacity="0.75" />
      <g stroke="#cbd5e1" stroke-width="3" stroke-linecap="round">
        <line x1="16" y1="38" x2="48" y2="38" />
        <line x1="20" y1="45" x2="44" y2="45" />
        <line x1="14" y1="52" x2="50" y2="52" />
      </g>
    </svg>`
};

// =============================================================================
// 3. WMO Weather Interpretation & Condition Mapping
// =============================================================================

/**
 * Maps standard World Meteorological Organization (WMO) codes to human labels and icons
 */
function parseWmoWeatherCode(code, isDay = 1) {
  switch (Number(code)) {
    case 0:
      return isDay
        ? { condition: 'Clear Sky', description: 'Sunny and completely cloudless', code: 'sunny', theme: 'theme-sunny' }
        : { condition: 'Clear Sky', description: 'Clear starlit night', code: 'nightClear', theme: 'theme-night' };
    case 1:
      return isDay
        ? { condition: 'Mainly Clear', description: 'Mostly clear with minimal clouds', code: 'sunny', theme: 'theme-sunny' }
        : { condition: 'Mainly Clear', description: 'Mostly clear night sky', code: 'nightClear', theme: 'theme-night' };
    case 2:
      return { condition: 'Partly Cloudy', description: 'Scattered clouds with periods of sunshine', code: 'partlyCloudy', theme: 'theme-cloudy' };
    case 3:
      return { condition: 'Overcast', description: 'Dense cloud coverage', code: 'cloudy', theme: 'theme-cloudy' };
    case 45:
    case 48:
      return { condition: 'Foggy', description: 'Low visibility due to fog and mist', code: 'foggy', theme: 'theme-cloudy' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', description: 'Light fine drizzle', code: 'rainy', theme: 'theme-rainy' };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', description: 'Chilly freezing drizzle', code: 'snowy', theme: 'theme-snowy' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', description: 'Continuous rain showers', code: 'rainy', theme: 'theme-rainy' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', description: 'Freezing rain with icy conditions', code: 'snowy', theme: 'theme-snowy' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snowfall', description: 'Crisp snowfall and flurries', code: 'snowy', theme: 'theme-snowy' };
    case 77:
      return { condition: 'Snow Grains', description: 'Light snow grains', code: 'snowy', theme: 'theme-snowy' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', description: 'Passing moderate to heavy showers', code: 'rainy', theme: 'theme-rainy' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', description: 'Intermittent snow showers', code: 'snowy', theme: 'theme-snowy' };
    case 95:
      return { condition: 'Thunderstorm', description: 'Thunderstorm with lightning and rain', code: 'stormy', theme: 'theme-stormy' };
    case 96:
    case 99:
      return { condition: 'Severe Thunderstorm', description: 'Severe thunderstorm with hail', code: 'stormy', theme: 'theme-stormy' };
    default:
      return { condition: 'Partly Cloudy', description: 'Fair conditions with variable clouds', code: 'partlyCloudy', theme: 'theme-cloudy' };
  }
}

function degToCompass(deg) {
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[val % 16];
}

function formatIsoTimeTo12Hour(isoStr) {
  if (!isoStr) return '06:00 AM';
  const parts = isoStr.split('T');
  if (parts.length < 2) return isoStr;
  const [hStr, mStr] = parts[1].split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${mStr} ${ampm}`;
}

function generateWeatherTip(conditionCode, tempC) {
  if (conditionCode === 'rainy') return 'Don\'t forget your umbrella today!';
  if (conditionCode === 'stormy') return 'Thunderstorms expected: stay indoors safely.';
  if (conditionCode === 'snowy') return 'Freezing temperatures outside: wear warm layers.';
  if (conditionCode === 'sunny') {
    return tempC > 30 ? 'High heat: stay hydrated and seek shade!' : 'Pleasant sunny weather, great for a walk outdoors!';
  }
  return 'Comfortable weather ahead, enjoy your day!';
}

// =============================================================================
// 4. Real Weather API Integration (Open-Meteo Geocoding & Forecast)
// =============================================================================

/**
 * Searches city coordinates using the free Open-Meteo Geocoding API
 */
async function geocodeCity(cityName) {
  const trimmed = cityName.trim();
  if (!trimmed) {
    throw new Error('Please enter a city name to search.');
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
  
  let response;
  try {
    response = await fetch(url);
  } catch (netErr) {
    throw new Error('Weather service unavailable. Please check your internet connection.');
  }

  if (!response.ok) {
    throw new Error(`Geocoding service returned status ${response.status}.`);
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Could not find any city matching "${trimmed}". Please check the spelling.`);
  }

  return data.results[0];
}

/**
 * Fetches real weather and 5-day forecast from the free Open-Meteo Forecast API
 */
async function fetchRealWeatherFromOpenMeteo(geoInfo) {
  const { latitude, longitude, name, country, country_code } = geoInfo;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&hourly=temperature_2m,weather_code,relative_humidity_2m,precipitation_probability&timezone=auto`;

  let response;
  try {
    response = await fetch(url);
  } catch (netErr) {
    throw new Error('Weather service unavailable. Please check your internet connection.');
  }

  if (!response.ok) {
    throw new Error(`Weather service returned status ${response.status}.`);
  }

  const raw = await response.json();
  const current = raw.current;
  const daily = raw.daily;
  const hourly = raw.hourly;

  const wCode = current.weather_code;
  const parsedWeather = parseWmoWeatherCode(wCode, current.is_day);

  // Real 5-day daily forecast (Index 1 to 5)
  const forecast = [];
  const daysCount = Math.min(6, daily.time.length);
  for (let i = 1; i < daysCount; i++) {
    const fDateStr = daily.time[i];
    const fParsed = parseWmoWeatherCode(daily.weather_code[i], 1);
    forecast.push({
      dateStr: fDateStr,
      dayOffset: i,
      condition: fParsed.condition,
      conditionCode: fParsed.code,
      minC: Math.round(daily.temperature_2m_min[i]),
      maxC: Math.round(daily.temperature_2m_max[i])
    });
  }

  // Real 24-hour hourly forecast (Next 12 intervals)
  const hourlyCards = [];
  let startIdx = 0;
  if (hourly && hourly.time && hourly.time.length > 0) {
    const currentTimeStr = current.time ? current.time.slice(0, 13) : '';
    const foundIdx = hourly.time.findIndex(t => t.startsWith(currentTimeStr));
    if (foundIdx >= 0) startIdx = foundIdx;

    for (let h = 0; h < 12 && (startIdx + h) < hourly.time.length; h++) {
      const idx = startIdx + h;
      const tIso = hourly.time[idx];
      const hourPart = parseInt(tIso.split('T')[1].split(':')[0], 10);
      const isDayHour = hourPart >= 6 && hourPart < 19 ? 1 : 0;
      const hParsed = parseWmoWeatherCode(hourly.weather_code[idx], isDayHour);

      hourlyCards.push({
        timeLabel: h === 0 ? 'Now' : `${hourPart % 12 || 12} ${hourPart >= 12 ? 'PM' : 'AM'}`,
        tempC: Math.round(hourly.temperature_2m[idx]),
        conditionCode: hParsed.code,
        pop: hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0
      });
    }
  }

  return {
    city: name,
    country: country_code || country || 'LIVE',
    fullCountry: country || '',
    latitude,
    longitude,
    tempC: Math.round(current.temperature_2m),
    feelsLikeC: Math.round(current.apparent_temperature),
    minTempC: Math.round(daily.temperature_2m_min[0]),
    maxTempC: Math.round(daily.temperature_2m_max[0]),
    condition: parsedWeather.condition,
    description: parsedWeather.description,
    conditionCode: parsedWeather.code,
    theme: parsedWeather.theme,
    humidity: current.relative_humidity_2m,
    windSpeedKmh: Math.round(current.wind_speed_10m),
    windDirectionDeg: current.wind_direction_10m,
    windDirectionText: degToCompass(current.wind_direction_10m),
    pressure: Math.round(current.surface_pressure),
    visibilityKm: 10.0,
    uvIndex: Math.round(daily.uv_index_max ? daily.uv_index_max[0] : 5),
    sunrise: formatIsoTimeTo12Hour(daily.sunrise[0]),
    sunset: formatIsoTimeTo12Hour(daily.sunset[0]),
    tip: generateWeatherTip(parsedWeather.code, current.temperature_2m),
    forecast,
    hourlyCards
  };
}

// =============================================================================
// 5. Offline Demo Simulation Engine (Strictly labeled as Demo Mode)
// =============================================================================

const DEMO_CATALOG = {
  'delhi': {
    city: 'Delhi',
    country: 'IN',
    tempC: 30,
    feelsLikeC: 33,
    minTempC: 22,
    maxTempC: 33,
    condition: 'Clear Sky',
    description: 'Warm and sunny with light haze',
    conditionCode: 'sunny',
    theme: 'theme-sunny',
    humidity: 55,
    windSpeedKmh: 6,
    windDirectionDeg: 80,
    windDirectionText: 'E',
    pressure: 988,
    visibilityKm: 8.0,
    uvIndex: 7,
    sunrise: '06:21 AM',
    sunset: '05:53 PM',
    tip: 'Stay hydrated during warm afternoon hours.'
  },
  'mumbai': {
    city: 'Mumbai',
    country: 'IN',
    tempC: 31,
    feelsLikeC: 36,
    minTempC: 26,
    maxTempC: 33,
    condition: 'Partly Cloudy',
    description: 'Humid coastal breeze with soft clouds',
    conditionCode: 'partlyCloudy',
    theme: 'theme-cloudy',
    humidity: 75,
    windSpeedKmh: 12,
    windDirectionDeg: 270,
    windDirectionText: 'W',
    pressure: 1007,
    visibilityKm: 10.0,
    uvIndex: 8,
    sunrise: '06:32 AM',
    sunset: '06:15 PM',
    tip: 'Humid conditions: drink plenty of water.'
  },
  'london': {
    city: 'London',
    country: 'GB',
    tempC: 16,
    feelsLikeC: 15,
    minTempC: 11,
    maxTempC: 18,
    condition: 'Light Drizzle',
    description: 'Overcast skies with occasional light passing showers',
    conditionCode: 'rainy',
    theme: 'theme-rainy',
    humidity: 82,
    windSpeedKmh: 20,
    windDirectionDeg: 240,
    windDirectionText: 'SW',
    pressure: 1008,
    visibilityKm: 8.5,
    uvIndex: 3,
    sunrise: '06:38 AM',
    sunset: '07:28 PM',
    tip: 'Keep an umbrella handy, light drizzles expected.'
  },
  'tokyo': {
    city: 'Tokyo',
    country: 'JP',
    tempC: 24,
    feelsLikeC: 25,
    minTempC: 19,
    maxTempC: 28,
    condition: 'Partly Cloudy',
    description: 'Mild temperatures with soft clouds over Tokyo Bay',
    conditionCode: 'partlyCloudy',
    theme: 'theme-cloudy',
    humidity: 64,
    windSpeedKmh: 12,
    windDirectionDeg: 120,
    windDirectionText: 'SE',
    pressure: 1016,
    visibilityKm: 12.0,
    uvIndex: 6,
    sunrise: '05:35 AM',
    sunset: '06:18 PM',
    tip: 'Comfortable temperature for sightseeing and city exploration.'
  }
};

function generateDemoSimulation(cityName) {
  const norm = cityName.trim().toLowerCase();
  const base = DEMO_CATALOG[norm] || {
    city: cityName.charAt(0).toUpperCase() + cityName.slice(1),
    country: 'DEMO',
    tempC: 23,
    feelsLikeC: 24,
    minTempC: 18,
    maxTempC: 26,
    condition: 'Clear Sky',
    description: 'Simulated fair weather data for testing',
    conditionCode: 'sunny',
    theme: 'theme-sunny',
    humidity: 50,
    windSpeedKmh: 14,
    windDirectionDeg: 90,
    windDirectionText: 'E',
    pressure: 1013,
    visibilityKm: 10.0,
    uvIndex: 5,
    sunrise: '06:15 AM',
    sunset: '07:30 PM',
    tip: 'Demo mode active: displaying simulated forecast.'
  };

  const forecast = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  for (let i = 1; i <= 5; i++) {
    const fDate = new Date();
    fDate.setDate(today.getDate() + i);
    forecast.push({
      dateStr: fDate.toISOString().slice(0, 10),
      dayOffset: i,
      condition: i % 2 === 0 ? 'Partly Cloudy' : 'Clear Sky',
      conditionCode: i % 2 === 0 ? 'partlyCloudy' : 'sunny',
      minC: base.minTempC + (i % 3) - 1,
      maxC: base.maxTempC + (i % 2)
    });
  }

  const hourlyCards = [];
  const currentHour = new Date().getHours();
  for (let h = 0; h < 12; h++) {
    const hr = (currentHour + h * 2) % 24;
    hourlyCards.push({
      timeLabel: h === 0 ? 'Now' : `${hr % 12 || 12} ${hr >= 12 ? 'PM' : 'AM'}`,
      tempC: base.tempC + (h % 3) - 1,
      conditionCode: hr >= 6 && hr < 19 ? base.conditionCode : 'nightClear',
      pop: 10
    });
  }

  return {
    ...base,
    country: 'DEMO',
    forecast,
    hourlyCards
  };
}

// =============================================================================
// 6. Master Weather Fetcher Controller
// =============================================================================

async function fetchWeatherData(cityName) {
  const trimmed = cityName.trim();
  if (!trimmed) {
    throw new Error('Please enter a city name to search.');
  }

  // If user explicitly chose Demo Mode:
  if (APP_STATE.dataMode === 'demo') {
    await new Promise(r => setTimeout(r, 200));
    return { data: generateDemoSimulation(trimmed), isLive: false, source: 'Demo Mode (Simulated Data)' };
  }

  // Real Live Weather using Open-Meteo Geocoding & Forecast APIs:
  const geoResult = await geocodeCity(trimmed);
  const realWeather = await fetchRealWeatherFromOpenMeteo(geoResult);
  return { data: realWeather, isLive: true, source: 'Open-Meteo Live API' };
}

// =============================================================================
// 7. Unit Conversion Utilities
// =============================================================================

function convertTemp(tempC, unit) {
  if (unit === 'F') {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
}

// =============================================================================
// 8. DOM Elements Cache
// =============================================================================

const DOM = {
  dataSourceBadge: document.getElementById('dataSourceBadge'),
  dataSourceLabel: document.getElementById('dataSourceLabel'),
  unitCelsiusBtn: document.getElementById('unitCelsius'),
  unitFahrenheitBtn: document.getElementById('unitFahrenheit'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),

  searchForm: document.getElementById('searchForm'),
  cityInput: document.getElementById('cityInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  geoBtn: document.getElementById('geoBtn'),
  quickPills: document.getElementById('quickPills'),

  toastMessage: document.getElementById('toastMessage'),
  toastText: document.getElementById('toastText'),
  toastCloseBtn: document.getElementById('toastCloseBtn'),
  loadingIndicator: document.getElementById('loadingIndicator'),
  loadingText: document.getElementById('loadingText'),

  heroCard: document.getElementById('heroCard'),
  cityName: document.getElementById('cityName'),
  countryBadge: document.getElementById('countryBadge'),
  currentDateTime: document.getElementById('currentDateTime'),
  conditionPill: document.getElementById('conditionPill'),
  conditionPillText: document.getElementById('conditionPillText'),
  currentTemp: document.getElementById('currentTemp'),
  tempUnitSymbol: document.getElementById('tempUnitSymbol'),
  feelsLikeTemp: document.getElementById('feelsLikeTemp'),
  maxTemp: document.getElementById('maxTemp'),
  minTemp: document.getElementById('minTemp'),
  weatherIconContainer: document.getElementById('weatherIconContainer'),
  weatherDescription: document.getElementById('weatherDescription'),
  weatherTipText: document.getElementById('weatherTipText'),
  lastUpdatedTime: document.getElementById('lastUpdatedTime'),

  humidityValue: document.getElementById('humidityValue'),
  humidityProgress: document.getElementById('humidityProgress'),
  humidityStatus: document.getElementById('humidityStatus'),
  windSpeedValue: document.getElementById('windSpeedValue'),
  windSpeedUnit: document.getElementById('windSpeedUnit'),
  windDirectionArrow: document.getElementById('windDirectionArrow'),
  windDirectionText: document.getElementById('windDirectionText'),
  pressureValue: document.getElementById('pressureValue'),
  visibilityValue: document.getElementById('visibilityValue'),
  visibilityUnit: document.getElementById('visibilityUnit'),
  uvIndexValue: document.getElementById('uvIndexValue'),
  uvProgress: document.getElementById('uvProgress'),
  uvStatus: document.getElementById('uvStatus'),
  sunriseTime: document.getElementById('sunriseTime'),
  sunsetTime: document.getElementById('sunsetTime'),

  hourlyList: document.getElementById('hourlyList'),
  forecastList: document.getElementById('forecastList'),

  footerDemoBtn: document.getElementById('footerDemoBtn'),
  footerApiBtn: document.getElementById('footerApiBtn'),

  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  clearApiKeyBtn: document.getElementById('clearApiKeyBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  modeReal: document.getElementById('modeReal'),
  modeDemo: document.getElementById('modeDemo')
};

let toastTimer = null;

function showToast(message, duration = 4500) {
  if (toastTimer) clearTimeout(toastTimer);
  DOM.toastText.textContent = message;
  DOM.toastMessage.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    DOM.toastMessage.classList.add('hidden');
  }, duration);
}

function hideToast() {
  if (toastTimer) clearTimeout(toastTimer);
  DOM.toastMessage.classList.add('hidden');
}

function showLoading(msg = 'Fetching real-time weather...') {
  DOM.loadingText.textContent = msg;
  DOM.loadingIndicator.classList.remove('hidden');
}

function hideLoading() {
  DOM.loadingIndicator.classList.add('hidden');
}

// =============================================================================
// 9. Dashboard UI Rendering
// =============================================================================

function renderDashboard() {
  const data = APP_STATE.currentWeatherData;
  if (!data) return;

  const unit = APP_STATE.currentUnit;

  // 1. Theme application
  document.body.className = data.theme || 'theme-sunny';

  // 2. Status Badge: Real vs Demo Mode
  const dot = DOM.dataSourceBadge.querySelector('.status-dot');
  if (APP_STATE.isLiveAPI) {
    dot.className = 'status-dot live';
    DOM.dataSourceLabel.textContent = 'Live Weather';
    DOM.dataSourceBadge.title = 'Real live weather data powered by Open-Meteo';
  } else {
    dot.className = 'status-dot demo';
    DOM.dataSourceLabel.textContent = 'Demo Mode (Simulated)';
    DOM.dataSourceBadge.title = 'Simulated data mode. Click to enable real weather.';
  }

  // 3. Location, date & time
  DOM.cityName.textContent = data.city;
  DOM.countryBadge.textContent = data.country || 'REAL';
  DOM.conditionPillText.textContent = data.condition;

  const now = new Date();
  const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  DOM.currentDateTime.textContent = now.toLocaleDateString(undefined, dateOptions);
  DOM.lastUpdatedTime.textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  // 4. Hero Temperature & Weather Icon
  DOM.currentTemp.textContent = convertTemp(data.tempC, unit);
  DOM.tempUnitSymbol.textContent = unit;
  DOM.feelsLikeTemp.textContent = `${convertTemp(data.feelsLikeC, unit)}°${unit}`;
  DOM.maxTemp.textContent = `${convertTemp(data.maxTempC, unit)}°`;
  DOM.minTemp.textContent = `${convertTemp(data.minTempC, unit)}°`;

  const heroSvg = WEATHER_ICONS[data.conditionCode] || WEATHER_ICONS.partlyCloudy;
  DOM.weatherIconContainer.innerHTML = heroSvg;
  DOM.weatherDescription.textContent = data.description;
  DOM.weatherTipText.textContent = data.tip;

  // 5. Highlights Grid
  // Humidity
  DOM.humidityValue.textContent = data.humidity;
  DOM.humidityProgress.style.width = `${Math.min(100, data.humidity)}%`;
  if (data.humidity < 40) DOM.humidityStatus.textContent = 'Dry & crisp air';
  else if (data.humidity <= 65) DOM.humidityStatus.textContent = 'Comfortable humidity';
  else DOM.humidityStatus.textContent = 'High humidity & moist';

  // Wind Speed & Direction
  if (unit === 'F') {
    DOM.windSpeedValue.textContent = Math.round(data.windSpeedKmh * 0.621371);
    DOM.windSpeedUnit.textContent = 'mph';
  } else {
    DOM.windSpeedValue.textContent = data.windSpeedKmh;
    DOM.windSpeedUnit.textContent = 'km/h';
  }
  DOM.windDirectionText.textContent = `${data.windDirectionText} (${data.windDirectionDeg}°)`;
  DOM.windDirectionArrow.style.transform = `rotate(${data.windDirectionDeg}deg)`;

  // Pressure
  DOM.pressureValue.textContent = data.pressure;

  // Visibility
  if (unit === 'F') {
    DOM.visibilityValue.textContent = (data.visibilityKm * 0.621371).toFixed(1);
    DOM.visibilityUnit.textContent = 'mi';
  } else {
    DOM.visibilityValue.textContent = Number(data.visibilityKm).toFixed(1);
    DOM.visibilityUnit.textContent = 'km';
  }

  // UV Index
  DOM.uvIndexValue.textContent = data.uvIndex;
  DOM.uvProgress.style.width = `${Math.min(100, (data.uvIndex / 11) * 100)}%`;
  if (data.uvIndex <= 2) DOM.uvStatus.textContent = 'Low (Safe)';
  else if (data.uvIndex <= 5) DOM.uvStatus.textContent = 'Moderate';
  else if (data.uvIndex <= 7) DOM.uvStatus.textContent = 'High (Sunscreen recommended)';
  else DOM.uvStatus.textContent = 'Very High (Caution outdoors)';

  // Sunrise & Sunset
  DOM.sunriseTime.textContent = data.sunrise;
  DOM.sunsetTime.textContent = data.sunset;

  // 6. Real Hourly Outlook
  renderHourlyList(data);

  // 7. Real 5-Day Outlook
  renderFiveDayForecast(data);
}

function renderHourlyList(data) {
  DOM.hourlyList.innerHTML = '';
  const unit = APP_STATE.currentUnit;
  const cards = data.hourlyCards || [];

  cards.forEach((item, idx) => {
    const iconSvg = WEATHER_ICONS[item.conditionCode] || WEATHER_ICONS.partlyCloudy;
    const cardEl = document.createElement('div');
    cardEl.className = `hourly-item ${idx === 0 ? 'active-hour' : ''}`;
    cardEl.innerHTML = `
      <span class="hourly-time">${item.timeLabel}</span>
      <div class="hourly-icon">${iconSvg}</div>
      <span class="hourly-temp">${convertTemp(item.tempC, unit)}°</span>
      <span class="hourly-pop">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
        ${item.pop}%
      </span>
    `;
    DOM.hourlyList.appendChild(cardEl);
  });
}

function renderFiveDayForecast(data) {
  DOM.forecastList.innerHTML = '';
  const unit = APP_STATE.currentUnit;
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast = data.forecast || [];

  let globalMin = Infinity;
  let globalMax = -Infinity;
  forecast.forEach(f => {
    if (f.minC < globalMin) globalMin = f.minC;
    if (f.maxC > globalMax) globalMax = f.maxC;
  });
  const tempSpan = Math.max(1, globalMax - globalMin);

  forecast.forEach((f, index) => {
    const fDate = new Date(f.dateStr + 'T00:00:00');
    const dayName = index === 0 ? 'Tomorrow' : daysOfWeek[fDate.getDay()];
    const dateFormatted = fDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const fIcon = WEATHER_ICONS[f.conditionCode] || WEATHER_ICONS.partlyCloudy;

    const barLeft = Math.max(0, ((f.minC - globalMin) / tempSpan) * 100);
    const barWidth = Math.max(15, ((f.maxC - f.minC) / tempSpan) * 100);

    const row = document.createElement('div');
    row.className = 'forecast-row';
    row.innerHTML = `
      <div class="forecast-day-group">
        <span class="forecast-day-name">${dayName}</span>
        <span class="forecast-date">${dateFormatted}</span>
      </div>
      <div class="forecast-icon-wrap">${fIcon}</div>
      <div class="forecast-condition-desc">${f.condition}</div>
      <div class="forecast-range-wrap">
        <span class="forecast-min-temp">${convertTemp(f.minC, unit)}°</span>
        <div class="forecast-bar-track">
          <div class="forecast-bar-fill" style="left: ${barLeft}%; width: ${barWidth}%;"></div>
        </div>
        <span class="forecast-max-temp">${convertTemp(f.maxC, unit)}°</span>
      </div>
    `;
    DOM.forecastList.appendChild(row);
  });
}

// =============================================================================
// 10. Core Application User Actions
// =============================================================================

async function loadCityWeather(cityName) {
  showLoading(`Searching real weather for "${cityName}"...`);
  hideToast();

  try {
    const result = await fetchWeatherData(cityName);
    APP_STATE.currentWeatherData = result.data;
    APP_STATE.isLiveAPI = result.isLive;
    APP_STATE.currentCity = result.data.city;
    localStorage.setItem('skypulse_last_city', result.data.city);

    renderDashboard();
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast(error.message || `Unable to load weather for "${cityName}".`);
  }
}

function handleGeolocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.');
    return;
  }

  showLoading('Detecting GPS location...');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const realWeather = await fetchRealWeatherFromOpenMeteo({
          latitude,
          longitude,
          name: 'My Location',
          country: 'GPS',
          country_code: 'GPS'
        });

        APP_STATE.currentWeatherData = realWeather;
        APP_STATE.isLiveAPI = true;
        APP_STATE.currentCity = 'My Location';
        renderDashboard();
        hideLoading();
        showToast('Real weather loaded for your current location!');
      } catch (err) {
        hideLoading();
        showToast('Could not fetch weather for current location.');
      }
    },
    (geoError) => {
      hideLoading();
      let msg = 'Could not access your location.';
      if (geoError.code === geoError.PERMISSION_DENIED) {
        msg = 'Location permission was denied. Try searching a city manually.';
      }
      showToast(msg);
    },
    { timeout: 8000 }
  );
}

function setTemperatureUnit(unit) {
  if (APP_STATE.currentUnit === unit) return;
  APP_STATE.currentUnit = unit;
  localStorage.setItem('skypulse_unit', unit);

  if (unit === 'C') {
    DOM.unitCelsiusBtn.classList.add('active');
    DOM.unitCelsiusBtn.setAttribute('aria-checked', 'true');
    DOM.unitFahrenheitBtn.classList.remove('active');
    DOM.unitFahrenheitBtn.setAttribute('aria-checked', 'false');
  } else {
    DOM.unitFahrenheitBtn.classList.add('active');
    DOM.unitFahrenheitBtn.setAttribute('aria-checked', 'true');
    DOM.unitCelsiusBtn.classList.remove('active');
    DOM.unitCelsiusBtn.setAttribute('aria-checked', 'false');
  }

  renderDashboard();
}

// =============================================================================
// 11. Event Listeners & Modal Wire-up
// =============================================================================

function setupEventListeners() {
  // Search Form Submit
  DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = DOM.cityInput.value.trim();
    if (query) {
      loadCityWeather(query);
    } else {
      showToast('Please type a city name to search.');
    }
  });

  // Clear Search Input Button
  DOM.cityInput.addEventListener('input', () => {
    DOM.clearSearchBtn.style.display = DOM.cityInput.value.length > 0 ? 'block' : 'none';
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.cityInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    DOM.cityInput.focus();
  });

  // Geolocation Button
  DOM.geoBtn.addEventListener('click', handleGeolocation);

  // Quick City Chips (Delhi, Mumbai, London, Tokyo, New York, Paris)
  DOM.quickPills.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip && chip.dataset.city) {
      DOM.cityInput.value = chip.dataset.city;
      DOM.clearSearchBtn.style.display = 'block';
      loadCityWeather(chip.dataset.city);
    }
  });

  // Temperature Unit Toggles
  DOM.unitCelsiusBtn.addEventListener('click', () => setTemperatureUnit('C'));
  DOM.unitFahrenheitBtn.addEventListener('click', () => setTemperatureUnit('F'));

  // Toast Close
  DOM.toastCloseBtn.addEventListener('click', hideToast);

  // Settings Modal Controls
  DOM.openSettingsBtn.addEventListener('click', openSettingsModal);
  DOM.dataSourceBadge.addEventListener('click', openSettingsModal);
  DOM.footerApiBtn.addEventListener('click', openSettingsModal);
  DOM.closeSettingsBtn.addEventListener('click', closeSettingsModal);
  DOM.cancelModalBtn.addEventListener('click', closeSettingsModal);

  DOM.settingsModal.addEventListener('click', (e) => {
    if (e.target === DOM.settingsModal) closeSettingsModal();
  });

  DOM.saveSettingsBtn.addEventListener('click', () => {
    const mode = DOM.modeDemo.checked ? 'demo' : 'real';
    const key = DOM.apiKeyInput.value.trim();

    APP_STATE.dataMode = mode;
    APP_STATE.apiKey = key;
    localStorage.setItem('skypulse_data_mode', mode);
    localStorage.setItem('skypulse_api_key', key);

    closeSettingsModal();
    showToast(mode === 'demo' ? 'Switched to Demo Mode (Simulated Data).' : 'Switched to Real Weather (Open-Meteo).');
    loadCityWeather(APP_STATE.currentCity);
  });

  DOM.clearApiKeyBtn.addEventListener('click', () => {
    DOM.apiKeyInput.value = '';
    APP_STATE.apiKey = '';
    localStorage.removeItem('skypulse_api_key');
    showToast('Cleared custom key. Using free Open-Meteo API.');
  });

  DOM.footerDemoBtn.addEventListener('click', () => {
    const nextMode = APP_STATE.dataMode === 'real' ? 'demo' : 'real';
    APP_STATE.dataMode = nextMode;
    localStorage.setItem('skypulse_data_mode', nextMode);
    showToast(nextMode === 'demo' ? 'Switched to Demo Mode (Simulated Data).' : 'Switched to Real Weather (Open-Meteo).');
    loadCityWeather(APP_STATE.currentCity);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !DOM.settingsModal.classList.contains('hidden')) {
      closeSettingsModal();
    }
  });
}

function openSettingsModal() {
  DOM.apiKeyInput.value = APP_STATE.apiKey || '';
  if (APP_STATE.dataMode === 'demo') {
    DOM.modeDemo.checked = true;
  } else {
    DOM.modeReal.checked = true;
  }
  DOM.settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  DOM.settingsModal.classList.add('hidden');
}

// =============================================================================
// 12. Application Initialization
// =============================================================================

function initApp() {
  if (APP_STATE.currentUnit === 'F') {
    DOM.unitFahrenheitBtn.classList.add('active');
    DOM.unitCelsiusBtn.classList.remove('active');
  } else {
    DOM.unitCelsiusBtn.classList.add('active');
    DOM.unitFahrenheitBtn.classList.remove('active');
  }

  setupEventListeners();

  // Load initial city (Default: Delhi)
  loadCityWeather(APP_STATE.currentCity);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
