<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    // The table associated with the model
    protected $table = 'userorders';

    // The attributes that are mass assignable
    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'user_phone',
        'user_address',
        'user_city',
        'user_zip',
        'paid_payment',
        'total_amount',
        'pending_payment',
        'products', // Store the products as a JSON field
        'delivered_date',
        'status',
        'billing_number',
        'shipping_address',
        // 'pickup_time'
    ];

    // If the products column is a JSON field, you can cast it to an array
    protected $casts = [
        'products' => 'array',  // Automatically cast the 'products' field to an array
    ];

    public function getUpdateAtAttribute($value)
    {
        return date('d M y - h:i A', strtotime($value));
    }

    public function getCreatedAtAttribute($value)
    {
        return date('d M y - h:i A', strtotime($value));
    }
}
