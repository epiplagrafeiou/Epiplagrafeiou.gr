import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="https://i.postimg.cc/59LDxYRr/EpiplaGRAFEIOU.GR-removebg-preview2.png"
      alt="Epipla Graphiou Logo"
      width={160}
      height={32}
      className={className}
      priority
    />
  );
}
