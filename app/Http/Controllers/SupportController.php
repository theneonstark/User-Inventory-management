<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\SupportRequest;
use Exception;
use Illuminate\Support\Facades\Auth;

class SupportController extends Controller
{
    /**
     * Store a new support request
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'subject' => 'required|string|max:255',
                'priority' => 'required|in:low,medium,high,urgent',
                'message' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $supportRequest = SupportRequest::create([
                'name' => $request->name,
                'email' => $request->email,
                'subject' => $request->subject,
                'priority' => $request->priority,
                'message' => $request->message,
                'status' => 'pending',
                'user_id' => Auth::id(), // Add authenticated user's ID
            ]);

            // Here you could add email notification to admin
            // Mail::to('admin@example.com')->send(new SupportRequestReceived($supportRequest));

            return response()->json([
                'success' => true,
                'message' => 'Support request submitted successfully',
                'data' => $supportRequest
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit support request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show all support requests for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            // Ensure the user is authenticated
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to view your support requests.',
                ], 401);
            }

            // Fetch all support requests for the authenticated user
            $supportRequests = SupportRequest::where('user_id', Auth::id())
                ->orderBy('created_at', 'desc') // Latest first
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Support requests retrieved successfully',
                'data' => $supportRequests
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve support requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}