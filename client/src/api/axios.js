import axios from "axios";
import { clearAuthValues, getAuthValue, migrateLocalAuthToSession } from "../utils/authStorage";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

let isAuthRedirectInProgress = false;

// Backward compatibility for already logged-in users from older builds.
migrateLocalAuthToSession();

// Automatically attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAuthValue("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";
    const isLoginCall = String(requestUrl).includes("/login");

    if (status === 401 && !isLoginCall) {
      const hasToken = !!getAuthValue("token");
      if (hasToken) {
        clearAuthValues();
      }

      const currentPath = window.location?.pathname || "";
      const alreadyOnLogin = currentPath === "/login";
      if (!alreadyOnLogin && !isAuthRedirectInProgress) {
        isAuthRedirectInProgress = true;
        window.location.assign("/login?reason=session_expired");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
