import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Automatically attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle banned/suspended/unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error.response?.data?.code;
    const status = error.response?.status;

    if (
      status === 403 &&
      (code === "ACCOUNT_BANNED" || code === "ACCOUNT_SUSPENDED")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
      const msg =
        code === "ACCOUNT_BANNED"
          ? "Your account has been permanently banned."
          : "Your account has been suspended. Please contact support.";
      window.location.href = "/login?message=" + encodeURIComponent(msg);
    }

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
