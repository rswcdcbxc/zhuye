<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith("风")
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower }}&nbsp;级</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getWeatherWithFallback } from "@/api";
import { Error } from "@icon-park/vue-next";

// 高德开发者 Key（可选）
const mainKey = import.meta.env.VITE_WEATHER_KEY;

// 天气数据
const weatherData = reactive({
  adCode: {
    city: null,
  },
  weather: {
    weather: null,
    temperature: null,
    winddirection: null,
    windpower: null,
  },
});

// 获取天气 — 多源自动轮换
const getWeatherData = async () => {
  try {
    const result = await getWeatherWithFallback(mainKey);
    weatherData.adCode = {
      city: result.city || "未知",
    };
    weatherData.weather = {
      weather: result.weather || "未知",
      temperature: result.temperature || "--",
      winddirection: result.winddirection || "未知",
      windpower: result.windpower || "--",
    };
  } catch (error) {
    console.error("天气信息获取失败:" + error);
    ElMessage({
      message: "天气信息获取失败",
      icon: h(Error, { theme: "filled", fill: "#efefef" }),
    });
  }
};

onMounted(() => {
  getWeatherData();
});
</script>
