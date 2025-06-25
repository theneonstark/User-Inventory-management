import axios from "axios";

const API_URL = import.meta.env.VITE_ENVIRONMENT === "production"
  ? `${import.meta.env.VITE_API_BASE_URL}/api/PayPendingPayment`   // Production API URL
  : "/api/PayPendingPayment";  // Local development API URL




const payment = {
  // Fetch all products
  PendingPayment: async (id, amount) => {
    return axios.post(API_URL,{
        order_id: id,
        payment_amount: amount,
    });
  },
};

export default payment;
