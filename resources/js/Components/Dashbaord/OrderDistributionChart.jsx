import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#6b7280", "#f97316", "#22c55e", "#3b82f6", "#a855f7"];

const OrderDistributionChart = ({ top5Users, filteredOrders, timeRange }) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 col-span-1 lg:col-span-2">
    <CardHeader className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-t-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100 text-lg sm:text-xl font-semibold">
          <Users className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
          Order Distribution (Top 5 Users)
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          {timeRange === "All" ? "All time" : `Last ${timeRange} days`}
        </CardDescription>
      </div>
      <div className="flex items-center gap-2 mt-2 sm:mt-0 bg-indigo-100 dark:bg-indigo-800 px-3 py-1 rounded-lg">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Orders:</span>
        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{filteredOrders.length}</span>
      </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-6">
      <ResponsiveContainer width="100%" height={300}>
        {top5Users.length > 0 ? (
          <PieChart>
            <Pie data={top5Users} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%"
              paddingAngle={5} animationDuration={800} animationBegin={100} labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}>
              {top5Users.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e0e0e0" }}
              labelStyle={{ color: "#333" }} formatter={(value, name) => [`${value} orders`, name]} />
            <Legend layout="vertical" verticalAlign="middle" align="right"
              wrapperStyle={{ paddingLeft: "20px", fontSize: "14px", color: "#333" }}
              formatter={(value, entry) => (
                <span style={{ color: COLORS[entry.payload.payload.fill ? COLORS.indexOf(entry.payload.payload.fill) : 0] }}>
                  {value}: {entry.payload.value}
                </span>
              )} />
          </PieChart>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
            No user data available
          </div>
        )}
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default OrderDistributionChart;