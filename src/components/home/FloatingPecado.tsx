import pecadoImg from "../../assets/home/pecado.png";

interface FloatingPecadoProps {
  showBadges?: boolean;
  glowColor?: string;
  className?: string;
}

export default function FloatingPecado({
  showBadges = true,
  glowColor = "bg-white/15",
  className = "",
}: FloatingPecadoProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
    >
      {/* Glow ring */}
      <div
        className={`absolute inset-0 rounded-full ${glowColor} blur-3xl scale-75`}
      />
      {/* Decorative rings */}
      <div className="absolute inset-[10%] rounded-full border border-white/10" />
      <div className="absolute inset-0 rounded-full border border-white/5 scale-110" />

      {/* Product image */}
      <img
        src={pecadoImg}
        alt="Pecado Picoso producto"
        className="relative z-10 w-full h-full object-contain drop-shadow-2xl animate-float-slow"
      />

      {/* Floating badges */}
      {showBadges && (
        <>
          <div className="absolute top-[8%] right-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 animate-float-delay z-20">
            <p className="text-white font-bold text-xs sm:text-sm">Chamoy</p>
            <p className="text-white/60 text-[10px] sm:text-xs">Artesanal</p>
          </div>
          <div className="absolute bottom-[10%] left-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 animate-float z-20">
            <p className="text-white font-bold text-xs sm:text-sm">Gomitas</p>
            <p className="text-white/60 text-[10px] sm:text-xs">Premium</p>
          </div>
        </>
      )}
    </div>
  );
}
