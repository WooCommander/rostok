// Open-Meteo — бесплатный API, без ключа
// Docs: https://open-meteo.com/en/docs

import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'

export interface WeatherData {
  temp: number
  condition: string
  city: string
  lat: number
  lon: number
}

export const WeatherService = {
  async getCurrentPosition(): Promise<{ lat: number; lon: number }> {
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.checkPermissions()
        if (perm.location !== 'granted') {
          const request = await Geolocation.requestPermissions()
          if (request.location !== 'granted') {
            throw new Error('Нет разрешения на геолокацию')
          }
        }
      }
      const pos = await Geolocation.getCurrentPosition({ timeout: 10000, enableHighAccuracy: true })
      return { lat: pos.coords.latitude, lon: pos.coords.longitude }
    } catch (e) {
      console.error('Ошибка получения координат:', e)
      throw new Error('Не удалось получить координаты')
    }
  },

  async getWeather(lat: number, lon: number): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Ошибка погодного API')
    const json = await res.json()
    const temp = Math.round(json.current.temperature_2m)
    const code = json.current.weathercode
    return {
      temp,
      condition: WeatherService.codeToCondition(code),
      city: await WeatherService.getCityName(lat, lon),
      lat,
      lon
    }
  },

  async getCityName(lat: number, lon: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`
      )
      const json = await res.json()
      return json.address?.city || json.address?.town || json.address?.village || 'Мой регион'
    } catch {
      return 'Мой регион'
    }
  },

  codeToCondition(code: number): string {
    if (code === 0) return 'Ясно'
    if (code <= 3) return 'Облачно'
    if (code <= 49) return 'Туман'
    if (code <= 59) return 'Морось'
    if (code <= 69) return 'Дождь'
    if (code <= 79) return 'Снег'
    if (code <= 82) return 'Ливень'
    if (code <= 99) return 'Гроза'
    return 'Переменно'
  },

  // Загрузить с кешем (обновлять не чаще раза в час)
  async getWithCache(lat?: number, lon?: number): Promise<WeatherData> {
    const cacheKey = 'rostok_weather'
    const cacheTime = 'rostok_weather_time'
    const now = Date.now()
    const cached = sessionStorage.getItem(cacheKey)
    const lastTime = parseInt(sessionStorage.getItem(cacheTime) || '0')

    if (cached && now - lastTime < 60 * 60 * 1000) {
      return JSON.parse(cached)
    }

    const coords = lat && lon ? { lat, lon } : await WeatherService.getCurrentPosition()
    const data = await WeatherService.getWeather(coords.lat, coords.lon)
    sessionStorage.setItem(cacheKey, JSON.stringify(data))
    sessionStorage.setItem(cacheTime, String(now))
    return data
  }
}
