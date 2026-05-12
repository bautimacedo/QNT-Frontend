import { request, json } from './http.js'

export async function getTempestObservations() {
  const res = await request('/meteo/tempest/observations')
  return json(res)
}

export async function getTempestForecast(lat = -46.64617, lon = -67.71842) {
  const res = await request(`/meteo/tempest/forecast?lat=${lat}&lon=${lon}`)
  return json(res)
}

export async function getTempestStation() {
  const res = await request('/meteo/tempest/station')
  return json(res)
}
