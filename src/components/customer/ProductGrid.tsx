import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Plus, Minus, ShoppingCart } from "lucide-react";
import type { Product } from "@/pages/Index";
import { useTranslation } from "react-i18next";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { t } = useTranslation();
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const setQuantity = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }));
  };

  const handleAddToCart = (product: Product) => {
    const quantity = getQuantity(product.id);
    onAddToCart(product, quantity);
    setQuantity(product.id, 1);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: t('stockStatus.outOfStock'), variant: "destructive" as const };
    if (stock <= 10) return { label: t('stockStatus.lowStock', { count: stock }), variant: "warning" as const };
    return { label: t('stockStatus.inStock'), variant: "success" as const };
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">{t('noProductsFound')}</h3>
        <p className="text-muted-foreground">
          {t('tryAdjustingSearch')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const stockStatus = getStockStatus(product.stock);
        const quantity = getQuantity(product.id);
        const maxQuantity = Math.min(product.stock, 10);

        return (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-2 mt-1">
                      {product.description}
                    </CardDescription>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  <Badge className={
                    stockStatus.variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 
                    stockStatus.variant === 'warning' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }>
                    {stockStatus.label}
                  </Badge>
                </div>

                {product.stock > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('quantity')}:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(product.id, quantity - 1)}
                          disabled={quantity <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(product.id, Math.min(Math.max(val, 1), maxQuantity));
                          }}
                          className="h-8 w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(product.id, quantity + 1)}
                          disabled={quantity >= maxQuantity}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {t('addToCart')} • {formatPrice(product.price * quantity)}
                    </Button>
                  </div>
                ) : (
                  <Button disabled className="w-full">
                    {t('stockStatus.outOfStock')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}