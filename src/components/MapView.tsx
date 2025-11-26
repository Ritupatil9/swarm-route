import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TomTom Maps will be initialized here
    // For now, showing a placeholder that instructs about API key setup
  }, []);

  return (
    <div className="w-full h-full relative bg-muted/20">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Placeholder overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">TomTom Maps Integration</h3>
          <p className="text-muted-foreground mb-4">
            To display the live map, you'll need to add your TomTom Maps API key.
          </p>
          <div className="text-sm text-left space-y-2 bg-muted/50 p-4 rounded-lg">
            <p className="font-medium">Setup steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Get your API key from <a href="https://developer.tomtom.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TomTom Developer Portal</a></li>
              <li>Enable Lovable Cloud for secure key storage</li>
              <li>Add the key to your secrets</li>
              <li>The map will load automatically</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MapView;
