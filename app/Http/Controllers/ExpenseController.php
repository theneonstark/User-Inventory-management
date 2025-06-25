<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    /**
     * Store a new expense record.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Define custom validation messages
        // dd("MESSAGE");

        $messages = [
            'expenses.min' => 'At least one expense amount must be added.',
        ];

        // Validate the request
        $validator = Validator::make($request->all(), Expense::$rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // dd($validator);
        // Additional validation: Ensure at least one expense has a valid amount
        $expenses = $request->input('expenses', []); // Default to empty array if null
        $hasValidAmount = collect($expenses)->contains(function ($expense) {
            return isset($expense['amount']) && is_numeric($expense['amount']) && $expense['amount'] > 0;
        });

        if (!$hasValidAmount) {
            return response()->json([
                'success' => false,
                'message' => 'At least one expense amount must be greater than zero.'
            ], 422);
        }

        try {
            // Create the expense record
            $expense = Expense::create([
                'order_id' => $request->input('order_id'),
                'expenses' => $expenses,
                'expense_date' => $request->input('expense_date'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Expense added successfully',
                'data' => [
                    'id' => $expense->id,
                    'order_id' => $expense->order_id,
                    'expense_count' => count($expense->expenses),
                ]
            ], 201);
        } catch (\Exception $e) {
            // Log the error for debugging (optional)
            \Log::error('Expense creation failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create expense',
                'error' => env('APP_DEBUG', false) ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Display a listing of expenses.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $expenses = Expense::orderBy('expense_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Expenses retrieved successfully',
                'data' => $expenses
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Expense fetch failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch expenses',
                'error' => env('APP_DEBUG', false) ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Display the specified expense.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $expense = Expense::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Expense retrieved successfully',
                'data' => $expense
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Expense not found',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Expense show failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve expense',
                'error' => env('APP_DEBUG', false) ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }
}