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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

      if (storagedCart) {
       return JSON.parse(storagedCart);
      }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productexists =  updatedCart.find(product => product.id === productId);
      const stock = (await api.get(`/stock/${productId}`));
      const stockAmount = stock.data.amount;
      const currentAmount = productexists ? productexists.amount : 0;
      const amount = currentAmount + 1;

      if(stockAmount < amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }else {
        if(productexists){
          productexists.amount = amount;
        }else{
          const product = (await api.get(`/products/${productId}`));
          const newProduct = {...product.data, amount: 1};
          updatedCart.push(newProduct);
        }
        
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const removeProduct = newCart.findIndex(product => (product.id === productId));

      if(removeProduct >=0) {
      newCart.splice(removeProduct, 1);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
      else throw Error();
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount<=0) {
        return;
      }

      const newCart = [...cart];
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      const product = newCart.find(findProduct => (productId === findProduct.id));

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(product){

      product.amount = amount;

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      }
      else{
        throw Error();
      }
      

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
