export interface CartItemSelection {
  groupTitle: string;
  extra: string;
  precio?: number | null;
  'precio-extra'?: number | null;
}

export interface CartItem {
  key: string; // productoId + selections
  productId: number;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  selections?: CartItemSelection[];
}
