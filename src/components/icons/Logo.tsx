import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 40"
      width="200"
      height="40"
      {...props}
    >
      <text
        x="10"
        y="28"
        fontFamily="Inter, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="currentColor"
      >
        Epipla Graphiou
      </text>
    </svg>
  );
}
