import React, { useState } from "react";
import { FaShoppingCart, FaSearch, FaSun, FaMoon } from "react-icons/fa";

const products = [
  { id: 1, name: "Product 1", price: 20, stock: 10, image: "https://via.placeholder.com/150" },
  { id: 2, name: "Product 2", price: 30, stock: 5, image: "https://via.placeholder.com/150" },
  // Add more products
];

const ProductPage = () => {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const placeOrder = () => {
    setOrders([...orders, { id: orders.length + 1, items: cart, date: new Date() }]);
    setCart([]);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Header */}
      <header className="p-4 bg-white shadow-md dark:bg-gray-800">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">IMS Product Page</h1>
          <div className="flex items-center space-x-4">
            <FaSearch className="cursor-pointer" />
            <div className="relative">
              <FaShoppingCart className="cursor-pointer" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 text-xs">
                  {cart.length}
                </span>
              )}
            </div>
            {darkMode ? (
              <FaSun className="cursor-pointer" onClick={() => setDarkMode(false)} />
            ) : (
              <FaMoon className="cursor-pointer" onClick={() => setDarkMode(true)} />
            )}
          </div>
        </div>
      </header>

      {/* Product Listing */}
      <main className="container mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
              <img src={product.image} alt={product.name} className="w-full h-32 object-cover mb-4" />
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p>Price: ${product.price}</p>
              <p>Stock: {product.stock}</p>
              <button
                onClick={() => addToCart(product)}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Section */}
      <div className="fixed bottom-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Cart</h2>
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between items-center mb-2">
            <span>{item.name}</span>
            <span>${item.price}</span>
          </div>
        ))}
        <button
          onClick={placeOrder}
          className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default ProductPage;