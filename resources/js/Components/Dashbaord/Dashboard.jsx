import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import orderService from "@/lib/Services/orders";
import axios from "axios";
import DashboardStats from "./DashboardStats";
import OrdersTrendChart from "./OrdersTrendChart";
import OrderDistributionChart from "./OrderDistributionChart";
import UpcomingDeliveries from "./UpcomingDeliveries";

const getLastNDays = (n) => {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
};
  
const getOrdersByDate = (orders, dates) => {
    const ordersByDate = {};
    dates.forEach((date) => {
      ordersByDate[date] = 0;
    });
  
    orders?.forEach((order) => {
      const orderDate = new Date(order?.created_at).toISOString().split("T")[0];
      if (ordersByDate[orderDate] !== undefined) {
        ordersByDate[orderDate]++;
      }
    });
  
    return dates.map((date) => ({
      date,
      orders: ordersByDate[date] || 0,
    }));
};
  
const getOrdersInRange = (orders, days) => {
    const today = new Date();
    return orders?.filter((order) => {
      const orderDate = new Date(order?.created_at);
      return days === "All"
        ? true
        : (today - orderDate) / (1000 * 3600 * 24) <= days;
    }) || [];
};
  
const getTop5Users = (orders) => {
    const userOrderCount = orders?.reduce((acc, order) => {
      const userId = order?.user_id || "unknown";
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {}) || {};
  
    return Object.entries(userOrderCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({
        name: userId === "unknown" ? "Unknown User" : `User ${userId}`,
        value: count,
      }));
};
  
const getTotalRevenue = (orders) => {
    return orders?.reduce(
      (total, order) => total + parseFloat(order?.paid_payment || 0),
      0
    ) || 0;
};
  
const getTotalExpenses = (expenses, ordersInRange) => {
    const orderIdsInRange = new Set(ordersInRange?.map(order => order?.id?.toString()));
    return expenses
      ?.filter(expense => orderIdsInRange.has(expense?.order_id))
      ?.reduce((total, expense) => 
        total + (expense?.expenses?.reduce((sum, item) => sum + parseFloat(item?.amount || 0), 0) || 0), 
        0
      ) || 0;
};
  
const getTotalActualPayAmount = (orders) => {
    return orders?.reduce(
      (total, order) => total + parseFloat(order?.total_amount || 0),
      0
    ) || 0;
};
  
const getTotalPaidAmount = (orders) => {
    return orders?.reduce(
      (total, order) => total + parseFloat(order?.paid_payment || 0),
      0
    ) || 0;
};
  
const getTotalPendingAmount = (orders) => {
    return orders?.reduce(
      (total, order) => total + parseFloat(order?.pending_payment || 0),
      0
    ) || 0;
};
  
const getAggregatedData = (orders) => {
    if (!orders?.length) return [];
    const dataByMonth = {};
    orders.forEach((order) => {
      const date = new Date(order?.created_at);
      const month = date.toLocaleString("default", { month: "short", year: "numeric" });
      dataByMonth[month] = (dataByMonth[month] || 0) + 1;
    });
    return Object.keys(dataByMonth).map((month) => ({
      date: month,
      orders: dataByMonth[month],
    }));
};
  
const COLORS = ["#6b7280", "#f97316", "#22c55e", "#3b82f6", "#a855f7"];

const Dashboard = () => {
  const [companyOrders, setCompanyOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyResponse, userResponse, expensesResponse] = await Promise.all([
          orderService.getAllOrders(),
          orderService.getUserOrders(),
          axios.get('api/expenses'),
        ]);
        setCompanyOrders(companyResponse?.orders || []);
        setUserOrders(userResponse?.orders || []);
        setExpenses(expensesResponse?.data?.data || []);
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading Dashboard...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  const days = timeRange === "All" ? "All" : parseInt(timeRange);
  const dates = days === "All" ? [] : getLastNDays(days);
  const filteredOrders = getOrdersInRange(userOrders, days);
  const top5Users = getTop5Users(filteredOrders);
  const totalExpensesAmount = getTotalExpenses(expenses, filteredOrders);
  const totalActualPayAmount = getTotalActualPayAmount(filteredOrders);
  const totalPaidAmount = getTotalPaidAmount(filteredOrders);
  const totalPendingAmount = getTotalPendingAmount(filteredOrders);
  const netRevenue = totalPaidAmount - totalExpensesAmount;
  const successfulPayments = filteredOrders?.filter(order => order?.status === "paid") || [];
  const pendingPayments = filteredOrders?.filter(order => order?.status === "pending") || [];

  const companyChartData = days === "All" ? getAggregatedData(companyOrders) : getOrdersByDate(companyOrders, dates);
  const userChartData = days === "All" ? getAggregatedData(filteredOrders) : getOrdersByDate(filteredOrders, dates);
  const successfulPaymentsData = days === "All" ? getAggregatedData(successfulPayments) : getOrdersByDate(successfulPayments, dates);
  const pendingPaymentsData = days === "All" ? getAggregatedData(pendingPayments) : getOrdersByDate(pendingPayments, dates);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          Dashboard
        </h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Time Range:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] sm:w-[150px]">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="All">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DashboardStats
        companyOrders={companyOrders}
        filteredOrders={filteredOrders}
        successfulPayments={successfulPayments}
        totalActualPayAmount={totalActualPayAmount}
        totalPaidAmount={totalPaidAmount}
        totalPendingAmount={totalPendingAmount}
        totalExpensesAmount={totalExpensesAmount}
        netRevenue={netRevenue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <OrdersTrendChart title="Company Orders Trend" data={companyChartData} timeRange={timeRange}
          color="#0070f3" gradientId="colorOrders" bgClass="bg-indigo-50 dark:bg-indigo-900"
          iconColor="text-indigo-600 dark:text-indigo-400" />
        <OrdersTrendChart title="My Orders Trend" data={userChartData} timeRange={timeRange}
          color="#00b894" gradientId="colorMyOrders" bgClass="bg-teal-50 dark:bg-teal-900"
          iconColor="text-teal-600 dark:text-teal-400" />
        <OrdersTrendChart title="Successful Payments Trend" data={successfulPaymentsData} timeRange={timeRange}
          color="#2ecc71" gradientId="colorSuccess" bgClass="bg-green-50 dark:bg-green-900"
          iconColor="text-green-600 dark:text-green-400" />
        <OrdersTrendChart title="Pending Payments Trend" data={pendingPaymentsData} timeRange={timeRange}
          color="#f39c12" gradientId="colorPending" bgClass="bg-orange-50 dark:bg-orange-900"
          iconColor="text-orange-600 dark:text-orange-400" />
        <OrderDistributionChart top5Users={top5Users} filteredOrders={filteredOrders} timeRange={timeRange} />
        <UpcomingDeliveries orders={userOrders} />
      </div>
    </div>
  );
};

export default Dashboard;