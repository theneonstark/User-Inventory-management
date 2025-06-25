<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // Define the table name (if it's different from the plural form of the model name)
    protected $table = 'products';

    // Specify the columns that can be mass-assigned
    protected $fillable = [
        'productName',
        'companyName',
        'category',
        'owned_imported',
        'price',
        'stock_quantity',
        'description',
    ];

    // No need to cast 'images' anymore since it's not being used
}

