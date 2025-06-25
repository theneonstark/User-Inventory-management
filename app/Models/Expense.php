<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'order_id',
        'expenses',
        'expense_date',
    ];

    protected $casts = [
        'expenses' => 'array', // Automatically cast JSON to array
        'expense_date' => 'date',
    ];

    // Validation rules
    public static $rules = [
        'order_id' => 'required|string|max:255',
        'expenses' => 'required|array|min:1',
        'expenses.*.type' => 'required|string|',
        'expenses.*.amount' => 'required|numeric|min:0',
        'expense_date' => 'required|date',
    ];
}