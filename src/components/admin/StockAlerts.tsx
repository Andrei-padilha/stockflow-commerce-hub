import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingDown, BarChart3 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  image_url: string | null;
}

interface StockStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

export function StockAlerts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProductsAndStats();
  }, []);
  
  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const fetchProductsAndStats = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock, price, image_url')
        .order('stock', { ascending: true });

      if (error) throw error;

      const products = data || [];
      setProducts(products);

      // Calculate stats
      const stats = products.reduce((acc, product) => ({
        totalProducts: acc.totalProducts + 1,
        lowStockCount: acc.lowStockCount + (product.stock <= 10 && product.stock > 0 ? 1 : 0),
        outOfStockCount: acc.outOfStockCount + (product.stock === 0 ? 1 : 0),
        totalValue: acc.totalValue + (product.stock * product.price)
      }), {
        totalProducts: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0
      });

      setStats(stats);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar dados de estoque",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Sem Estoque", variant: "destructive" as const, priority: 3 };
    if (stock <= 10) return { label: "Estoque Baixo", variant: "warning" as const, priority: 2 };
    return { label: "Em Estoque", variant: "success" as const, priority: 1 };
  };

  const alertProducts = products.filter(product => product.stock <= 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alertas de Estoque</h2>
        <p className="text-muted-foreground">
          Monitore os níveis de inventário e receba alertas de estoque baixo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos no catálogo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Produtos com 10 ou menos itens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Produtos indisponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Inventário</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total do estoque
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas de Estoque ({alertProducts.length})
          </CardTitle>
          <CardDescription>
            Produtos que precisam de atenção imediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Todos os estoques estão saudáveis</h3>
              <p className="text-muted-foreground">
                Nenhum produto requer atenção imediata
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertProducts
                .sort((a, b) => getStockStatus(a.stock).priority - getStockStatus(b.stock).priority)
                .map((product) => {
                  const status = getStockStatus(product.stock);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Estoque atual: {product.stock} unidades
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Valor: {formatPrice(product.stock * product.price)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          status.variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 
                          'bg-yellow-500 text-white'
                        }>
                          {status.label}
                        </Badge>
                        {product.stock === 0 && (
                          <p className="text-xs text-destructive mt-1">
                            Precisa de reposição imediata
                          </p>
                        )}
                        {product.stock <= 10 && product.stock > 0 && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Considere repor em breve
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Products Stock Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral de Todos os Produtos</CardTitle>
          <CardDescription>
            Status completo do inventário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products.map((product) => {
              const status = getStockStatus(product.stock);
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {product.stock} unidades
                    </span>
                    <Badge className={
                      status.variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 
                      status.variant === 'warning' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'
                    }>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}