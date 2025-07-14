import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";
import type { CartItem } from "@/pages/Index";
import { useTranslation } from "react-i18next";

interface ShoppingCartDrawerProps {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  totalPrice: number;
}

export function ShoppingCartDrawer({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  totalPrice
}: ShoppingCartDrawerProps) {
  const { t } = useTranslation();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.product.id === productId);
    if (item && newQuantity > item.product.stock) return;
    onUpdateQuantity(productId, newQuantity);
  };
  
  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('shoppingCartTitle')}
            {totalItems > 0 && (
              <Badge variant="secondary">
                {t('itemCount', { count: totalItems })}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {t('shoppingCartDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('cartIsEmpty')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('addProductsToStart')}
                </p>
                <Button onClick={onClose}>
                  {t('continueShopping')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="border rounded-lg p-4">
                    <div className="flex gap-3">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="h-16 w-16 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.product.price)} {t('each')}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              handleQuantityChange(item.product.id, val);
                            }}
                            className="h-7 w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm text-muted-foreground ml-2">
                            {t('ofStockAvailable', { stock: item.product.stock })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(item.product.id)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <p className="font-medium">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('subtotal', { count: totalItems })}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('total')}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                
                <Button
                  onClick={onCheckout}
                  className="w-full"
                  size="lg"
                >
                  {t('proceedToCheckout')}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                >
                  {t('continueShopping')}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}