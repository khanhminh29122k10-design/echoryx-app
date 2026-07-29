export function Stars() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <span
          key={i}
          className="absolute text-primary-glow animate-twinkle"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            fontSize: `${8 + (i % 4) * 4}px`,
            animationDelay: `${(i % 5) * 0.3}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}