<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // Login method
    public function Userlogin(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
    
        // Find user by email
        $user = User::where('email', $validated['email'])->first();
    
        // Check if user exists and password matches
        if ($user && Hash::check($validated['password'], $user->password)) {
            
            // Check if user status is 1 or role is 'User'
            if ($user->status == 1 && $user->role == 'User') {
                Auth::login($user);
    
                return response()->json([
                    'message' => 'Login successful',
                    'redirect' => env('VITE_ENVIRONMENT') === 'production' 
                    ? '/user/public/Home' 
                    : '/Home', // Dynamic redirect based on environment

                ]);
            }
    
            return response()->json(['message' => 'Access denied. Unauthorized user.'], 403);
        }
    
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    // Register method
    public function store(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|string|max:255',
            'password' => 'required|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create the use
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'password' => Hash::make($request->password), // Hash the password
        ]);

        // Automatically log in the newly created user
        Auth::login($user);

        return response()->json(['message' => 'User created successfully', 'user' => $user], 201);
    }

    // Get all users
    public function getAllUsers(Request $request)
    {
        // Fetch all users with pagination (for performance)
        $users = User::paginate(10);  // Adjust the pagination count as needed
        return response()->json(['users' => $users], 200);
    }

    // Logout method
    public function logout(Request $request)
    {
        Auth::logout();
    
        // Redirect dynamically based on environment
        $redirectPath = env('VITE_ENVIRONMENT') === 'production' 
            ? 'https://crm.aryanevents.com/user/public'   // Production logout path
            : '/';  // Local logout path
    
        return redirect($redirectPath);
    }
    
    
    // Get logged-in user data
    public function getLoggedInUser(Request $request)
    {
        $user = Auth::user(); // Get the currently authenticated user
        return response()->json(['user' => $user], 200);
    }
}
