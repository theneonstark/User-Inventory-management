<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderpaymentLog extends Model
{
    use HasFactory;

    protected $table = 'orderpayment_logs'; // Define the custom table name

    protected $fillable = [
        'order_id',
        'user_id',
        'payment_amount',
    ];
}
