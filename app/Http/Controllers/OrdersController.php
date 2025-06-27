<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderpaymentLog;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrdersController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $orders = Order::all();
        return response()->json(['orders' => $orders]);
    }

    /**
     * Store a newly created order in storage.
     */
    public function store(Request $request)
    {
        $userId = Auth::id();

        // Validate request data with MySQL timestamp format
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|regex:/^\d{10}$/',
            'shippingAddress' => 'required|string|max:500',
            'userAddress' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'zip' => 'required|string|regex:/^\d{6}$/',
            'billing_number' => 'nullable|string|max:50',
            'paid_amount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'pending_payment' => 'required|numeric|min:0',
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|numeric|min:1',
            'products.*.From' => 'required|string|max:255',
            'products.*.product_price' => 'required|numeric|min:0',
            'products.*.total_price' => 'required|numeric|min:0',
            'delivered_date' => 'required|date_format:Y-m-d',
            // 'pickup_time' => 'required|date_format:Y-m-d|after:delivered_date',
            'type' => 'nullable|string|in:checkout',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // Additional validation: check if paid_amount + pending_payment equals total_amount
        if (abs(($request->paid_amount + $request->pending_payment) - $request->total_amount) > 0.01) {
            return response()->json(['error' => 'Payment amounts must equal total amount'], 400);
        }

        try {
            // Start a database transaction
            DB::beginTransaction();

            // Parse dates with Carbon
            $deliveredDate = Carbon::parse($request->delivered_date);
            // $pickupTime = Carbon::parse($request->pickup_time);

            // Check product stock availability
            foreach ($request->products as $product) {
                $productModel = Product::find($product['product_id']);
                if (!$productModel) {
                    DB::rollBack();
                    return response()->json(['error' => "Product not found: {$product['product_id']}"], 404);
                }

                if ($productModel->stock_quantity < $product['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Insufficient stock for product ID {$product['product_id']}. Available: {$productModel->stock_quantity}, Requested: {$product['quantity']}"
                    ], 400);
                }
            }

            // Create the order
            $order = Order::create([
                'user_id' => $userId,
                'user_name' => $request->name,
                'user_email' => $request->email,
                'user_phone' => $request->phone,
                'user_address' => $request->userAddress,
                'shipping_address' => $request->shippingAddress,
                'user_city' => $request->city,
                'user_zip' => $request->zip,
                'billing_number' => $request->billing_number,
                'paid_payment' => $request->paid_amount,
                'total_amount' => $request->total_amount,
                'pending_payment' => $request->pending_payment,
                'products' => json_encode($request->products),
                'status' => $request->pending_payment > 0 ? 'pending' : 'paid',
                'delivered_date' => $deliveredDate->toDateTimeString(),
                // 'pickup_time' => $pickupTime->toDateTimeString(),
            ]);

            // Update product stock quantities
            foreach ($request->products as $product) {
                $productModel = Product::find($product['product_id']);
                $productModel->stock_quantity -= $product['quantity'];
                $productModel->save();
            }

            // Log payment
            $paymentLog = OrderpaymentLog::create([
                'order_id' => $order->id,
                'user_id' => $userId,
                'payment_amount' => $request->paid_amount,
            ]);

            // Clear cart if checkout
            if ($request->type === 'checkout') {
                Cart::where('user_id', $userId)->delete();
            }

            // Commit the transaction
            DB::commit();

            return response()->json([
                'message' => 'Order placed successfully.',
                'order' => $order,
                'payment_log' => $paymentLog,
                'type' => $request->type
            ], 201);

        } catch (\Exception $e) {
            // Roll back the transaction on error
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['error' => 'Order not found.'], 404);
        }
        return response()->json(['order' => $order]);
    }

    /**
     * Remove the specified order from storage.
     */
    public function destroy(string $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found.'], 404);
        }

        try {
            // Start a transaction
            DB::beginTransaction();

            // Restore product quantities
            $products = json_decode($order->products, true);
            foreach ($products as $product) {
                $productModel = Product::find($product['product_id']);
                if ($productModel) {
                    $productModel->stock_quantity += $product['quantity'];
                    $productModel->save();
                }
            }

            // Update order status to canceled
            $order->status = 'canceled';
            $order->save();

            // Commit the transaction
            DB::commit();

            return response()->json(['message' => 'Order status updated to canceled and product quantities restored.']);
        } catch (\Exception $e) {
            // Roll back the transaction on error
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to cancel order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch all orders for the authenticated user.
     */
    public function AuthOrders()
    {
        $userId = Auth::id();
        $orders = Order::where('user_id', $userId)->get();
        return response()->json(['orders' => $orders ?: 'No orders found.']);
    }

    /**
     * Check product availability for given dates.
     */
    public function checkAvailability(Request $request)
    {
        // Validate the request with MySQL timestamp format
        $validator = Validator::make($request->all(), [
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|numeric|min:1',
            'delivered_date' => 'required|date_format:Y-m-d',
            // 'pickup_date' => 'required|date_format:Y-m-d|after:delivered_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            $deliveredDate = Carbon::parse($request->delivered_date);
            // $pickupDate = Carbon::parse($request->pickup_date);

            $availability = [];

            foreach ($request->products as $product) {
                $productModel = Product::find($product['product_id']);
                if (!$productModel) {
                    return response()->json([
                        'error' => "Product not found: {$product['product_id']}"
                    ], 404);
                }

                $requestedQty = $product['quantity'];

                // Get total quantity reserved for this product between delivered_date and pickup_date
                $reservedQty = Order::where('status', '!=', 'canceled')
                    ->where(function ($query) use ($deliveredDate/*, $pickupDate*/) {
                        $query->where(function ($q) use ($deliveredDate/*, $pickupDate*/) {
                            $q->whereBetween('delivered_date', [$deliveredDate/*, $pickupDate*/])
                              ->orWhereBetween('pickup_time', [$deliveredDate/*, $pickupDate*/])
                              ->orWhere(function ($q) use ($deliveredDate/*, $pickupDate*/) {
                                  $q->where('delivered_date', '<=', $deliveredDate)
                                    ->where('pickup_time', '>=', /*$pickupDate*/$deliveredDate);
                              });
                        });
                    })
                    ->get()
                    ->sum(function ($order) use ($product) {
                        $products = json_decode($order->products, true);
                        $matchedProduct = array_filter($products, fn($p) => $p['product_id'] == $product['product_id']);
                        return !empty($matchedProduct) ? array_values($matchedProduct)[0]['quantity'] : 0;
                    });

                // Calculate the available quantity
                $availableQty = max(0, $productModel->stock_quantity - $reservedQty);
                $isAvailable = $availableQty >= $requestedQty;

                $availability[$product['product_id']] = [
                    'available' => $isAvailable,
                    'message' => $isAvailable 
                        ? "Available: $availableQty in stock" 
                        : "Not enough stock. Only $availableQty available",
                    'available_quantity' => $availableQty
                ];
            }

            return response()->json($availability);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to check availability: ' . $e->getMessage()
            ], 500);
        }
    }
}