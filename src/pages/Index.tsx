import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Package, Search, Truck, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductGrid } from "@/components/customer/ProductGrid";
import { ShoppingCartDrawer } from "@/components/customer/ShoppingCartDrawer";
import { OrderDialog } from "@/components/customer/OrderDialog";
import heroImage from "@/assets/stockflow-hero.jpg";
import { useTranslation } from "react-i18next";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

const Index = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: t('toast.errorLoadingProducts'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast({
            title: t('toast.insufficientStock'),
            description: t('toast.onlyAmountAvailable', { stock: product.stock }),
            variant: "destructive"
          });
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (quantity > product.stock) {
          toast({
            title: t('toast.insufficientStock'),
            description: t('toast.onlyAmountAvailable', { stock: product.stock }),
            variant: "destructive"
          });
          return prevCart;
        }
        
        return [...prevCart, { product, quantity }];
      }
    });
    
    toast({
      title: t('toast.addedToCart'),
      description: t('toast.itemAdded', { quantity: quantity, name: product.name }),
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    toast({
      title: t('toast.removedFromCart'),
      description: t('toast.itemRemoved'),
    });
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">StockFlow</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/track" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Truck className="h-4 w-4" />
                {t('trackOrder')}
              </Link>
              <Link to="/auth" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Shield className="h-4 w-4" />
                {t('adminPortal')}
              </Link>
            </nav>

            {/* Cart Button */}
            <Button
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t('cart')}
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="StockFlow Warehouse"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t('heroTitle.part1')}
            <span className="text-primary"> {t('heroTitle.part2')}</span> {t('heroTitle.part3')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('featureLiveStock')}
            </div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t('featureEasyOrdering')}
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {t('featureOrderTracking')}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{t('ourProducts')}</h3>
              <p className="text-muted-foreground">
                {t('productsAvailable', { count: filteredProducts.length })}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ProductGrid
              products={filteredProducts}
              onAddToCart={addToCart}
            />
          )}
        </div>
      </section>

      {/* Shopping Cart Drawer */}
      <ShoppingCartDrawer
        cart={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          setCartOpen(false);
          setOrderDialogOpen(true);
        }}
        totalPrice={getTotalPrice()}
      />

      {/* Order Dialog */}
      <OrderDialog
        cart={cart}
        isOpen={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        onOrderComplete={clearCart}
        totalPrice={getTotalPrice()}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">StockFlow</span>
              </div>
              <p className="text-muted-foreground">
                {t('footer.tagline')}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">{t('footer.quickLinks')}</h4>
              <div className="space-y-2">
                <Link to="/track" className="block text-muted-foreground hover:text-foreground transition-colors">
                  {t('trackOrder')}
                </Link>
                <Link to="/auth" className="block text-muted-foreground hover:text-foreground transition-colors">
                  {t('adminPortal')}
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">{t('footer.customerService')}</h4>
              <p className="text-muted-foreground text-sm">
                {t('footer.serviceHelp')}
              </p>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground text-sm">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;