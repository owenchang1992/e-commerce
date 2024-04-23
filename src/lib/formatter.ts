const CURRENCY_FORMATTER = new Intl.NumberFormat('zh-TW', {
  currency: 'TWD',
  style: 'currency',
  minimumFractionDigits: 2,
});

export const formatCurrency = (amount: number) => {
  return CURRENCY_FORMATTER.format(amount);
};

const NUMBER_FORMATTER = new Intl.NumberFormat('zh-TW');

export const formatNumber = (number: number) => {
  return NUMBER_FORMATTER.format(number);
};
