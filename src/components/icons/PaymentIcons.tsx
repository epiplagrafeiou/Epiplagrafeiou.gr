import Image from 'next/image';

const paymentMethods = [
  { name: 'Visa', src: 'https://i.postimg.cc/L6Hj1fW9/visa.png', width: 50, height: 32 },
  { name: 'Mastercard', src: 'https://i.postimg.cc/qR8f2jB3/mastercard.png', width: 50, height: 32 },
  { name: 'Maestro', src: 'https://i.postimg.cc/Y0g0xCDJ/maestro.png', width: 50, height: 32 },
  { name: 'American Express', src: 'https://i.postimg.cc/PryM21xq/amex.png', width: 50, height: 32 },
  { name: 'PayPal', src: 'https://i.postimg.cc/RZB5sFhN/paypal.png', width: 50, height: 32 },
];

export function PaymentIcons() {
  return (
    <div className="flex items-center gap-2">
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
