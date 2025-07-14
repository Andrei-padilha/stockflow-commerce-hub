import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Loader2, Package, User, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import type { CartItem } from "@/pages/Index";

interface OrderDialogProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: () => void;
  totalPrice: number;
}

export function OrderDialog({
  cart,
  isOpen,
  onClose,
  onOrderComplete,
  totalPrice
}: OrderDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    
    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerName,
          customer_email: customerEmail.toLowerCase(),
          status: 'pending',
          total: totalPrice
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock: item.product.stock - item.quantity 
          })
          .eq('id', item.product.id);

        if (stockError) throw stockError;
      }

      setOrderId(order.id);
      setOrderSuccess(true);
      onOrderComplete();
      
      toast({
        title: t('order.orderPlacedToast'),
        description: t('order.orderPlacedDescription', { orderId: order.id.slice(0, 8) }),
      });

    } catch (error: any) {
      toast({
        title: t('order.errorPlacingOrder'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOrderSuccess(false);
    setCustomerName("");
    setCustomerEmail("");
    setOrderId("");
    onClose();
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {orderSuccess ? (
          // Success Screen
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl">{t('order.orderPlacedSuccessfully')}</DialogTitle>
              <DialogDescription className="text-lg">
                {t('order.thankYou')}
              </DialogDescription>
            </DialogHeader>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">{t('order.orderDetails')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>{t('order.orderId')}</strong> #{orderId.slice(0, 8)}</p>
                  <p><strong>{t('order.customer')}</strong> {customerName}</p>
                  <p><strong>{t('order.email')}</strong> {customerEmail}</p>
                  <p><strong>{t('cart.total')}:</strong> ${totalPrice.toFixed(2)}</p>
                  <p><strong>{t('order.status')}:</strong> {t('order.pending')}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-3">
              <Button onClick={handleClose} className="w-full">
                {t('cart.continueShopping')}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/track?email=${encodeURIComponent(customerEmail)}`}>
                  {t('order.trackYourOrder')}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          // Order Form
          <>
            <DialogHeader>
              <DialogTitle>{t('order.completeOrder')}</DialogTitle>
              <DialogDescription>
                {t('order.enterDetails')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t('order.orderSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.product.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t('cart.total')} ({t('cart.item', { count: totalItems })})</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('order.customerInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('order.fullName')}</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={t('order.enterFullName')}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('order.emailAddress')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('order.enterEmail')}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('order.emailNote')}
                      </p>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={loading || cart.length === 0}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('order.placeOrder')} • ${totalPrice.toFixed(2)}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="w-full"
                        disabled={loading}
                      >
                        {t('order.cancel')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}