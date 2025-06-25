import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { Inertia } from "@inertiajs/inertia";

export function LoginForm({ className, ...props }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);

    try {
      const endpoint = import.meta.env.VITE_ENVIRONMENT === "production" 
      ? `${import.meta.env.VITE_API_BASE_URL}/Userlogin`
      : "Userlogin";
    
    const response = await axios.post(endpoint, {
      email: data.email,
      password: data.password,
    });
    

      console.log("Login successful:", response);
      Inertia.visit(response.data.redirect)
    } catch (err) {
      setError("Invalid email or password.");
      console.error("Login error:", err.response?.data?.message);
      toast.error("Unauthorized User");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-screen bg-gray-100", className)} {...props}>
      <ToastContainer />
      <Card className="w-full max-w-md shadow-lg rounded-lg p-6 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">Aryan Event User Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="border border-gray-300 rounded-lg px-4 py-2"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <span className="text-sm text-red-500">{errors.email.message}</span>
              )}
            </div>

            {/* Password Input */}
            <div className="grid gap-2 relative">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="border border-gray-300 rounded-lg px-4 py-2 pr-10"
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-sm text-red-500">{errors.password.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* Display Error Message */}
            {error && <div className="text-red-500 text-center">{error}</div>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
