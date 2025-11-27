import { MagicBento } from "@/components/MagicBento";

const BentoDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Features Showcase
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover the powerful capabilities of MeetMap
        </p>
      </div>

      {/* Bento Grid */}
      <div className="container mx-auto px-4 pb-20">
        <MagicBento
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          glowColor="230, 25, 56"
        />
      </div>
    </div>
  );
};

export default BentoDemo;
