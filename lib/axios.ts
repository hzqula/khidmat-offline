import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  config.withCredentials = true;
  return config;
});

export default api;
