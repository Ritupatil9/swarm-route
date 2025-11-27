import React, { createContext, useContext, useState } from "react";

export type Destination = {
  lat: number;
  lng: number;
  label?: string;
  createdAt: number;
};

type MapContextType = {
  destination: Destination | null;
  setDestination: (d: Destination) => void;
  clearDestination: () => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [destination, setDestinationState] = useState<Destination | null>(null);

  const setDestination = (d: Destination) => {
    setDestinationState(d);
  };

  const clearDestination = () => {
    setDestinationState(null);
  };

  return (
    <MapContext.Provider value={{ destination, setDestination, clearDestination }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be used within a MapProvider");
  return ctx;
};
