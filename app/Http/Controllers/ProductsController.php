<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use App\Models\Product;

class ProductsController extends Controller
{
    public function index(Request $request)
    {
        // If no 'id' is provided, return all products
        $products = Product::all();
        return response()->json(['products' => $products], 200);
    }
    public function show(string $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['error' => 'Order not found.'], 404);
        }
        return response()->json(['product' => $product]);
    }
    public function getAllCategories()
    {
        $categories = Category::all();
        return response()->json(['categories' => $categories], 200);
    }
}
