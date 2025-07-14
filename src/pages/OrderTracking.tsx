import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Package, Truck, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: string;
  order_items: {
    quantity: number;
    unit_price: number;
    products: {
      name: string;
    };
  }[];
}

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('email') || "");
  const [searchType, setSearchType] = useState<"id" | "email">(
    searchParams.get('email') ? "email" : "email"
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            products (name)
          )
        `);

      if (searchType === "id") {
        query = query.eq('id', searchValue.trim());
      } else {
        query = query.eq('customer_email', searchValue.trim().toLowerCase());
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          setOrder(null);
          toast({
            title: t('orderTracking.orderNotFound'),
            description: searchType === "id" 
              ? t('orderTracking.noOrderWithId')
              : t('orderTracking.noOrdersForEmail'),
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        setOrder(data);
      }
    } catch (error: any) {
      toast({
        title: t('orderTracking.searchFailed'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'confirmed':
        return 'bg-primary text-primary-foreground';
      case 'shipped':
        return 'bg-accent text-accent-foreground';
      case 'delivered':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="h-4 w-4" />
              {t('orderTracking.backToStockFlow')}
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{t('orderTracking.trackYourOrder')}</h1>
            <p className="text-muted-foreground">
              {t('orderTracking.enterOrderIdOrEmail')}
            </p>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                {t('orderTracking.orderLookup')}
              </CardTitle>
              <CardDescription>
                {t('orderTracking.searchDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={searchType === "email" ? "default" : "outline"}
                    onClick={() => setSearchType("email")}
                    className="flex-1"
                  >
                    {t('orderTracking.searchByEmail')}
                  </Button>
                  <Button
                    type="button"
                    variant={searchType === "id" ? "default" : "outline"}
                    onClick={() => setSearchType("id")}
                    className="flex-1"
                  >
                    {t('orderTracking.searchByOrderId')}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search">
                    {searchType === "email" ? t('orderTracking.emailAddress') : t('orderTracking.orderId')}
                  </Label>
                  <Input
                    id="search"
                    type={searchType === "email" ? "email" : "text"}
                    placeholder={
                      searchType === "email" 
                        ? t('orderTracking.enterEmail')
                        : t('orderTracking.enterOrderId')
                    }
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('orderTracking.searching') : t('orderTracking.findOrder')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Results */}
          {searched && (
            <>
              {order ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {t(`orderTracking.${order.status}`)}
                        </div>
                      </Badge>
                    </div>
                    <CardDescription>
                      {t('orderTracking.placedOn')} {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Info */}
                    <div>
                      <h4 className="font-medium mb-2">{t('orderTracking.customerInformation')}</h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>{t('orderTracking.name')}</strong> {order.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>{t('orderTracking.email')}</strong> {order.customer_email}
                      </p>
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-2">{t('orderTracking.orderItems')}</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2">
                            <div>
                              <p className="font-medium">{item.products.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {t('orderTracking.quantity')} {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              ${(item.unit_price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t('orderTracking.total')}</span>
                      <span>${order.total?.toFixed(2) || "0.00"}</span>
                    </div>

                    {/* Status Timeline */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">{t('orderTracking.orderStatus')}</h4>
                      <div className="space-y-2">
                        {['pending', 'confirmed', 'shipped', 'delivered'].map((status) => {
                          const isActive = order.status === status;
                          const isPassed = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status) >= 
                                          ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(status);
                          
                          return (
                            <div
                              key={status}
                              className={`flex items-center gap-3 p-2 rounded ${
                                isActive ? 'bg-primary/10 border-primary border' :
                                isPassed ? 'bg-muted' : 'opacity-50'
                              }`}
                            >
                              {getStatusIcon(status)}
                              <span className={`capitalize ${isActive ? 'font-medium' : ''}`}>
                                {t(`orderTracking.${status}`)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t('orderTracking.noOrderFound')}</h3>
                    <p className="text-muted-foreground">
                      {searchType === "email" 
                        ? t('orderTracking.noOrdersFoundEmail')
                        : t('orderTracking.noOrderFoundId')
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;