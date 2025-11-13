
import Image from 'next/image';

const paymentMethods = [
  { name: 'Visa', src: 'https://i.postimg.cc/L6Hj1fW9/visa.png', width: 50, height: 32 },
  { name: 'Mastercard', src: 'https://i.postimg.cc/cJkZssmL/pngimg-com-mastercard-PNG15.png', width: 50, height: 32 },
  { name: 'American Express', src: 'https://i.postimg.cc/PryM21xq/amex.png', width: 50, height: 32 },
  { name: 'PayPal', src: 'https://i.postimg.cc/0Qkdxbm6/15465746.png', width: 50, height: 32 },
  { name: 'Stripe', src: 'https://i.postimg.cc/yd1XBk9H/5968382.png', width: 50, height: 32 },
    { name: 'Apple Pay', src: 'https://i.postimg.cc/63WLwyR5/apple-pay-og-twitter.jpg', width: 50, height: 32 },
];

export function PaymentIcons() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {paymentMethods.map((method) => (
        <div key={method.name} className="flex h-8 items-center justify-center rounded bg-white px-2 shadow-sm">
          <div className="relative" style={{ width: method.width, height: method.height }}>
            <Image
              src={method.src}
              alt={method.name}
              fill
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </div>
        </div>
      ))}
    </div>
  );
}
