import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://34.195.238.63:7001/api",
});

export default axiosInstance;
