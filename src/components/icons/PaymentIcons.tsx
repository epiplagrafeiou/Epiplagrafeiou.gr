
import Image from 'next/image';

const paymentMethods = [
  { name: 'PayPal', src: 'https://i.postimg.cc/0Qkdxbm6/15465746.png', width: 50, height: 32 },
  { name: 'Stripe', src: 'https://i.postimg.cc/yd1XBk9H/5968382.png', width: 50, height: 32 },
  { name: 'Apple Pay', src: 'https://i.postimg.cc/63WLwyR5/apple-pay-og-twitter.jpg', width: 50, height: 32 },
  { name: 'Mastercard', src: 'https://i.postimg.cc/V6fB1dMd/free-mastercard-logo-icon-svg-download-png-2944982.webp', width: 50, height: 32 },
  { name: 'Google Pay', src: 'https://i.postimg.cc/3R8C7dpw/google-pay-logo-1280x531.png', width: 50, height: 32 },
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
