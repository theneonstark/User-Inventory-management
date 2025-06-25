import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { format, parseISO, isWithinInterval, differenceInDays } from "date-fns";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ordersService from "@/lib/Services/orders";

const expenseTypes = [
  { value: "manpower", label: "Manpower" },
  { value: "food", label: "Food" },
  { value: "fair", label: "Fair" },
  { value: "fuel", label: "Fuel" },
  { value: "staffAdvance", label: "Staff Advance" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

export default function ExpenseForm() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetchedOrders, setFetchedOrders] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filterOrderId, setFilterOrderId] = useState("");
  const [filterDateRange, setFilterDateRange] = useState({ from: null, to: null });
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const ordersResponse = await ordersService.getUserOrders();
        const parsedOrders = ordersResponse.orders.map((order) => ({
          ...order,
          products: typeof order.products === "string" ? JSON.parse(order.products) : order.products,
        }));
        setFetchedOrders(parsedOrders || []);

        const expensesResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/expenses`);
        setAllExpenses(expensesResponse.data.data || []);
        setFilteredExpenses(expensesResponse.data.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = allExpenses;

    if (filterOrderId) {
      filtered = filtered.filter((expense) => expense.order_id.toString() === filterOrderId);
    }

    if (filterDateRange.from && filterDateRange.to) {
      filtered = filtered.filter((expense) =>
        isWithinInterval(parseISO(expense.expense_date), {
          start: filterDateRange.from,
          end: filterDateRange.to,
        })
      );
    }

    setFilteredExpenses(filtered);
  }, [filterOrderId, filterDateRange, allExpenses]);

  const form = useForm({
    defaultValues: {
      orderId: "",
      expenses: expenseTypes.map((type) => ({
        type: type.value,
        amount: undefined,
      })),
      otherExpenses: [],
      expenseDate: new Date(),
    },
    mode: "onSubmit",
  });

  const { fields, append } = useFieldArray({
    control: form.control,
    name: "otherExpenses",
  });

  const validateForm = (data) => {
    const hasExpenses =
      data.expenses.some((exp) => exp.amount > 0) ||
      (data.otherExpenses && data.otherExpenses.some((exp) => exp.amount > 0));

    if (!hasExpenses) {
      form.setError("expenses", {
        type: "manual",
        message: "At least one expense amount must be added.",
      });
      return false;
    }
    return true; // Removed delivered_date validation from here
  };

  const fetchOrderDetails = (orderId) => {
    setIsLoading(true);
    const order = fetchedOrders.find((o) => o.id.toString() === orderId);

    // Validate delivered_date immediately upon selection
    if (order && order.delivered_date) {
      const deliveredDate = new Date(order.delivered_date); // e.g., "Tue February 25, 2025"
      const today = new Date(); // March 24, 2025, per context
      const daysDifference = Math.abs(differenceInDays(deliveredDate, today));

      if (daysDifference > 7) {
        toast.error("Selected order's delivery date must be within 7 days from today.");
        setSelectedOrder(null); // Clear selection if invalid
        form.setValue("orderId", ""); // Reset orderId in form
        setIsLoading(false);
        return;
      }
    } else {
      toast.error("Selected order has no valid delivery date.");
      setSelectedOrder(null);
      form.setValue("orderId", "");
      setIsLoading(false);
      return;
    }

    // If valid, proceed with setting the selected order
    setTimeout(() => {
      setSelectedOrder(order || null);
      setIsLoading(false);
    }, 500);
  };

  const onSubmit = async (values) => {
    if (!validateForm(values)) return;

    const apiUrl =
    import.meta.env.VITE_ENVIRONMENT === "production"
      ? `${import.meta.env.VITE_API_BASE_URL}/api/expenses`
      : "/api/expenses";

    setIsLoading(true);
    try {
      const filledExpenses = values.expenses.filter(
        (exp) => exp.amount && exp.amount > 0
      );
      const allExpensesData = [...filledExpenses, ...(values.otherExpenses || [])];
      
      const response = await axios.post(apiUrl, {
        order_id: values.orderId,
        expenses: allExpensesData,
        expense_date: format(values.expenseDate, "yyyy-MM-dd"),
      });

      if (response.status === 201) {
        toast.success(
          `${response.data.data.expense_count} expense(s) added to order ${response.data.data.order_id}`
        );

        form.reset({
          orderId: "",
          expenses: expenseTypes.map((type) => ({
            type: type.value,
            amount: undefined,
          })),
          otherExpenses: [],
          expenseDate: new Date(),
        });
        setSelectedOrder(null);

       

        const expensesResponse = await axios.get(apiUrl);
        setAllExpenses(expensesResponse.data.data || []);
        setFilteredExpenses(expensesResponse.data.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit expenses");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalExpenses = (expenses) => {
    return expenses.reduce((total, exp) => total + parseFloat(exp.amount || 0), 0).toFixed(2);
  };

  const resetFilters = () => {
    setFilterOrderId("");
    setFilterDateRange({ from: null, to: null });
    setFilteredExpenses(allExpenses);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <ToastContainer />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Add Expense</CardTitle>
          <CardDescription>Add a new expense related to an order (within 7 days of delivery)</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Order ID</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? `ARYAN00${fetchedOrders.find((order) => order.id.toString() === field.value)?.id}`
                              : "Select order ID"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search order ID..." />
                          <CommandList>
                            <CommandEmpty>No order found.</CommandEmpty>
                            <CommandGroup>
                              {fetchedOrders.map((order) => (
                                <CommandItem
                                  key={order.id}
                                  value={order.id.toString()}
                                  onSelect={(value) => {
                                    form.setValue("orderId", value);
                                    fetchOrderDetails(value);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      order.id.toString() === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  ARYAN00{order.id}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {selectedOrder && !isLoading && (
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Order Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Customer Name</p>
                        <p className="text-sm">{selectedOrder.user_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Total</p>
                        <p className="text-sm">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Delivered Date</p>
                        <p className="text-sm">{selectedOrder.delivered_date}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Products</p>
                        <p className="text-sm">
                          {selectedOrder.products.map(p => p.product_name || 'Unknown').join(", ")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium mb-2">Expense Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expenseTypes.map((type, index) => (
                      <FormField
                        key={type.value}
                        control={form.control}
                        name={`expenses.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{type.label}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="pl-8"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-base font-medium mb-2">Other Expenses</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name={`otherExpenses.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter expense type" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`otherExpenses.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="pl-8"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ type: "", amount: undefined })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Other Expense
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name="expenseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Expense</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "yyyy-MM-dd") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading || !selectedOrder}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Add Expense"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Filter Expenses</CardTitle>
          <CardDescription>Filter expenses by order ID or date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Filter by Order ID</label>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !filterOrderId && "text-muted-foreground"
                    )}
                  >
                    {filterOrderId
                      ? `ARYAN00${fetchedOrders.find((order) => order.id.toString() === filterOrderId)?.id}`
                      : "Select order ID"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search order ID..." />
                    <CommandList>
                      <CommandEmpty>No order found.</CommandEmpty>
                      <CommandGroup>
                        {fetchedOrders.map((order) => (
                          <CommandItem
                            key={order.id}
                            value={order.id.toString()}
                            onSelect={(value) => {
                              setFilterOrderId(value);
                              setFilterOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                order.id.toString() === filterOrderId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            ARYAN00{order.id}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Filter by Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filterDateRange.from && !filterDateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateRange.from && filterDateRange.to
                      ? `${format(filterDateRange.from, "yyyy-MM-dd")} - ${format(filterDateRange.to, "yyyy-MM-dd")}`
                      : "Select date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={filterDateRange}
                    onSelect={(range) => setFilterDateRange({ from: range?.from, to: range?.to })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">All Expenses</CardTitle>
          <CardDescription>View all recorded expenses with order details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground">No expenses match the current filters.</p>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      Order ARYAN{expense.order_id} - {format(parseISO(expense.expense_date), "yyyy-MM-dd")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {expense.order_details && (
                        <>
                          <div>
                            <p className="text-sm font-medium">Customer Name</p>
                            <p className="text-sm">{expense.order_details.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Order Total</p>
                            <p className="text-sm">₹{parseFloat(expense.order_details.total_amount).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Delivered Date</p>
                            <p className="text-sm">{expense.order_details.delivered_date}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            <p className="text-sm">{expense.order_details.status}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium">Expenses:</p>
                      <ul className="list-disc pl-5 text-sm">
                        {expense.expenses.map((exp, idx) => (
                          <li key={idx}>
                            {exp.type}: ₹{parseFloat(exp.amount).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm font-medium mt-2">
                        Total Expenses: ₹{calculateTotalExpenses(expense.expenses)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}