export const formatCentsToPhp = (cents: number): string => {
  if (!Number.isFinite(cents) || cents < 0) {
    return '₱0.00';
  }

  const pesos = cents / 100;
  return `₱${pesos.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
