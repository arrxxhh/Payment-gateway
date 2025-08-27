import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function apiClient() {
  const token = localStorage.getItem('token')
  const instance = axios.create({
    baseURL: BASE_URL + '/api',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return instance
}


