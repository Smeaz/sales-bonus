function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity } = purchase;
  const discountDecimal = discount / 100; // переводим скидку в десятичное число
  const fullPrice = sale_price * quantity; // полная стоимость без скидки
  const revenue = fullPrice * (1 - discountDecimal); // выручка с учетом скидки
  return +revenue.toFixed(2);
}

function calculateBonusByProfit(index, total, seller) {
  const profit = seller.profit;
  let percent = 0;

  if (index === 0) percent = 0.15;
  else if (index === 1 || index === 2) percent = 0.1;
  else if (index === total - 1) percent = 0;
  else percent = 0.05;

  return Math.floor(profit * percent * 100) / 100;
}

function analyzeSalesData(data, options) {
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.purchase_records.length === 0 ||
    data.products.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  };

  const { calculateRevenue, calculateBonus } = options;

  const sellerStats = data.sellers.map((s) => ({
    id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  const sellerIndex = Object.fromEntries(sellerStats.map((s) => [s.id, s]));

  const productIndex = Object.fromEntries(data.products.map((p) => [p.sku, p]));

  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count++;

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;

      const revenue = calculateRevenue(item, product);

      const cost = +(product.purchase_price * item.quantity).toFixed(2);

      const profitItem = revenue - cost;

      seller.revenue += revenue;
      seller.profit += profitItem;

      seller.products_sold[item.sku] =
        (seller.products_sold[item.sku] || 0) + item.quantity;
    });
  });

  sellerStats.forEach((seller) => {
    seller.profit = +seller.profit.toFixed(2);
  });

  sellerStats.sort((a, b) => b.profit - a.profit);

  sellerStats.forEach((seller, idx) => {
    seller.bonus = calculateBonus(idx, sellerStats.length, seller);

    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  return sellerStats.map((s) => ({
    seller_id: s.id,
    name: s.name,
    revenue: +s.revenue.toFixed(2),
    profit: s.profit,
    sales_count: s.sales_count,
    top_products: s.top_products,
    bonus: s.bonus,
  }));
}
