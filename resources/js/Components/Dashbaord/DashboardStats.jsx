import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, Users, DollarSign, IndianRupee, Wallet } from "lucide-react";

const StatCard = ({ title, value, description, icon: Icon, colorClass, bgClass }) => (
  <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
    <CardHeader className={`${bgClass} p-4 rounded-t-lg`}>
      <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100 text-lg sm:text-xl font-semibold">
        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${colorClass}`} />
        {title}
      </CardTitle>
      <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">{description}</CardDescription>
    </CardHeader>
    <CardContent className="p-4">
      <p className={`text-3xl sm:text-4xl font-bold ${colorClass} flex items-center`}>
        {title.includes("Amount") || title.includes("Expenses") || title.includes("Revenue") ? (
          <><IndianRupee size={20} className="mr-1" /> {value.toFixed(2)}</>
        ) : (
          value
        )}
      </p>
    </CardContent>
  </Card>
);

const DashboardStats = ({
  companyOrders,
  filteredOrders,
  successfulPayments,
  totalActualPayAmount,
  totalPaidAmount,
  totalPendingAmount,
  totalExpensesAmount,
  netRevenue
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
    <StatCard title="Total Orders" value={companyOrders.length} description="All company orders" 
      icon={Package} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-900" />
    <StatCard title="My Orders" value={filteredOrders.length} description="Your personal orders" 
      icon={Users} colorClass="text-teal-600 dark:text-teal-400" bgClass="bg-teal-50 dark:bg-teal-900" />
    <StatCard title="Paid Orders" value={successfulPayments.length} description="Successful payments" 
      icon={CheckCircle} colorClass="text-green-600 dark:text-green-400" bgClass="bg-green-50 dark:bg-green-900" />
    <StatCard title="Total Order Amount" value={totalActualPayAmount} description="Total amount owed" 
      icon={Wallet} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-900" />
    <StatCard title="Total Paid Amount" value={totalPaidAmount} description="Total payments received" 
      icon={DollarSign} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-50 dark:bg-purple-900" />
    <StatCard title="Total Pending Amount" value={totalPendingAmount} description="Total amount pending" 
      icon={DollarSign} colorClass="text-orange-600 dark:text-orange-400" bgClass="bg-orange-50 dark:bg-orange-900" />
    <StatCard title="Total Expenses" value={totalExpensesAmount} description="All recorded expenses" 
      icon={DollarSign} colorClass="text-red-600 dark:text-red-400" bgClass="bg-red-50 dark:bg-red-900" />
    <StatCard title="Net Revenue" value={netRevenue} description="Revenue after expenses" 
      icon={DollarSign} colorClass="text-yellow-600 dark:text-yellow-400" bgClass="bg-yellow-50 dark:bg-yellow-900" />
  </div>
);

export default DashboardStats;