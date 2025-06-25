import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { IndianRupee, ShoppingCart } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { Layout } from "./Layout";
import ordersService from "@/lib/Services/orders";
import { Inertia } from "@inertiajs/inertia";

export default function Checkout({ cartItems = [] }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
    trigger,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      userAddress: "",
      shippingAddress: "",
      city: "",
      zip: "",
      billingNumber: "",
      bookingAmount: "",
      paidAmount: "",
      products: cartItems.map((item) => ({
        quantity: item.quantity || 1,
        product_id: item.product?.id,
      })),
      deliveryDate: new Date().toISOString().split("T")[0],
      pickupDate: new Date().toISOString().split("T")[0],
    },
  });

  const [products, setProducts] = useState(cartItems);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState({});

  const API_URL =
    import.meta.env.VITE_ENVIRONMENT === "production"
      ? `${import.meta.env.VITE_API_BASE_URL}/api`
      : "/api";

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (userInfo) {
      setValue("name", userInfo.name || "");
      setValue("email", userInfo.email || "");
      setValue("phone", userInfo.phone || "");
      setValue("userAddress", userInfo.userAddress || userInfo.billingAddress || "");
      setValue("shippingAddress", userInfo.shippingAddress || "");
      setValue("city", userInfo.city || "");
      setValue("zip", userInfo.zip || "");
      setValue("billingNumber", userInfo.billingNumber || "");
    }
  }, [setValue]);

  const toMySQLDate = (date) => {
    const dateObj = new Date(date);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(
      dateObj.getDate()
    ).padStart(2, "0")}`;
  };

  const formatDateForDisplay = (date) => {
    return new Date(date)
      .toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "2-digit",
        year: "numeric",
      })
      .replace(/(\d+)/g, "$1")
      .replace(",", "");
  };

  const checkAvailability = useCallback(async () => {
    if (!products.length) return;

    try {
      const deliveryDate = toMySQLDate(watch("deliveryDate"));
      const pickupDate = toMySQLDate(watch("pickupDate"));

      const availabilityData = {
        products: products.map((product) => ({
          product_id: product.product.id,
          quantity: product.quantity || 1,
        })),
        delivered_date: deliveryDate,
        pickup_date: pickupDate,
      };

      const response = await axios.post(`${API_URL}/check-availability`, availabilityData);
      setAvailabilityStatus(response.data);
    } catch (err) {
      console.error("Availability check error:", err);
      setAvailabilityStatus({});
      if (err.response?.data?.error.pickup_date) {
        Swal.fire({
          icon: "error",
          title: "Availability Check Failed",
          text: "The pickup date must be on or after the delivery date.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Availability Check Failed",
          text: err.response?.data?.error || "Please try again",
        });
      }
    }
  }, [products, watch]);

  const handleProductChange = (index, value) => {
    const qty = isNaN(parseFloat(value)) ? 0.1 : parseFloat(value);
    const finalQty = Math.max(0.1, qty);

    const updatedProducts = [...products];
    const product = updatedProducts[index];

    if (finalQty > (product.product.stock_quantity || Infinity)) {
      setError(`Only ${product.product.stock_quantity} available`);
      return;
    }

    if (!/^[0-9]*\.?[0-9]{0,3}$/.test(finalQty.toString())) {
      setError("Maximum 3 decimal places allowed");
      return;
    }

    setError("");
    updatedProducts[index].quantity = finalQty;
    setProducts(updatedProducts);
    setValue(`products[${index}].quantity`, finalQty);
    trigger(`products[${index}].quantity`);
    checkAvailability();
  };

  const bookingAmount = parseFloat(watch("bookingAmount")) || 0;
  const paidAmount = parseFloat(watch("paidAmount")) || 0;
  const remainingAmount = Math.max(bookingAmount - paidAmount, 0);

  const onSubmit = async (data) => {
    const deliveryDate = new Date(data.deliveryDate);
    const pickupDate = new Date(data.pickupDate);

    if (deliveryDate > pickupDate) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Dates",
        text: "Delivery date must be on or before pickup date",
      });
      return;
    }

    if (Object.values(availabilityStatus).some((status) => !status?.available)) {
      Swal.fire({
        icon: "warning",
        title: "Stock Unavailable",
        text: "Some products are not available for the selected dates",
      });
      return;
    }

    if (bookingAmount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Booking Amount",
        text: "Booking amount must be greater than 0",
      });
      return;
    }

    if (paidAmount > bookingAmount) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Paid Amount",
        text: "Paid amount cannot exceed booking amount",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const deliveryDateFormatted = toMySQLDate(data.deliveryDate);
      const pickupDateFormatted = toMySQLDate(data.pickupDate);

      const orderData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        userAddress: data.userAddress,
        shippingAddress: data.shippingAddress,
        city: data.city,
        zip: data.zip,
        billing_number: data.billingNumber,
        paid_amount: paidAmount,
        total_amount: bookingAmount,
        pending_payment: remainingAmount,
        products: products.map((product) => ({
          product_id: product.product.id,
          quantity: parseFloat(product.quantity), // Ensure decimal quantity
          From: product.product.companyName || product.product.shop_name || "Unknown",
          product_price: parseFloat(product.product.selling_price),
          total_price: parseFloat(product.product.selling_price) * parseFloat(product.quantity),
          product_name: product.product.category,
        })),
        delivered_date: deliveryDateFormatted,
        pickup_date: pickupDateFormatted,
        type: "checkout",
      };

      const response = await ordersService.placeOrder(orderData);

      await Swal.fire({
        icon: "success",
        title: "Order Placed Successfully!",
        text: "Redirecting to products page...",
        timer: 3000,
        timerProgressBar: true,
      });

      reset();
      setProducts([]);
      setError("");
      setAvailabilityStatus({});
      const endpoint =
        import.meta.env.VITE_ENVIRONMENT === "production"
          ? "https://event.nikatby.in/user/public/AllProduct"
          : "/AllProduct";
      Inertia.visit(endpoint);
    } catch (err) {
      console.error("Order placement error:", err);
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: err.response?.data?.error || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProgress = () => {
    const totalFields = Object.keys(watch()).length;
    const filledFields = Object.values(watch()).filter((v) => v).length;
    const productFilled = products.some((p) => p.quantity > 0) ? 1 : 0;
    return Math.min(((filledFields + productFilled) / (totalFields + 1)) * 100, 100);
  };

  const deliveryDateValue = watch("deliveryDate");
  const pickupDateValue = watch("pickupDate");

  const normalizeDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const toDateString = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-50 via-gray-100 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 min-h-screen">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight mb-8">
          Complete Your Order
        </h1>
        <Progress value={calculateProgress()} className="mb-8 h-3 rounded-full bg-indigo-200 dark:bg-gray-700 shadow-md" />

        {products.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-lg py-6 animate-pulse">
            No items in cart.{" "}
            <a href="/AllProduct" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Add some products!
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            {products.map((product, index) => (
              <Card
                key={product.product.id || index}
                className="mb-6 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-indigo-200 dark:border-gray-700"
              >
                <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-100 font-semibold p-4">
                  Order Summary
                </CardHeader>
                <CardContent className="space-y-4 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-100 tracking-tight">
                        {product.product.productName}
                      </h3>
                      <Input
                        type="number"
                        step="any"
                        value={product.quantity}
                        {...register(`products[${index}].quantity`, {
                          valueAsNumber: true,
                          min: { value: 0.1, message: "Quantity must be at least 0.1" },
                          required: "Quantity is required",
                          validate: {
                            validNumber: (value) => !isNaN(value) || "Quantity must be a valid number",
                            maxStock: (value) =>
                              value <= (products[index]?.product?.stock_quantity || Infinity) ||
                              `Only ${products[index]?.product?.stock_quantity} available`,
                            maxDecimals: (value) =>
                              /^[0-9]*\.?[0-9]{0,3}$/.test(value.toString()) || "Maximum 3 decimal places allowed",
                          },
                        })}
                        min="0.1"
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-24 text-center mt-2 rounded-lg shadow-md border-indigo-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                      />
                      {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1 animate-pulse">{error}</p>}
                      {errors.products?.[index]?.quantity && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                          {errors.products[index].quantity.message}
                        </p>
                      )}
                      {availabilityStatus[product.product.id] && (
                        <p
                          className={`text-sm mt-1 ${
                            availabilityStatus[product.product.id].available
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400 animate-pulse"
                          }`}
                        >
                          {availabilityStatus[product.product.id].message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Price:</span>
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-300 flex items-center">
                        <IndianRupee size={20} /> {(parseFloat(product.product.selling_price) * product.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {products.length > 0 && (
              <>
                <Card className="mb-6 shadow-lg border border-indigo-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-100 font-semibold p-4">
                    Billing Information
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <Input
                      {...register("billingNumber", {
                        required: "Billing Number is required",
                        maxLength: { value: 50, message: "Billing Number must not exceed 50 characters" },
                      })}
                      placeholder="Billing Number"
                      className="border-indigo-300 dark:border-gray-600 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                    />
                    {errors.billingNumber && (
                      <p className="text-red-500 dark:text-red-400 text-sm">{errors.billingNumber.message}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="mb-6 shadow-lg border border-indigo-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-100 font-semibold p-4">
                    Payment Details
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Booking Amount:</span>
                      <div className="flex flex-col w-full sm:w-32">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...register("bookingAmount", {
                            valueAsNumber: true,
                            required: "Booking amount is required",
                            min: { value: 0.01, message: "Booking amount must be greater than 0" },
                          })}
                          placeholder="Enter Amount"
                          className="text-center rounded-lg shadow-md border-indigo-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                        />
                        {errors.bookingAmount && (
                          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.bookingAmount.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Paid Amount:</span>
                      <div className="flex flex-col w-full sm:w-32">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...register("paidAmount", {
                            valueAsNumber: true,
                            required: "Paid amount is required",
                            validate: (value) =>
                              value <= bookingAmount || "Paid amount cannot exceed booking amount",
                          })}
                          placeholder="Enter Amount"
                          className="text-center rounded-lg shadow-md border-indigo-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                        />
                        {errors.paidAmount && (
                          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.paidAmount.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Remaining Amount:</span>
                      <span className="flex items-center text-indigo-600 dark:text-indigo-300 font-bold text-xl">
                        <IndianRupee size={20} /> {remainingAmount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6 shadow-lg border border-indigo-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-100 font-semibold p-4">
                    Client Details
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <Input
                      {...register("name", {
                        required: "Name is required",
                        maxLength: { value: 255, message: "Name must not exceed 255 characters" },
                      })}
                      placeholder="Full Name"
                      className="border-indigo-300 dark:border-gray-600 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                    />
                    {errors.name && <p className="text-red-500 dark:text-red-400 text-sm">{errors.name.message}</p>}
                    <Input
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                        maxLength: { value: 255, message: "Email must not exceed 255 characters" },
                      })}
                      placeholder="Email Address"
                      className="border-indigo-300 dark:border-gray-600 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                    />
                    {errors.email && <p className="text-red-500 dark:text-red-400 text-sm">{errors.email.message}</p>}
                    <Input
                      {...register("phone", {
                        required: "Phone number is required",
                        pattern: { value: /^\d{10}$/, message: "Phone number must be 10 digits" },
                      })}
                      placeholder="Phone Number"
                      maxLength={10}
                      className="border-indigo-300 dark:border-gray-600 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                    />
                    {errors.phone && <p className="text-red-500 dark:text-red-400 text-sm">{errors.phone.message}</p>}
                  </CardContent>
                </Card>

                <Card className="mb-6 shadow-lg border border-indigo-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-100 font-semibold p-4">
                    Address Details
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <Input
                      {...register("userAddress", {
                        required: "User Address is required",
                        maxLength: { value: 500, message: "Address must not exceed 500 characters" },
                      })}
                      placeholder="User Street Address"
                      className="border-indigo-300 dark:border-gray-600 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                    />
                    {errors.userAddress && (
                      <p className="text-red-500 dark:text-red-400 text-sm">{errors.userAddress.message}</p>
                    )}
                    <Input
                      {...register("shippingAddress", {
                        required: "Shipping Address is required",
                        maxLength: { value: 500, message: "Address must not exceed 500 characters" },
                      })}
                      placeholder="Shipping Street Address"
                      className="border-indigo-300 dark:border-gray-600 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                    />
                    {errors.shippingAddress && (
                      <p className="text-red-500 dark:text-red-400 text-sm">{errors.shippingAddress.message}</p>
                    )}
                    <Input
                      {...register("city", {
                        required: "City is required",
                        maxLength: { value: 100, message: "City must not exceed 100 characters" },
                      })}
                      placeholder="City"
                      className="border-indigo-300 dark:border-gray-600 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                    />
                    {errors.city && <p className="text-red-500 dark:text-red-400 text-sm">{errors.city.message}</p>}
                    <Input
                      {...register("zip", {
                        required: "ZIP Code is required",
                        pattern: { value: /^\d{6}$/, message: "ZIP Code must be 6 digits" },
                      })}
                      placeholder="ZIP Code"
                      maxLength={6}
                      className="border-indigo-300 dark:border-gray-600 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 transition-all duration-300 bg-indigo-50 dark:bg-gray-700"
                    />
                    {errors.zip && <p className="text-red-500 dark:text-red-400 text-sm">{errors.zip.message}</p>}
                  </CardContent>
                </Card>

                <Card className="mb-6 shadow-lg border border-indigo-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-100 font-semibold p-4">
                    Delivery Schedule
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <Calendar
                      mode="single"
                      selected={normalizeDate(deliveryDateValue)}
                      onSelect={(date) => {
                        if (date) {
                          const newDeliveryDate = toDateString(date);
                          setValue("deliveryDate", newDeliveryDate);
                          const pickupDate = normalizeDate(pickupDateValue);
                          if (new Date(newDeliveryDate) > pickupDate) {
                            setValue("pickupDate", newDeliveryDate);
                          }
                          checkAvailability();
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const maxDate = normalizeDate(pickupDateValue);
                        return date < today || date > maxDate;
                      }}
                      className="rounded-md border border-indigo-300 dark:border-gray-600 shadow-md bg-white dark:bg-gray-800 text-center"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                      Select a date for delivery (must be on or before pickup date).
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-6 shadow-lg border border-indigo-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-100 font-semibold p-4">
                    Pickup Schedule
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <Calendar
                      mode="single"
                      selected={normalizeDate(pickupDateValue)}
                      onSelect={(date) => {
                        if (date) {
                          const newPickupDate = toDateString(date);
                          setValue("pickupDate", newPickupDate);
                          const deliveryDate = normalizeDate(deliveryDateValue);
                          if (new Date(newPickupDate) < deliveryDate) {
                            setValue("deliveryDate", newPickupDate);
                          }
                          checkAvailability();
                        }
                      }}
                      disabled={(date) => {
                        const minDate = normalizeDate(deliveryDateValue);
                        return date < minDate;
                      }}
                      className="rounded-md border border-indigo-300 dark:border-gray-600 shadow-md bg-white dark:bg-gray-800 text-center"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                      Select a date for pickup (must be on or after delivery date).
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-6 shadow-lg border border-indigo-200 dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-gray-800 dark:text-gray-100 font-semibold p-4">
                    Order Preview
                  </CardHeader>
                  <CardContent className="p-6 space-y-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Name:</span>
                      <span className="text-gray-800 dark:text-gray-100">{watch("name") || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span>
                      <span className="text-gray-800 dark:text-gray-100">{watch("email") || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span>
                      <span className="text-gray-800 dark:text-gray-100">{watch("phone") || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Billing Number:</span>
                      <span className="text-gray-800 dark:text-gray-100">{watch("billingNumber") || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">User Address:</span>
                      <span className="text-gray-800 dark:text-gray-100">{watch("userAddress") || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Shipping Address:</span>
                      <span className="text-gray-800 dark:text-gray-100">{watch("shippingAddress") || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">City:</span>
                      <span className="text-gray-800 dark:text-gray-100">{watch("city") || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">ZIP Code:</span>
                      <span className="text-gray-800 dark:text-gray-100">{watch("zip") || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Delivery Date:</span>
                      <span className="text-gray-800 dark:text-gray-100">
                        {formatDateForDisplay(watch("deliveryDate"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Pickup Date:</span>
                      <span className="text-gray-800 dark:text-gray-100">
                        {formatDateForDisplay(watch("pickupDate"))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Booking Amount:</span>
                      <span className="flex items-center text-indigo-600 dark:text-indigo-300 font-bold">
                        <IndianRupee size={20} /> {bookingAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Paid Amount:</span>
                      <span className="flex items-center text-indigo-600 dark:text-indigo-300 font-bold">
                        <IndianRupee size={20} /> {paidAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Remaining Amount:</span>
                      <span className="flex items-center text-indigo-600 dark:text-indigo-300 font-bold">
                        <IndianRupee size={20} /> {remainingAmount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Button
                    type="submit"
                    className="w-full sm:w-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
                    disabled={
                      isSubmitting ||
                      products.length === 0 ||
                      Object.values(availabilityStatus).some((status) => !status?.available)
                    }
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </Layout>
  );
}