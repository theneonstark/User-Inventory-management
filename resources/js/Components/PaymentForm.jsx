import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PaymentForm({ order, onClose, onSubmit }) {
  const [paymentAmount, setPaymentAmount] = useState(order.pending_payment);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate API call for payment submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSubmit(order.id, paymentAmount);
      onClose();
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Pay Pending Amount</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Pay"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}