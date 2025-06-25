<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\OrderpaymentLog; // Use the new model

class PendingPaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function PendingPayment(Request $request)
    {
        $userId = Auth::id(); // Get authenticated user's ID
    
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'payment_amount' => 'required|numeric|min:0',
        ]);
    
        // Fetch the order
        $order = Order::where('user_id', $userId)
            ->where('id', $request->input('order_id'))
            ->first();
    
        if (!$order) {
            return response()->json(['error' => 'Order not found or unauthorized access.'], 404);
        }
    
        // Validate payment amount
        if ($request->input('payment_amount') > $order->pending_payment) {
            return response()->json(['error' => 'Payment exceeds pending amount.'], 400);
        }
    
        // Update order payment details
        $order->paid_payment += $request->input('payment_amount');
        $order->pending_payment -= $request->input('payment_amount');
        
        // Save the payment attempt in the 'orderpayment_logs' table
        OrderpaymentLog::create([
            'order_id' => $order->id,
            'user_id' => $userId,
            'payment_amount' => $request->input('payment_amount'),
        ]);
    
        // If pending payment is 0, update the status to "paid"
        if ($order->pending_payment == 0.00) {
            $order->status = 'paid';
        }
    
        $order->save();
    
        return response()->json([
            'message' => 'Payment successful.',
            'order' => $order,
        ]);
    }
    
    
}
