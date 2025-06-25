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
import Dashboard from "./Dashboard";
import productService from "@/lib/Services/product";
import { toast } from "react-toastify";

export function ProductsPage() {
  const [filter, setFilter] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const API_URL =
  import.meta.env.VITE_ENVIRONMENT === "production"
    ? `${import.meta.env.VITE_API_BASE_URL}/cart`
    : "/cart";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productService.getAllProducts(),
          productService.getCategories(),
        ]);
        setProducts(productsResponse.data.products || []);
        setCategories(categoriesResponse.data.categories || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load products or categories");
      }
    };
    fetchData();
  }, []);

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

    return filtered.slice(0, 6); // Limit to 6 products
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
    if (!selectedProduct || quantity <= 0 || quantity > selectedProduct.stock_quantity) {
      toast.error(quantity <= 0 ? "Quantity must be at least 1" : "Quantity exceeds available stock");
      return;
    }

    try {
     

      const response = await axios.post(API_URL, {
        product_id: selectedProduct.id,
        quantity,
      });

      if (response?.status === 201) {
        setCart([...cart, { ...selectedProduct, quantity }]);
        toast.success(`${selectedProduct.productName} added to cart`, { autoClose: 2000 });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error(err.response?.data?.error || "Failed to add product to cart");
    }
  };

  const defaultImage =
    "https://i.pinimg.com/736x/df/9f/a9/df9fa9eb2ac17ed7794706eb5c7f877c.jpg";

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-indigo-200 via-gray-100 to-purple-200 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
       
        <Link href={`${API_URL}`}>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 border-indigo-700 dark:border-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl rounded-full px-6 py-2"
          >
            <ShoppingCart className="h-5 w-5 animate-bounce" /> Cart ({cart.length})
          </Button>
        </Link>
      </div>

      {/* Dashboard */}
      <div className="mb-12">
        <Dashboard />
      </div>

      {/* Filter Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-indigo-300 dark:border-gray-700 transform hover:shadow-2xl transition-all duration-500">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search products..."
              className="pl-12 w-full rounded-full shadow-md focus:ring-2 focus:ring-indigo-600 dark:border-gray-600 bg-indigo-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-all duration-300 border-indigo-300 hover:bg-indigo-200 dark:hover:bg-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-600 dark:text-indigo-300" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Category:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px] rounded-full shadow-md bg-indigo-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-indigo-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-600 hover:bg-indigo-200 dark:hover:bg-gray-700">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 shadow-xl rounded-lg border-indigo-300 dark:border-gray-700">
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
          </div>
        </div>

        {/* Product Grid - Limited to 6 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts().length === 0 ? (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 text-lg py-8 animate-pulse">
              No products found. Try adjusting your filters!
            </div>
          ) : (
            filteredProducts().map((product) => (
              <Card
                key={product.id}
                className="shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900 border border-indigo-300 dark:border-gray-700"
              >
                <CardHeader className="p-0 border-b border-indigo-200 dark:border-gray-600">
                  <img
                    src={product.image || defaultImage}
                    alt={product.productName}
                    className="w-full h-52 object-cover rounded-t-2xl transition-transform duration-500 hover:scale-110"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 tracking-tight drop-shadow-sm">{product.productName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">{product.category}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold shadow-md",
                        product.status === "Available" && "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300",
                        product.status === "Low Stock" && "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
                        product.status === "Out" && "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300"
                      )}
                    >
                      {product.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-extrabold flex items-center text-indigo-700 dark:text-indigo-300 drop-shadow-sm">
                    <IndianRupee size={20} className="mr-1" />
                    {product.price}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between bg-gradient-to-r from-indigo-100 to-white dark:from-indigo-950 dark:to-gray-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Stock: {product.stock_quantity}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openProductModal(product)}
                      className="text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <Eye className="h-5 w-5 mr-2" /> View
                    </Button>
                    {/* Uncomment if Order button is needed */}
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openOrderModal(product)}
                      className="text-indigo-700 dark:text-indigo-300 border-indigo-700 dark:border-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      disabled={product.stock_quantity === 0}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" /> Order
                    </Button> */}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900 rounded-2xl shadow-2xl p-6 border border-indigo-300 dark:border-gray-700 animate-fade-in">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-300 dark:to-purple-300 tracking-tight drop-shadow-md">
                {selectedProduct.productName}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 italic">Explore product details below</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <img
                src={selectedProduct.image || defaultImage}
                alt={selectedProduct.productName}
                className="w-full h-60 object-cover rounded-xl shadow-lg transition-transform duration-500 hover:scale-105"
              />
              <div className="space-y-4">
                <p className="text-gray-800 dark:text-gray-200"><strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Name:</strong> {selectedProduct.productName}</p>
                <p className="text-gray-800 dark:text-gray-200"><strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Category:</strong> {selectedProduct.category}</p>
                <p className="text-gray-800 dark:text-gray-200"><strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Stock:</strong> {selectedProduct.stock_quantity}</p>
                <p className="text-gray-800 dark:text-gray-200 flex items-center">
                  <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Price:</strong>
                  <IndianRupee size={20} className="ml-2 mr-1 text-indigo-700 dark:text-indigo-300" />
                  <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">{selectedProduct.price}</span>
                </p>
                <p className="text-gray-800 dark:text-gray-200"><strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Description:</strong> {selectedProduct.description || "N/A"}</p>
                <p className="text-gray-800 dark:text-gray-200">
                  <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Added On:</strong>{" "}
                  {new Date(selectedProduct.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(selectedProduct.stock_quantity, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={selectedProduct.stock_quantity}
                  className="w-28 rounded-full shadow-md border-indigo-400 dark:border-gray-600 focus:ring-2 focus:ring-indigo-600 transition-all duration-300 bg-indigo-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-indigo-200 dark:hover:bg-gray-600"
                  disabled={selectedProduct.stock_quantity === 0}
                />
                <Button
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white rounded-full shadow-lg transition-all duration-500 transform hover:scale-105 hover:shadow-xl px-6 py-2"
                  disabled={selectedProduct.stock_quantity === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2 animate-pulse" /> Add to Cart
                </Button>
              </div>
              {selectedProduct.stock_quantity === 0 && (
                <p className="text-red-600 dark:text-red-400 text-sm animate-pulse bg-red-100 dark:bg-red-900 p-2 rounded-lg shadow-md">This product is out of stock.</p>
              )}
              {quantity > selectedProduct.stock_quantity && selectedProduct.stock_quantity > 0 && (
                <p className="text-red-600 dark:text-red-400 text-sm animate-pulse bg-red-100 dark:bg-red-900 p-2 rounded-lg shadow-md">Quantity exceeds available stock.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Order Modal */}
      {selectedProduct && (
        <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
          <DialogContent className="max-w-lg bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-900 rounded-2xl shadow-2xl p-6 border border-indigo-300 dark:border-gray-700 animate-fade-in">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-300 dark:to-purple-300 tracking-tight drop-shadow-md">
                Order {selectedProduct.productName}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 italic">Place an order for this product</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <p className="text-gray-800 dark:text-gray-200"><strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Product:</strong> {selectedProduct.productName}</p>
              <p className="text-gray-800 dark:text-gray-200 flex items-center">
                <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Price:</strong>
                <IndianRupee size={20} className="ml-2 mr-1 text-indigo-700 dark:text-indigo-300" />
                <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">{selectedProduct.price}</span>
              </p>
              <p className="text-gray-800 dark:text-gray-200"><strong className="text-indigo-700 dark:text-indigo-300 font-semibold">Stock Available:</strong> {selectedProduct.stock_quantity}</p>
              <div className="flex gap-4 mt-4">
                <Link href={`/addorder/${selectedProduct.id}`}>
                  <Button
                    className="bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white rounded-full shadow-lg transition-all duration-500 transform hover:scale-105 hover:shadow-xl px-6 py-2"
                    disabled={selectedProduct.stock_quantity === 0}
                  >
                    Place Order
                  </Button>
                </Link>
              </div>
              {selectedProduct.stock_quantity === 0 && (
                <p className="text-red-600 dark:text-red-400 text-sm animate-pulse bg-red-100 dark:bg-red-900 p-2 rounded-lg shadow-md">This product is out of stock and cannot be ordered.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}