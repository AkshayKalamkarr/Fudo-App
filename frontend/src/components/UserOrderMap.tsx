import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { useEffect, useRef } from "react"; // ✅ FIXED

// Types for routing machine
declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options?: any): any;
  }
}

// Icons
const riderIcon = new L.DivIcon({
  html: "🛵",
  iconSize: [30, 30],
  className: "",
});

const deliveryIcon = new L.DivIcon({
  html: "📦",
  iconSize: [30, 30],
  className: "",
});

// Routing component
const Routing = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!from || !to) return;

    // Create routing
    controlRef.current = L.Routing.control({
      waypoints: [L.latLng(from), L.latLng(to)],
      lineOptions: {
        styles: [{ color: "#E23744", weight: 5 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      createMarker: () => null,
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
    }).addTo(map);

    // Fix map render issue
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map]);

  // Update route dynamically
  useEffect(() => {
    if (controlRef.current && from && to) {
      controlRef.current.setWaypoints([L.latLng(from), L.latLng(to)]);
    }
  }, [from, to]);

  return null;
};

interface Props {
  riderLocation: [number, number];
  deliveryLocation: [number, number];
}

const UserOrderMap = ({ riderLocation, deliveryLocation }: Props) => {
  // ✅ Safety check (VERY IMPORTANT)
  if (
    !riderLocation ||
    !deliveryLocation ||
    riderLocation.length !== 2 ||
    deliveryLocation.length !== 2
  ) {
    return <div className="p-4 text-gray-500">Loading map...</div>;
  }

  console.log("MAP DATA:", { riderLocation, deliveryLocation });

  return (
    <div className="rounded-xl bg-white shadow-sm p-3">
      <div style={{ height: "350px" }}>
        <MapContainer
          center={riderLocation}
          zoom={14}
          className="w-full h-full rounded-lg"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={riderLocation} icon={riderIcon}>
            <Popup>You (Rider)</Popup>
          </Marker>

          <Marker position={deliveryLocation} icon={deliveryIcon}>
            <Popup>Delivery Location</Popup>
          </Marker>

          <Routing from={riderLocation} to={deliveryLocation} />
        </MapContainer>
      </div>
    </div>
  );
};

export default UserOrderMap;