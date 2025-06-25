import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts";

const OrdersTrendChart = ({ title, data, timeRange, color, gradientId, bgClass, iconColor }) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
    <CardHeader className={`${bgClass} p-4 rounded-t-lg`}>
      <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100 text-lg sm:text-xl font-semibold">
        <TrendingUp className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor}`} />
        {title}
      </CardTitle>
      <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
        {timeRange === "All" ? "All time" : `Last ${timeRange} days`}
      </CardDescription>
    </CardHeader>
    <CardContent className="p-4 sm:p-6">
      <ResponsiveContainer width="100%" height={300}>
        {data.length > 0 ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
            <XAxis dataKey="date" stroke="#666" tick={{ fill: "#666", fontSize: 12 }}
              tickFormatter={(value) => timeRange === "All" ? value : value.split("-").slice(1).join("-")} />
            <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
            <Area type="monotone" dataKey="orders" stroke={color} strokeWidth={2}
              fill={`url(#${gradientId})`} dot={{ r: 4, fill: color }} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e0e0e0" }}
              labelStyle={{ color: "#333" }} itemStyle={{ color }}
              labelFormatter={(value) => `Date: ${value}`} formatter={(value) => Math.round(value)} />
          </AreaChart>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
            No data available for this range
          </div>
        )}
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default OrdersTrendChart;