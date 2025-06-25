import { useEffect, useState } from "react";
import { Eye, Filter, IndianRupee, ShoppingCart, Search } from "lucide-react";
import cn from "classnames";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "@inertiajs/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import productService from "@/lib/Services/product";

export function AllProducts() {
  const [filter, setFilter] = useState("All Categories");
  const [dateFilter, setDateFilter] = useState("Newest");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await productService.getAllProducts();
        const categoriesResponse = await productService.getCategories();
        setProducts(productsResponse.data.products || []);
        setCategories(categoriesResponse.data.categories || []);
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err.message);
        toast.error("Failed to load products or categories");
      }
    };
    fetchData();
  }, []);

  const endpoint = import.meta.env.VITE_ENVIRONMENT === "production" 
      ? `${import.meta.env.VITE_API_BASE_URL}/cart`
      : "/cart";

  // Filter and sort products
  const filteredProducts = () => {
    let filtered = [...products];

    if (filter !== "All Categories") {
      filtered = filtered.filter((product) => product.category === filter);
    }

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateFilter === "Newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setIsModalOpen(true);
  };

  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct || quantity <= 0) return;

    try {
      const response = await axios.post(endpoint, {
        product_id: selectedProduct.id,
        quantity,
      });

      if (response?.status === 201) {
        setCart([...cart, { ...selectedProduct, quantity }]);
        toast.success(`${selectedProduct.category} added to cart`, { autoClose: 2000 });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error adding to cart:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to add product to cart");
    }
  };

  const defaultImage = "https://i.pinimg.com/736x/df/9f/a9/df9fa9eb2ac17ed7794706eb5c7f877c.jpg";

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-50 via-gray-100 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 min-h-screen">
      <ToastContainer/>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
          All Products
        </h1>
        <Link href={endpoint}>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 shadow-md"
          >
            <ShoppingCart className="h-5 w-5" /> View Cart
          </Button>
        </Link>
      </div>

      {/* Filter Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search products..."
              className="pl-12 w-full rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 dark:text-indigo-300" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Category:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px] rounded-lg shadow-md bg-indigo-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-indigo-300 dark:border-gray-600">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                  <SelectItem value="All Categories" className="text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-700">
                    All Categories
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.name}
                      className="text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-700"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sort by Date:</span>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px] rounded-lg shadow-md bg-indigo-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-indigo-300 dark:border-gray-600">
                  <SelectValue placeholder="Newest" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                  <SelectItem value="Newest" className="text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-700">
                    Newest
                  </SelectItem>
                  <SelectItem value="Oldest" className="text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-700">
                    Oldest
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Product List */}
        {products.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-lg py-6 animate-pulse">Loading products...</div>
        ) : filteredProducts().length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-lg py-6">No products match your filters</div>
        ) : (
          <div className="space-y-6">
            {filteredProducts().map((product) => (
              <Card
                key={product.id}
                className="shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  {/* Image */}
                  <div className="flex-shrink-0 relative">
                    <img
                      src={product.image || defaultImage}
                      alt={product.productName}
                      className="w-full sm:w-36 h-36 object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105"
                    />
                    <span
                      className={cn(
                        "absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-semibold shadow-sm",
                        product.status === "Available" && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                        product.status === "Low Stock" && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
                        product.status === "Out" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      )}
                    >
                      {product.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {/* <h3 className="font-semibold text-xl text-gray-800 dark:text-gray-100 tracking-tight">{product.productName}</h3> */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{product.category}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xl font-bold flex items-center text-indigo-600 dark:text-indigo-300">
                      <IndianRupee size={18} className="mr-1" />
                      {product.selling_price} Per KG
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Stock: <span className="font-medium">{product.stock_quantity}</span></p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-2 sm:mt-0 sm:ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openProductModal(product)}
                      className="text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg shadow-md transition-all duration-300"
                    >
                      <Eye className="h-5 w-5 mr-2" /> View
                    </Button>
                    {/* Uncomment if Order button is needed */}
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openOrderModal(product)}
                      className="text-indigo-600 dark:text-indigo-300 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg shadow-md transition-all duration-300"
                      disabled={product.status === "Out"}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" /> Order
                    </Button> */}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-indigo-200 dark:border-gray-700 animate-fade-in">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {selectedProduct.productName}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">Explore product details below</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <img
                src={selectedProduct.image || defaultImage}
                alt={selectedProduct.productName}
                className="w-full h-56 object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105"
              />
              <div className="space-y-3">
                {/* <p className="text-gray-700 dark:text-gray-300"><strong className="text-indigo-600 dark:text-indigo-300">Name:</strong> {selectedProduct.productName}</p> */}
                <p className="text-gray-700 dark:text-gray-300"><strong className="text-indigo-600 dark:text-indigo-300">From:</strong> {selectedProduct.companyName || selectedProduct.shop_name}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong className="text-indigo-600 dark:text-indigo-300">Category:</strong> {selectedProduct.category}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong className="text-indigo-600 dark:text-indigo-300">Stock:</strong> {selectedProduct.stock_quantity}</p>
                <p className="text-gray-700 dark:text-gray-300 flex items-center">
                  <strong className="text-indigo-600 dark:text-indigo-300">Price:</strong>
                  <IndianRupee size={18} className="ml-1 mr-1 text-indigo-600 dark:text-indigo-300" />
                  <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{selectedProduct.selling_price} Per KG</span>
                </p>
                {/* <p className="text-gray-700 dark:text-gray-300"><strong className="text-indigo-600 dark:text-indigo-300">Description:</strong> {selectedProduct.description || "N/A"}</p> */}
                <p className="text-gray-700 dark:text-gray-300">
                  <strong className="text-indigo-600 dark:text-indigo-300">Added On:</strong>{" "}
                  {new Date(selectedProduct.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-4 mt-4 items-center">
                <Input
                  type="number"
                  step="0.1" // Allows decimals with one decimal place
                  value={quantity}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setQuantity(Math.max(0.1, Math.min(selectedProduct.stock_quantity, value)));
                    }
                  }}
                  min="0.1"
                  max={selectedProduct.stock_quantity}
                  className="w-24 rounded-lg shadow-md border-indigo-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                />
                <Button
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  disabled={selectedProduct.stock_quantity === 0 || quantity > selectedProduct.stock_quantity}
                >
                  Add to Cart
                </Button>
              </div>
              {selectedProduct.stock_quantity === 0 && (
                <p className="text-red-500 text-sm animate-pulse">This product is out of stock.</p>
              )}
              {quantity > selectedProduct.stock_quantity && selectedProduct.stock_quantity > 0 && (
                <p className="text-red-500 text-sm animate-pulse">Quantity exceeds available stock.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Order Modal */}
      {selectedProduct && (
        <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
          <DialogContent className="max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-indigo-200 dark:border-gray-700 animate-fade-in">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Order {selectedProduct.productName}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">Place an order for this product</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-gray-700 dark:text-gray-300"><strong className="text-indigo-600 dark:text-indigo-300">Product:</strong> {selectedProduct.productName}</p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center">
                <strong className="text-indigo-600 dark:text-indigo-300">Price:</strong>
                <IndianRupee size={18} className="ml-1 mr-1 text-indigo-600 dark:text-indigo-300" />
                <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-300">{selectedProduct.price}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300"><strong className="text-indigo-600 dark:text-indigo-300">Stock Available:</strong> {selectedProduct.stock_quantity}</p>
              <div className="flex gap-4 mt-4">
                {/* Uncomment if needed */}
                {/* <Link href={`/addorder/${selectedProduct.id}`}>
                  <Button
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                    disabled={selectedProduct.stock_quantity === 0}
                  >
                    Place Order
                  </Button>
                </Link> */}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}