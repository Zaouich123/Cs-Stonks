export function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-[#030816]" />

      {/* Deep blue accent glow */}
      <div
        className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vw] rounded-full bg-[#093066]/20 blur-[120px]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />
      <div
        className="absolute top-[40%] -right-[20%] h-[60vh] w-[60vw] rounded-full bg-[#093066]/15 blur-[150px]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />
      
      {/* Subtle highlight */}
      <div
        className="absolute top-[20%] left-[60%] h-[40vh] w-[40vw] rounded-full bg-[#4da3ff]/5 blur-[100px]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />

      {/* Grid pattern overlay for texture */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />
    </div>
  );
}
