import axios from "axios";

const API_URL = import.meta.env.VITE_ENVIRONMENT === "production"
  ? `${import.meta.env.VITE_API_BASE_URL}/api/order`   // Production API URL
  : "/api/order";  // Local development API URL


const ordersService = {
  // Fetch all orders
  getAllOrders: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // Fetch user-specific orders
  getUserOrders: async () => {
    try {
      const response = await axios.get(`${API_URL}/user/order`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  },

  // Fetch a single order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },

  // Place a new order
  placeOrder: async (orderData, type) => {
    try {
      const response = await axios.post(API_URL, {
        ...orderData, // The order data object containing all other information
        type: type,   // The 'type' field is included in the body of the request
      });
      
      return response;
    } catch (error) {
      console.error("Error placing order:", error);
      throw error;
    }
  },

  // Update order payment
  updatePayment: async (orderId, paymentAmount) => {
    try {
      const response = await axios.put(`${API_URL}/${orderId}`, { payment_amount: paymentAmount });
      return response.data;
    } catch (error) {
      console.error(`Error updating payment for order ${orderId}:`, error);
      throw error;
    }
  },

  // Delete an order
  cancelOrder: async (orderId) => {
    try {
      const response = await axios.post(`${API_URL}/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting order ${orderId}:`, error);
      throw error;
    }
  },
};

export default ordersService;
