// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  const data = await res.json();

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气 — 多源轮换，一个失效自动切换下一个
 */

// ── 小米天气码 → 中文（彩云天气编码） ──
const XIAOMI_WEATHER_MAP = {
  0: "晴", 1: "多云", 2: "阴", 3: "阵雨",
  4: "雷阵雨", 5: "冰雹", 6: "雨夹雪", 7: "小雨",
  8: "中雨", 9: "大雨", 10: "暴雨", 11: "大暴雨",
  12: "特大暴雨", 13: "阵雪", 14: "小雪", 15: "中雪",
  16: "大雪", 17: "暴雪", 18: "雾", 19: "冻雨",
  20: "沙尘暴", 21: "小到中雨", 22: "中到大雨",
  23: "大到暴雨", 24: "暴雨到大暴雨", 25: "大暴雨到特大暴雨",
  26: "小到中雪", 27: "中到大雪", 28: "大到暴雪",
  29: "浮尘", 30: "扬沙", 31: "强沙尘暴", 32: "浓雾",
  49: "强雷阵雨", 53: "霾", 54: "中度霾", 55: "重度霾",
  56: "严重霾", 57: "大雾", 58: "特强浓雾",
  99: "未知",
};

// ── WMO 天气码 → 中文（Open-Meteo） ──
const WMO_MAP = {
  0: "晴天", 1: "少云", 2: "多云", 3: "阴天",
  45: "雾", 48: "雾凇",
  51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨",
  56: "冻毛毛雨", 57: "冻毛毛雨",
  61: "小雨", 63: "中雨", 65: "大雨",
  66: "冻雨", 67: "冻雨",
  71: "小雪", 73: "中雪", 75: "大雪",
  77: "雪粒",
  80: "阵雨", 81: "中等阵雨", 82: "大阵雨",
  85: "小阵雪", 86: "大阵雪",
  95: "雷暴", 96: "雷暴伴小冰雹", 99: "雷暴伴大冰雹",
};

// ── 风向角度 → 中文 ──
const windDegToCN = (deg) => {
  if (deg == null) return "未知";
  const dirs = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"];
  return dirs[Math.round(deg / 45) % 8];
};

// ── 辅助：超时 fetch ──
const fetchWithTimeout = (url, ms = 5000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
};

// ── 源 1: 小米天气（免费无 key，数据最全） ──
// 接口: weatherapi.market.xiaomi.com/wtr-v3/weather/all
export const getWeatherByXiaomi = async (lat, lon) => {
  const res = await fetchWithTimeout(
    `https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?latitude=${lat}&longitude=${lon}&locale=zh_cn&isGlobal=false&appKey=weather20151024&sign=zQFJo9CTFG7T8MhOOaV0p7mnQ1A%3D`,
    8000,
  );
  return await res.json();
};

// ── 源 2: 高德 IP 定位 ──
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// ── 源 1: 高德天气 ──
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

// ── 源 2: ip-api.com IP 定位 ──
export const getGeoByIP = async () => {
  const res = await fetchWithTimeout("http://ip-api.com/json/?lang=zh-CN");
  return await res.json();
};

// ── 源 3: Open-Meteo（免费无 key，需坐标） ──
export const getWeatherByOpenMeteo = async (lat, lon) => {
  const res = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=Asia/Shanghai`,
  );
  return await res.json();
};

// ── 源 4: wttr.in（免费无 key，支持城市名） ──
export const getWeatherByWttrIn = async (city) => {
  const res = await fetchWithTimeout(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
  return await res.json();
};

// ── 源 5: 教书先生（备用） ──
export const getOtherWeather = async () => {
  const res = await fetchWithTimeout("https://api.oioweb.cn/api/weather/GetWeather");
  return await res.json();
};

// ── 天气轮换入口 —— 依次尝试，成功即返回统一格式 ──
// 返回: { city, weather, temperature, winddirection, windpower }
export const getWeatherWithFallback = async (amapKey) => {
  // ─── 策略 1: 小米天气（数据最全，优先） ───
  try {
    const geo = await getGeoByIP();
    if (geo.status !== "success") throw new Error("IP 定位失败");
    const xiaomi = await getWeatherByXiaomi(geo.lat, geo.lon);
    const cur = xiaomi.current;
    if (cur?.temperature?.value) {
      return {
        city: geo.city || geo.regionName || "未知",
        weather: XIAOMI_WEATHER_MAP[cur.weather] || `代码${cur.weather}` || "未知",
        temperature: `${cur.temperature.value}℃`,
        winddirection: windDegToCN(Number(cur.wind?.direction?.value)),
        windpower: cur.wind?.speed?.value ? `${cur.wind.speed.value} km/h` : "未知",
      };
    }
    throw new Error("小米天气返回异常");
  } catch (e) {
    console.warn("☁ 小米天气失败，切换下一源:", e.message);
  }

  // ─── 策略 2: 高德（有 key 时） ───
  if (amapKey) {
    try {
      const adCode = await getAdcode(amapKey);
      if (adCode.infocode === "10000") {
        const result = await getWeather(amapKey, adCode.adcode);
        return {
          city: adCode.city,
          weather: result.lives[0].weather,
          temperature: result.lives[0].temperature,
          winddirection: result.lives[0].winddirection,
          windpower: result.lives[0].windpower,
        };
      }
      throw new Error("高德 IP 定位失败");
    } catch (e) {
      console.warn("☁ 高德天气失败，切换下一源:", e.message);
    }
  }

  // ─── 策略 3: ip-api 定位 + Open-Meteo 天气 ───
  try {
    const geo = await getGeoByIP();
    if (geo.status === "success") {
      const meteo = await getWeatherByOpenMeteo(geo.lat, geo.lon);
      const cw = meteo.current_weather;
      return {
        city: geo.city || geo.regionName,
        weather: WMO_MAP[cw.weathercode] || `代码${cw.weathercode}`,
        temperature: `${cw.temperature}°C`,
        winddirection: windDegToCN(cw.winddirection),
        windpower: `${cw.windspeed} km/h`,
      };
    }
    throw new Error("ip-api 定位失败");
  } catch (e) {
    console.warn("☁ Open-Meteo 天气失败，切换下一源:", e.message);
  }

  // ─── 策略 4: wttr.in（用 IP 直连，自动定位） ───
  try {
    const wttr = await getWeatherByWttrIn("");
    const c = wttr.current_condition?.[0];
    if (c) {
      return {
        city: wttr.nearest_area?.[0]?.areaName?.[0]?.value || "未知",
        weather: c.weatherDesc?.[0]?.value || "未知",
        temperature: `${c.temp_C}°C`,
        winddirection: c.winddir16Point || "未知",
        windpower: `${c.windspeedKmph} km/h`,
      };
    }
    throw new Error("wttr.in 返回异常");
  } catch (e) {
    console.warn("☁ wttr.in 天气失败，切换下一源:", e.message);
  }

  // ─── 策略 5: 教书先生（旧备用） ───
  try {
    const other = await getOtherWeather();
    const data = other.result;
    if (data?.city) {
      const min = Number(data.condition?.min_degree);
      const max = Number(data.condition?.max_degree);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        data.condition.temperature = `${Math.round((min + max) / 2)}°C`;
      }
      return {
        city: data.city.City || "未知",
        weather: data.condition?.day_weather || "未知",
        temperature: data.condition?.temperature || "未知",
        winddirection: data.condition?.day_wind_direction || "未知",
        windpower: data.condition?.day_wind_power || "未知",
      };
    }
    throw new Error("教书先生返回异常");
  } catch (e) {
    console.error("☁ 所有天气源均已失效:", e.message);
    throw new Error("所有天气接口均不可用");
  }
};
