import logo from "@/assets/echoryx-logo.png";

export function Logo({ className = "w-32" }: { className?: string }) {
  return (
    <img
      src={logo}
      alt="EchoRyx"
      className={`${className} object-contain [filter:brightness(0)_invert(1)]`}
    />
  );
}