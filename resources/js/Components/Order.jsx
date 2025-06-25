import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2"; // Import SweetAlert2
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import productservice from "@/lib/Services/product";
import ordersService from "@/lib/Services/orders";
import { Inertia } from "@inertiajs/inertia";

export default function OrderPage({ id }) {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });
  const [deliveryDate, setDeliveryDate] = useState(new Date());

  useEffect(() => {
    const getProducts = async () => {
      try {
        const response = await productservice.getProductById(id);
        setProducts([response.product]);
      } catch (err) {
        console.error(err);
      }
    };
    getProducts();

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setUserData(userInfo);
    }
  }, [id]);

  const handleProductChange = (index, key, value) => {
    const updatedProducts = [...products];
    if (key === "quantity") {
      if (value > updatedProducts[index].stock_quantity) {
        setError("Quantity exceeds available stock.");
      } else {
        setError("");
        updatedProducts[index][key] = value;
        setProducts(updatedProducts);
        setValue(`products[${index}].quantity`, value);
      }
    } else {
      updatedProducts[index][key] = value;
      setProducts(updatedProducts);
    }
  };

  const totalAmount = products.reduce((sum, product) => sum + parseFloat(product.price) * product.quantity, 0);
  const paidAmount = parseFloat(watch("paid_amount")) || 0;
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

  const onSubmit = async (data) => {
    try {
      const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "2-digit",
        year: "numeric",
      }).replace(",", "");

      const orderData = {
        ...data,
        delivered_date: formattedDeliveryDate,
        products: products.map((product) => ({
          product_name: product.productName,
          product_id: product.id,
          quantity: product.quantity,
          product_price: product.price,
          total_price: parseFloat(product.price) * product.quantity,
          From:product.companyName || product.shop_name
        })),
        total_amount: totalAmount,
        pending_payment: remainingAmount,
      };

      const response = await ordersService.placeOrder(orderData);
      console.log("Order placed successfully", response);

      if (response.status === 201) {
        // Show SweetAlert2 success popup
        await Swal.fire({
          icon: "success",
          title: "Order Placed Successfully!",
          text: "Thank you for your order. You will be redirected to the home page.",
          confirmButtonText: "OK",
          timer: 3000, // Auto-close after 3 seconds
          timerProgressBar: true,
        });
        const endpoint = import.meta.env.VITE_ENVIRONMENT === "production" 
        ? `${import.meta.env.VITE_API_BASE_URL}/Userlogin`
        : "http://127.0.0.1:8001/Userlogin";

        // Redirect to /home after the popup
        Inertia.visit(endpoint);
      }

      reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zip: "",
        paid_amount: "",
      });
      setProducts([]);
      setError("");
    } catch (err) {
      console.error("Error placing order", err);
      // Show error popup
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Error placing the order. Please try again.",
      });
    }
  };

  let filledFields = Object.values(watch()).filter((v) => v !== "").length;
  let filledProduct = products.some((product) => product.quantity > 0) ? 1 : 0;
  let progress = Math.min((filledFields + filledProduct) / (Object.keys(watch()).length + 1) * 100, 100);

  return (
    <div className="max-w-3xl mx-auto lg:p-6 p-2">
      <h1 className="text-2xl font-semibold mb-4">Complete Your Order</h1>
      <Progress value={progress} className="mb-6" />

      {/* Product Details */}
      {products.map((product, index) => (
        <Card key={index} className="mb-4 shadow-lg">
          <CardHeader className="bg-blue-100 text-black font-semibold">Order Summary</CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <h3 className="font-semibold">{product.productName}</h3>
                <div className="flex items-center gap-2">
                  <label>Qty</label>
                  <Input
                    type="number"
                    value={product.quantity || ""}
                    {...register(`products[${index}].quantity`, {
                      valueAsNumber: true,
                      min: 1,
                      required: "Quantity is required",
                    })}
                    onChange={(e) => handleProductChange(index, "quantity", parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                  />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {errors.products?.[index]?.quantity && (
                    <p className="text-red-500 text-sm">{errors.products[index].quantity.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Price:</span>
                <span className="lg:text-xl text-sm font-bold flex items-center">
                  <IndianRupee size={15} /> {product.price}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="mb-4 shadow-lg">
        <CardFooter className="flex flex-col space-y-2 font-bold">
          <div className="flex justify-between w-full">
            <span>Total Price:</span>
            <span className="flex items-center">
              <IndianRupee size={15} />
              {totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between w-full">
            <span>Paid Amount:</span>
            <Input
              type="number"
              min="0"
              max={totalAmount}
              placeholder="Enter Paid Amount"
              {...register("paid_amount", {
                valueAsNumber: true,
                required: "Paid amount is required",
                validate: (value) => {
                  if (value >= 0 && value <= totalAmount) {
                    return true;
                  }
                  return `Paid amount must be between 0 and the total amount (${totalAmount.toFixed(2)}).`;
                },
              })}
              className="w-24 text-center"
            />
            {errors.paid_amount && <p className="text-red-500 text-sm">{errors.paid_amount.message}</p>}
          </div>
          <div className="flex justify-between w-full">
            <span>Remaining Amount:</span>
            <span className="flex items-center">
              <IndianRupee size={15} />
              {remainingAmount.toFixed(2)}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* User Information */}
      <Card className="mb-4 shadow-lg">
        <CardHeader className="bg-blue-100 text-black font-semibold">Client Details</CardHeader>
        <CardContent className="space-y-3">
          <Input
            {...register("name", { required: "Name is required" })}
            placeholder="Full Name"
            defaultValue={userData.name}
            className="border p-2 rounded-lg"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          <Input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
            placeholder="Email Address"
            defaultValue={userData.email}
            className="border p-2 rounded-lg"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          <Input
            {...register("phone", {
              required: "Phone number is required",
              pattern: {
                value: /^\d{10}$/,
                message: "Phone number must be 10 digits",
              },
            })}
            placeholder="Phone Number"
            defaultValue={userData.phone}
            className="border p-2 rounded-lg"
          />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card className="mb-4 shadow-lg">
        <CardHeader className="bg-blue-100 text-black font-semibold">Shipping Address</CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Input
              {...register("address", { required: "Address is required" })}
              placeholder="Street Address"
              defaultValue={userData.address}
              className="border p-2 rounded-lg w-full"
            />
            {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
          </div>
          <div>
            <Input
              {...register("city", { required: "City is required" })}
              placeholder="City"
              defaultValue={userData.city}
              className="border p-2 rounded-lg w-full"
            />
            {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
          </div>
          <div>
            <Input
              {...register("zip", {
                required: "ZIP Code is required",
                pattern: {
                  value: /^[0-9]{5,6}$/,
                  message: "Enter a valid ZIP Code",
                },
              })}
              placeholder="ZIP Code"
              defaultValue={userData.zip}
              className="border p-2 rounded-lg w-full"
            />
            {errors.zip && <p className="text-red-500 text-sm">{errors.zip.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Delivered Date (Calendar) */}
      <Card className="mb-4 shadow-lg">
        <CardHeader className="bg-blue-100 text-black font-semibold">Delivered Date</CardHeader>
        <CardContent className="w-full flex flex-col items-center">
          <Calendar
            onChange={setDeliveryDate}
            value={deliveryDate}
            className="border p-2 rounded-lg w-full"
          />
          <p className="text-sm text-gray-500 mt-2">Select a date for delivery.</p>
        </CardContent>
      </Card>

      {/* Data Preview */}
      <div className="mb-6 p-4 border rounded-lg shadow-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Preview Your Order</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold">Name:</span>
            <span>{watch("name") || userData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Email:</span>
            <span>{watch("email") || userData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Phone:</span>
            <span>{watch("phone") || userData.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Address:</span>
            <span>{watch("address") || userData.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">City:</span>
            <span>{watch("city") || userData.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">ZIP Code:</span>
            <span>{watch("zip") || userData.zip}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Delivery Date:</span>
            <span>{deliveryDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Total Amount:</span>
            <span>
              <IndianRupee size={15} /> {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={handleSubmit(onSubmit)} className="w-full">
          Place Order
        </Button>
      </div>
    </div>
  );
}