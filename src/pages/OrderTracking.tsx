import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('email') || "");
  const [searchType, setSearchType] = useState<"id" | "email">(
    searchParams.get('email') ? "email" : "email"
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('email')) {
      handleSearch();
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setSearched(true);
    setOrder(null);

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
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).single();


      if (error) {
        if (error.code === 'PGRST116') { // "PGRST116" is the code for "0 rows returned"
          setOrder(null);
        } else {
          throw error;
        }
      } else {
        setOrder(data);
      }
    } catch (error: any) {
      toast({
        title: "Falha na busca",
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
        return 'bg-yellow-500 text-white';
      case 'confirmed':
        return 'bg-blue-500 text-white';
      case 'shipped':
        return 'bg-purple-500 text-white';
      case 'delivered':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  const getStatusLabel = (status: string) => {
      switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      default: return 'Pendente';
    }
  }
  
  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar para StockFlow
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Rastreie seu Pedido</h1>
            <p className="text-muted-foreground">
              Insira o ID do seu pedido ou endereço de e-mail para verificar o status
            </p>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Consulta de Pedido
              </CardTitle>
              <CardDescription>
                Busque por ID para pedidos específicos ou por e-mail para todos os seus pedidos
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
                    Buscar por E-mail
                  </Button>
                  <Button
                    type="button"
                    variant={searchType === "id" ? "default" : "outline"}
                    onClick={() => setSearchType("id")}
                    className="flex-1"
                  >
                    Buscar por ID do Pedido
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search">
                    {searchType === "email" ? "Endereço de E-mail" : "ID do Pedido"}
                  </Label>
                  <Input
                    id="search"
                    type={searchType === "email" ? "email" : "text"}
                    placeholder={
                      searchType === "email" 
                        ? "Insira seu endereço de e-mail" 
                        : "Insira o ID do seu pedido"
                    }
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Buscando..." : "Encontrar Pedido"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Results */}
          {searched && (
            <>
              {loading ? (
                 <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
              ) : order ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Pedido #{order.id.slice(0, 8)}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </div>
                      </Badge>
                    </div>
                    <CardDescription>
                      Feito em {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Info */}
                    <div>
                      <h4 className="font-medium mb-2">Informações do Cliente</h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>Nome:</strong> {order.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Email:</strong> {order.customer_email}
                      </p>
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-2">Itens do Pedido</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2">
                            <div>
                              <p className="font-medium">{item.products.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantidade: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              {formatPrice(item.unit_price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(order.total || 0)}</span>
                    </div>

                    {/* Status Timeline */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Status do Pedido</h4>
                      <div className="space-y-2">
                        {['pending', 'confirmed', 'shipped', 'delivered'].map((status) => {
                          const isActive = order.status === status;
                          const isPassed = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status) >= 
                                          ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(status);
                          
                          return (
                            <div
                              key={status}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                                isActive ? 'bg-primary/10 border-primary border' :
                                isPassed ? 'bg-muted' : 'opacity-50'
                              }`}
                            >
                              {getStatusIcon(status)}
                              <span className={`capitalize ${isActive ? 'font-medium' : ''}`}>
                                {getStatusLabel(status)}
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
                    <h3 className="text-lg font-medium mb-2">Nenhum Pedido Encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchType === "email" 
                        ? "Nenhum pedido encontrado para este endereço de e-mail. Por favor, verifique e tente novamente."
                        : "Nenhum pedido encontrado com este ID. Por favor, verifique o ID e tente novamente."
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