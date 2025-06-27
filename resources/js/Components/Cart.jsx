import React, { useState, useEffect } from "react";
import axios from "axios";
import { IndianRupee, Trash2, ShoppingCart } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CartPage = ({ cartItems }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(cartItems || []);
  }, [cartItems]);

  const updateQuantity = async (index, newQuantity) => {
    const updatedCart = [...cart];
    const maxQuantity = updatedCart[index]?.product?.stock_quantity || 0;
    const quantity = Math.max(0.1, Math.min(maxQuantity, newQuantity)); // Ensure quantity stays within bounds
    updatedCart[index].quantity = quantity;
    setCart(updatedCart);

    try {
      const API_URL =
        import.meta.env.VITE_ENVIRONMENT === "production"
          ? `${import.meta.env.VITE_API_BASE_URL}/cart/update`
          : "http://127.0.0.1:8000/cart/update";

      await axios.put(API_URL, {
        product_id: cart[index]?.product_id,
        quantity,
      });
      console.log("Quantity updated successfully");
    } catch (error) {
      console.error("Error updating quantity:", error);
      setCart(cartItems || []); // Revert on error
    }
  };

  const removeItem = async (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);

    try {
      const API_URL =
        import.meta.env.VITE_ENVIRONMENT === "production"
          ? `${import.meta.env.VITE_API_BASE_URL}/cart/remove`
          : "http://127.0.0.1:8001/cart/remove";

      await axios.delete(API_URL, {
        params: { product_id: cart[index]?.product_id },
      });
      console.log("Item removed successfully");
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const totalPrice = cart.reduce(
    (total, item) => total + (parseFloat(item?.product?.selling_price) || 0) * (item?.quantity || 0),
    0
  );

  const isOutOfStock = cart.some((item) => item?.product?.stock_quantity === 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-50 via-gray-100 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
          Your Cart
        </h1>
      </div>

      {/* Cart Items */}
      {cart.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 text-lg py-6 animate-pulse">
          Your cart is empty.{" "}
          <Link href="/AllProduct" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Start shopping!
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {cart.map((item, index) => (
            <Card
              key={item?.id}
              className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                {/* Product Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">{item?.product?.productName || "Unknown Product"}</h2>
                  <h2 className="  text-gray-800 dark:text-gray-100 tracking-tight">From : {item?.product?.companyName || item?.product?.shop_name}</h2>
                  <p className="flex items-center text-indigo-600 dark:text-indigo-300 text-lg font-bold mt-1">
                    <IndianRupee size={18} className="mr-1" />
                    {parseFloat(item?.product?.selling_price)?.toFixed(2) || "0.00"}
                  </p>
                  {item?.product?.stock_quantity === 0 ? (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1 animate-pulse">Out of Stock</p>
                  ) : (
                    <p className="text-green-500 dark:text-green-400 text-sm mt-1">In Stock ({item?.product?.stock_quantity} available)</p>
                  )}
                </div>

                {/* Quantity and Actions */}
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    step="0.1" // Allows decimal increments (e.g., 0.1, 0.2, etc.)
                    value={item?.quantity || 1}
                    onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 1)}
                    className="w-20 p-2 rounded-lg shadow-md border-indigo-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-center bg-indigo-50 dark:bg-gray-700"
                    min="0.1" // Minimum value (adjust as needed)
                    max={item?.product?.stock_quantity || 1}
                    disabled={item?.product?.stock_quantity === 0}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Total and Checkout */}
          <Card className="shadow-lg rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 p-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                Total: <IndianRupee size={22} className="ml-2 mr-1 text-indigo-600 dark:text-indigo-300" />
                <span className="text-2xl text-indigo-600 dark:text-indigo-300">{totalPrice.toFixed(2)}</span>
              </h2>
            </CardHeader>
            <CardContent className="p-4 flex justify-end">
              <Link href="checkout">
                <Button
                  disabled={isOutOfStock}
                  className={cn(
                    "px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105",
                    isOutOfStock
                      ? "bg-gray-500 dark:bg-gray-700 cursor-not-allowed text-gray-300 dark:text-gray-400"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  )}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Checkout
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CartPage;