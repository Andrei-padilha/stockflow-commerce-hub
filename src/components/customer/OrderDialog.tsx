import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  
  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    
    try {
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
        title: "Pedido realizado com sucesso!",
        description: `Seu pedido #${order.id.slice(0, 8)} foi registrado.`,
      });

    } catch (error: any) {
      toast({
        title: "Erro ao realizar o pedido",
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
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl">Pedido Realizado com Sucesso!</DialogTitle>
              <DialogDescription className="text-lg">
                Obrigado pelo seu pedido. Ele será processado em breve.
              </DialogDescription>
            </DialogHeader>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>ID do Pedido:</strong> #{orderId.slice(0, 8)}</p>
                  <p><strong>Cliente:</strong> {customerName}</p>
                  <p><strong>Email:</strong> {customerEmail}</p>
                  <p><strong>Total:</strong> {formatPrice(totalPrice)}</p>
                  <p><strong>Status:</strong> Pendente</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-3">
              <Button onClick={handleClose} className="w-full">
                Continuar Comprando
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/track?email=${encodeURIComponent(customerEmail)}`}>
                  Rastrear Pedido
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          // Order Form
          <>
            <DialogHeader>
              <DialogTitle>Complete Seu Pedido</DialogTitle>
              <DialogDescription>
                Insira seus dados para finalizar o pedido
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Resumo do Pedido
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
                              {formatPrice(item.product.price)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total ({totalItems} itens)</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Insira seu nome completo"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Endereço de E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Insira seu endereço de e-mail"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Usaremos este e-mail para enviar atualizações do seu pedido.
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
                        Finalizar Pedido • {formatPrice(totalPrice)}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="w-full"
                        disabled={loading}
                      >
                        Cancelar
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