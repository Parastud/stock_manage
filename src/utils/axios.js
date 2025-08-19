import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://dms-backend-latest.onrender.com/api",
});

export default axiosInstance;
