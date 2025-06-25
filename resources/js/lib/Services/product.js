import axios from "axios";

const API_URL = import.meta.env.VITE_ENVIRONMENT === "production"
  ? `${import.meta.env.VITE_API_BASE_URL}/api/products`   // Production API URL
  : "/api/products";  // Local development API URL

const Category_URL = import.meta.env.VITE_ENVIRONMENT === "production"
  ? `${import.meta.env.VITE_API_BASE_URL}/api/categories`   // Production API URL
  : "/api/categories";  // Local development API URL



const product = {
  // Fetch all products
  getAllProducts: async () => {
    return axios.get(API_URL);
  },
  getCategories: async ()=>{
  return axios.get(Category_URL);
  },

  getProductById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },
};

export default product;
