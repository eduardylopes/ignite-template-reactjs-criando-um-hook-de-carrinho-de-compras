import { AxiosResponse } from 'axios';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const cartItems = localStorage.getItem('@RocketShoes:cart');

    if (cartItems) {
      return JSON.parse(cartItems);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stock }: AxiosResponse<Stock> = await api.get(
        `/stock/${productId}`
      );
      const { data: product }: AxiosResponse<Product> = await api.get(
        `/products/${productId}`
      );

      if (!product) {
        toast.error('Produto não encontrado');
        return;
      }

      if (stock.amount === 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productAlreadyInCart = cart.some(
        (product) => product.id === productId
      );

      if (productAlreadyInCart) {
        const newCart = cart.map((product) =>
          product.id === productId
            ? { ...product, amount: product.amount + 1 }
            : product
        );

        setCart(newCart);
      } else {
        setCart([...cart, product]);
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((product) => product.id !== productId);

      setCart(newCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const { data: productInStock } = await api.get(`/stock/${productId}`);

      if (productInStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map((product) =>
        product.id === productId ? { ...product, amount } : product
      );

      setCart(newCart);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
