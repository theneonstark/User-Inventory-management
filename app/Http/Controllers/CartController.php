<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller {
    public function store(Request $request) {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            // 'quantity' => 'required|numeric|min:1'
        ]);

        $user = Auth::user(); // Assuming user is authenticated

        // Check if product already exists in cart
        $cartItem = Cart::where('user_id', $user->id)
                        ->where('product_id', $request->product_id)
                        ->first();

        if ($cartItem) {
            // Update quantity if already in cart
            $cartItem->quantity += $request->quantity;
            $cartItem->save();
        } else {
            // Add new item to cart
            Cart::create([
                'user_id' => $user->id,
                'product_id' => $request->product_id,
                'quantity' => $request->quantity
            ]);
        }

        return response()->json(['message' => 'Product added to cart successfully'], 201);
    }

    public function updateQuantity(Request $request) {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            // 'quantity' => 'required|numeric|min:1'
        ]);

        $user = Auth::user(); // Assuming user is authenticated

        // Find cart item
        $cartItem = Cart::where('user_id', $user->id)
                        ->where('product_id', $request->product_id)
                        ->first();

        if ($cartItem) {
            // Update the quantity
            $cartItem->quantity = $request->quantity;
            $cartItem->save();
            return response()->json(['message' => 'Quantity updated successfully']);
        }

        return response()->json(['message' => 'Item not found in cart'], 404);
    }

    public function removeItem(Request $request) {
        $request->validate([
            'product_id' => 'required'
        ]);

        $user = Auth::user(); // Assuming user is authenticated

        // Find and remove item
        $cartItem = Cart::where('user_id', $user->id)
                        ->where('product_id', $request->product_id)
                        ->first();

        if ($cartItem) {
            $cartItem->delete();
            return response()->json(['message' => 'Item removed from cart']);
        }

        return response()->json(['message' => 'Item not found in cart'], 404);
    }
}
