<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'image']; // Add 'image' to the fillable attributes

    // Optionally, you can create a function to return the full image URL
    public function getImageUrlAttribute()
    {
        return asset('storage/categories/' . $this->image);
    }
}
