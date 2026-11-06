import Image from "next/image";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/guardian/logo.png"
      alt=""
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}
