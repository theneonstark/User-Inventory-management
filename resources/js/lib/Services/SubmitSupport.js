import axios from "axios";

const API_URL = import.meta.env.VITE_ENVIRONMENT === "production"
  ? `${import.meta.env.VITE_API_BASE_URL}/api/support`   // Production API URL
  : "/api/support";  // Local development API URL

export const submitSupportRequest = async (supportData) => {
  try {
    const response = await axios.post(`${API_URL}`, supportData, {
      headers: {
        "Content-Type": "application/json",
        // Add authentication if needed
        // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const submitSupport = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};