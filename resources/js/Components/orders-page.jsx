import { useEffect, useState } from "react";
import { IndianRupee, Eye, XCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import orderService from "@/lib/Services/orders";
import payment from "@/lib/Services/paypendingpayment";
import axios from "axios";
import { format, parseISO } from "date-fns"; // Add parseISO for parsing ISO dates


const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderExpenses, setOrderExpenses] = useState([]);
  console.log(selectedOrder);
  
  const apiUrl =
  import.meta.env.VITE_ENVIRONMENT === "production"
    ? `${import.meta.env.VITE_API_BASE_URL}/api/expenses`
    : "/api/expenses";
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await orderService.getUserOrders();
        const parsedOrders = response.orders.map((order) => ({
          ...order,
          products: typeof order.products === "string" ? JSON.parse(order.products) : order.products,
        }));
        setOrders(parsedOrders || []);

        const expensesResponse = await axios.get(apiUrl);
        setOrderExpenses(expensesResponse.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const endOfDay = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products.some((product) => product.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "All" || order.status === statusFilter.toLowerCase();
    const deliveredDate = order.delivered_date ? new Date(order.delivered_date) : null;
    const matchesDate =
      (!startDate || (deliveredDate && deliveredDate >= new Date(startDate))) &&
      (!endDate || (deliveredDate && deliveredDate <= endOfDay(endDate)));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Not Delivered";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePayPending = (order) => {
    setSelectedOrder(order);
    setPaymentAmount("");
    setIsPayDialogOpen(true);
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setIsCancelDialogOpen(true);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedOrder || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    try {
      await payment.PendingPayment(selectedOrder.id, paymentAmount);
      toast.success("Payment successful!");
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                pending_payment: String(Number(o.pending_payment) - Number(paymentAmount)),
                status: Number(o.pending_payment) - Number(paymentAmount) <= 0 ? "paid" : o.status,
              }
            : o
        )
      );
      setIsPayDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Payment failed. Please try again.");
    }
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      await orderService.cancelOrder(selectedOrder.id);
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === selectedOrder.id ? { ...o, status: "canceled" } : o))
      );
      toast.success("Order canceled successfully!");
      setIsCancelDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to cancel the order.");
    }
  };

  const calculateTotalExpenses = (orderId) => {
    const expensesForOrder = orderExpenses.filter(exp => exp.order_id === orderId.toString());
    return expensesForOrder.reduce((total, exp) => 
      total + exp.expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0), 0
    ).toFixed(2);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen text-gray-500">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-900 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Your Orders</h1>

      {/* Filter Section */}
      <div className="flex flex-col gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Input
            placeholder="Search by User Name or Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-lg shadow-sm border-gray-300 dark:border-gray-600"
          />
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="flex flex-col w-full sm:w-40">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg shadow-sm border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="flex flex-col w-full sm:w-40">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg shadow-sm border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="flex flex-col w-full sm:w-40">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border p-2 rounded-lg shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Canceled">Canceled</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table for Larger Screens */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-700">
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Order ID</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Client Name</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Delivered Date</TableHead>
              {/* <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Pickup Date</TableHead> */}
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Products</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Quantity</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Address</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Total</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Pending</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Paid</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-200 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <TableCell className="text-gray-800 dark:text-gray-200">ARYAN{order.id}</TableCell>
                  <TableCell className="text-gray-800 dark:text-gray-200">{order.user_name}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{order.delivered_date}</TableCell>
                  {/* <TableCell className="text-gray-600 dark:text-gray-400">{order.pickup_time}</TableCell> */}
                  <TableCell className="text-gray-800 dark:text-gray-200">{order.products.length} Products</TableCell>
                  <TableCell className="text-gray-800 dark:text-gray-200">{order.products.reduce((acc, p) => acc + p.quantity, 0)}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">
                    {order.shipping_address}
                  </TableCell>
                  <TableCell className="text-gray-800 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <IndianRupee size={14} /> {Number(order.total_amount).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-800 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <IndianRupee size={14} /> {Number(order.pending_payment).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-800 dark:text-gray-200">
                    <div className="flex items-center gap-1">
                      <IndianRupee size={14} /> {Number(order.paid_payment).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === "pending"
                          ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200"
                          : order.status === "canceled"
                          ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200"
                          : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {order.status === "pending" ? <Clock size={12} /> : order.status === "canceled" ? <XCircle size={12} /> : <CheckCircle size={12} />}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        className={`px-3 ${
                          order.status === "pending"
                            ? "bg-red-600 hover:bg-red-700"
                            : order.status === "canceled"
                            ? "bg-orange-500"
                            : "bg-green-600"
                        } text-white`}
                        onClick={() => order.status === "pending" && handlePayPending(order)}
                        disabled={order.status !== "pending"}
                      >
                        {order.status === "pending" ? "Pay" : order.status === "canceled" ? "Canceled" : "Paid"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)}>
                        <Eye size={16} />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        onClick={() => handleCancelOrder(order)}
                        disabled={order.status === "canceled" || order.status === "paid"}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards for Smaller Screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Order #{order.id}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Client:</strong> {order.user_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Delivered:</strong> {formatDate(order.delivered_date)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Products:</strong> {order.products.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Quantity:</strong> {order.products.reduce((acc, p) => acc + p.quantity, 0)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Total:</strong> ₹{Number(order.total_amount).toFixed(2)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Pending:</strong> ₹{Number(order.pending_payment).toFixed(2)}</p>
                <p className="text-sm">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`font-semibold ${
                      order.status === "pending"
                        ? "text-red-600"
                        : order.status === "canceled"
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </p>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className={`flex-1 ${
                    order.status === "pending"
                      ? "bg-red-600 hover:bg-red-700"
                      : order.status === "canceled"
                      ? "bg-orange-500"
                      : "bg-green-600"
                  } text-white`}
                  onClick={() => order.status === "pending" && handlePayPending(order)}
                  disabled={order.status !== "pending"}
                >
                  {order.status === "pending" ? "Pay" : order.status === "canceled" ? "Canceled" : "Paid"}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewDetails(order)}>
                  <Eye size={16} />
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={() => handleCancelOrder(order)}
                  disabled={order.status === "canceled" || order.status === "paid"}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-6">No orders found.</div>
        )}
      </div>

      {/* Pay Pending Confirmation Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-100">Confirm Payment</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Pay the pending amount for Order #{selectedOrder?.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pending Amount</label>
              <p className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                <IndianRupee size={15} /> {Number(selectedOrder?.pending_payment).toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Enter Amount</label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => {
                  const amount = Number(e.target.value);
                  if (amount >= 0 && amount <= Number(selectedOrder?.pending_payment)) {
                    setPaymentAmount(e.target.value);
                  } else {
                    toast.error("Amount must be between 0 and pending payment.");
                  }
                }}
                className="mt-1 border-gray-300 dark:border-gray-600"
                min="0"
                max={selectedOrder?.pending_payment}
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmPayment}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!paymentAmount || Number(paymentAmount) <= 0}
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-100">Confirm Cancellation</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to cancel Order #{selectedOrder?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Order
            </Button>
            <Button onClick={confirmCancelOrder} className="bg-red-600 hover:bg-red-700">
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-4xl bg-white dark:bg-gray-800 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Order Details - #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><strong>Created:</strong> {formatDate(selectedOrder.created_at)}</div>
                <div><strong>Phone:</strong> {selectedOrder.user_phone}</div>
                <div><strong>Delivered:</strong> {selectedOrder.delivered_date}</div>
                <div><strong>Pickup:</strong> {selectedOrder.pickup_time}</div>
                <div>
                  <strong>Client Address:</strong> {selectedOrder.user_address}, {selectedOrder.user_city}, {selectedOrder.user_zip}
                </div>
                <div>
                  <strong>Shipping Address:</strong> {selectedOrder.shipping_address}, {selectedOrder.user_city}, {selectedOrder.user_zip}
                </div>
                <div>
                  <strong>Total Amount:</strong>{" "}
                  <span className="flex items-center gap-1">
                    <IndianRupee size={15} /> {Number(selectedOrder.total_amount).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Pending:</strong>{" "}
                  <span className="flex items-center gap-1">
                    <IndianRupee size={15} /> {Number(selectedOrder.pending_payment).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Paid:</strong>{" "}
                  <span className="flex items-center gap-1">
                    <IndianRupee size={15} /> {Number(selectedOrder.paid_payment).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`font-semibold ${
                      selectedOrder.status === "pending"
                        ? "text-red-600"
                        : selectedOrder.status === "canceled"
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <strong>Products:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                  {selectedOrder.products.map((product, index) => (
                    <li key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="flex items-center gap-1">
                        {product.product_name} - {product.quantity} KG x <IndianRupee size={14} /> {Number(product.product_price).toFixed(2)} ={" "}
                        <IndianRupee size={14} /> {Number(product.total_price).toFixed(2)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">(From: {product.From})</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Expenses:</strong>
                {orderExpenses.filter(exp => exp.order_id === selectedOrder.id.toString()).length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {orderExpenses
                      .filter(exp => exp.order_id === selectedOrder.id.toString())
                      .map((expense, index) => (
                        <div key={index} className="border-t pt-2">
                          <p className="font-medium"><strong>Date:</strong> {format(parseISO(expense.expense_date), "yyyy-MM-dd")}</p>
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {expense.expenses.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <span>{item.type}:</span>
                                <span className="flex items-center">
                                  <IndianRupee size={14} /> {Number(item.amount).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    <p className="mt-2 font-medium">
                      <strong>Total Expenses:</strong>{" "}
                      <span className="flex items-center gap-1">
                        <IndianRupee size={15} /> {calculateTotalExpenses(selectedOrder.id)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No expenses recorded for this order.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700 w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}