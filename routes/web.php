<?php

use App\Http\Controllers\SupportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\PendingPaymentController;
use App\Http\Controllers\ProductsController;
use App\Models\Cart;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::get('/', function () {
    return Inertia::render('Auth/Login');
})->middleware('guest');
Route::post('/Userlogin', [AuthController::class, 'Userlogin'])->middleware('guest');
Route::post('/store', [AuthController::class, 'store']);
Route::get('/logout', [AuthController::class, 'logout'])->name('logout');
Route::get('/logged-in-user', [AuthController::class, 'getLoggedInUser']);

Route::group(['middleware' => 'auth'], function() {
    
    
    
});
Route::get('Home', function () {
    return Inertia::render('Home');
});

Route::get('test', function () {
    return Inertia::render('TestPage');
});
Route::get('orders', function () {
    return Inertia::render('Orders');
});
Route::get('AllProduct', function () {
    return Inertia::render('AllProducts');
});
Route::get('Expenses', function () {
    return Inertia::render('Expenses_form');
});
Route::get('Support', function () {
    return Inertia::render('SubmitSupport');
});
Route::get('checkout', function () {

    
    $userId = Auth::id();
    $cartItems = Cart::with('product')
        ->where('user_id', $userId)
        ->get();
    return Inertia::render('Checkout', ['cartItems' => $cartItems]);

});
Route::get('cart', function () {

    $userId = Auth::id();
    $cartItems = Cart::with('product')
        ->where('user_id', $userId)
        ->get();

    return Inertia::render('Cart', ['cartItems' => $cartItems]);
});
Route::get('addorder/{id}', function ($id) {
    // Pass the `id` as a prop to the React component
    return Inertia::render('AddOrder', [
        'id' => $id,  // Pass the ID as a prop
    ]);
});
// Route::get('/getproducts', [ProductsController::class, 'getAllProduct']);
// Route::post('/OrderStore', [OrderController::class, 'Orderstore']); // For fetching all products or by id
// Route::post('/pay-pending-payment', [OrderController::class, 'payPendingPayment']); // For fetching all products or by id
// Route::get('/userorders', [OrderController::class, 'getAllOrders']); // For fetching all products or by id


Route::post('cart', [CartController::class, 'store']);

    // Update quantity of product in cart
    Route::put('cart/update', [CartController::class, 'updateQuantity']);

    // Remove item from cart
    Route::delete('cart/remove', [CartController::class, 'removeItem']);










    Route::prefix('api')->group(function () {
        // Resource route for orders
        Route::resource('orders', OrdersController::class);
    
        // Custom route for fetching orders by authenticated user
        Route::get('auth-orders', [OrdersController::class, 'AuthOrders']);
    });



    Route::prefix('api')->group(function () {
        Route::prefix('order')->group(function () {
            Route::get('/', [OrdersController::class, 'index']); // Fetch all orders
            Route::post('/', [OrdersController::class, 'store']); // Place a new order
            Route::get('/{id}', [OrdersController::class, 'show']); // Get a single order
            Route::put('/{id}', [OrdersController::class, 'update']); // Update order payment
            Route::post('/{id}', [OrdersController::class, 'destroy']); // Delete an order
            Route::get('user/order', [OrdersController::class, 'AuthOrders']); // Get 
        });
        //Check Stock availability
        Route::post('/check-availability', [OrdersController::class, 'checkAvailability']);
    
        Route::prefix('products')->group(function () {
            Route::get('/', [ProductsController::class, 'index']); // Fetch all products
            Route::get('/{id}', [ProductsController::class, 'show']); // Fetch product by ID
        });
        Route::prefix('PayPendingPayment')->group(function () {
            Route::post('/', [PendingPaymentController::class, 'PendingPayment']);
        });

        Route::prefix('categories')->group(function () {
            Route::get('/', [ProductsController::class, 'getAllCategories']); // Get all categories

        });
        Route::prefix('support')->group(function () {
            Route::post('/', [SupportController::class, 'store']); // Store support request
            Route::get('/', [SupportController::class, 'index']); // Store support request
        });

        Route::prefix('expenses')->group(function () {
            Route::post('/', [ExpenseController::class, 'store']);
            Route::get('/', [ExpenseController::class, 'index']);
            Route::get('/{id}', [ExpenseController::class, 'show']);
        });
    });
    
