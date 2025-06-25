import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UpcomingDeliveries = ({ orders }) => {
  const [filter, setFilter] = useState("all"); // Filter state: "all", "week", "month"
  
  // Parse the delivery date string for comparison and filter upcoming deliveries
  const upcomingOrders = orders
    ?.filter(order => {
      if (!order?.delivered_date) return false; // Check for delivered_date existence
      const deliveryDate = new Date(order?.delivered_date); // Parse "Sat February 22, 2025" for comparison
      const currentDate = new Date(); // Current date (March 24, 2025, per context)
      return !isNaN(deliveryDate?.getTime()) && deliveryDate > currentDate; // Valid date and in future
    })
    ?.sort((a, b) => new Date(a?.delivered_date) - new Date(b?.delivered_date)) || [];
  
  // Apply additional filtering based on time range
  const filteredUpcomingOrders = upcomingOrders?.filter(order => {
    const deliveryDate = new Date(order?.delivered_date);
    const today = new Date();
    const diffDays = (deliveryDate - today) / (1000 * 3600 * 24);

    if (filter === "week") return diffDays <= 7;
    if (filter === "month") return diffDays <= 30;
    return true; // "all"
  }) || [];

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="bg-purple-50 dark:bg-purple-900 p-4 rounded-t-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100 text-lg sm:text-xl font-semibold">
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 dark:text-purple-400" />
            Upcoming Deliveries
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Orders scheduled for delivery
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px] rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectItem value="all" className="text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                All Upcoming
              </SelectItem>
              <SelectItem value="week" className="text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                Next 7 Days
              </SelectItem>
              <SelectItem value="month" className="text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                Next 30 Days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {filteredUpcomingOrders?.length > 0 ? (
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {filteredUpcomingOrders?.map((order) => (
              <div key={order?.id} className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    Order #{order?.id} - {order?.user_name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Status: {order?.status || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {order?.delivered_date || "Date TBD"} {/* Display raw string directly */}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {order?.delivered_date 
                      ? Math.ceil((new Date(order?.delivered_date) - new Date()) / (1000 * 3600 * 24)) 
                      : "N/A"} days
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400 text-sm">
            No upcoming deliveries found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingDeliveries;