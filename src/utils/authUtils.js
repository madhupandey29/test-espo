export const formatProductForCart = (product) => ({
  ...product,
  id: product._id || product.id,
  _id: product._id || product.id,
  title: product.title || product.name || 'Product',
  price: parseFloat(product.price) || 0,
  quantity: product.quantity || 1,
  orderQuantity: 1,
  image: product.image || product.imageUrl || '',
});

export const formatProductForWishlist = (product) => ({
  ...product,
  id: product._id || product.id,
  _id: product._id || product.id,
  title: product.title || product.name || 'Product',
  price: parseFloat(product.price) || 0,
  image: product.image || product.imageUrl || '',
});