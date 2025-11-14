
'use client';

interface PriceDisplayProps {
  price: number;
}

export function PriceDisplay({ price }: PriceDisplayProps) {
  const priceString = price.toFixed(2);
  const [integerPart, fractionalPart] = priceString.split('.');

  return (
    <div className="flex items-start font-bold text-gray-900">
      <span className="text-lg">€</span>
      <span className="text-3xl leading-none">{integerPart}</span>
      <span className="text-lg leading-none">.{fractionalPart}</span>
    </div>
  );
}
