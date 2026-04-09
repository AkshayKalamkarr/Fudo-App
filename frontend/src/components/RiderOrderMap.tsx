import type { IOrder } from "../types"
import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'
import axios from 'axios'
import { realtimeService } from "../main"

declare module "leaflet" {
    namespace Routing {
        function control(options: any): any;
        function osrmv1(options?: any): any;
    }
}

const riderIcon = new L.DivIcon({
    html: "🛵",
    iconSize: [30, 30],
    className: ""
})

const deliveryIcon = new L.DivIcon({
    html: "📦",
    iconSize: [30, 30],
    className: ""
})

interface Props {
    order: IOrder
}

// Routing component that updates waypoints in-place instead of re-mounting
const Routing = ({
    from,
    to
}: {
    from: [number, number],
    to: [number, number]
}) => {
    const map = useMap()
    const controlRef = useRef<any>(null)

    useEffect(() => {
        // Create the routing control only once
        controlRef.current = L.Routing.control({
            waypoints: [L.latLng(from), L.latLng(to)],
            lineOptions: {
                styles: [{ color: "#E23744", weight: 5 }]
            },
            addWaypoints: false,           // fixed: was addwaypoints (wrong casing)
            draggableWaypoints: false,
            show: false,
            createMarker: () => null,
            router: L.Routing.osrmv1({    // fixed: was osrmv (missing "1")
                serviceUrl: "https://router.project-osrm.org/route/v1",
            })
        }).addTo(map)

        return () => {
            if (controlRef.current) {
                map.removeControl(controlRef.current)
                controlRef.current = null
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]) // Only create/destroy when map changes

    // Update waypoints in-place when rider location changes — avoids full remount
    useEffect(() => {
        if (controlRef.current) {
            controlRef.current.setWaypoints([L.latLng(from), L.latLng(to)])
        }
    }, [from, to])

    return null
}

const RiderOrderMap = ({ order }: Props) => {
    // ✅ All hooks must be called before any early returns
    const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null)

    useEffect(() => {
        // Guard: don't start polling if delivery address is missing
        if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) return

        const fetchLocation = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const latitude = pos.coords.latitude
                    const longitude = pos.coords.longitude

                    setRiderLocation([latitude, longitude])

                    axios.post(
                        `${realtimeService}/api/v1/internal/emit`,
                        {
                            event: "rider:location",
                            room: `user:${order.userId}`,
                            payload: { latitude, longitude }
                        },
                        {
                            headers: {
                                "x-internal-key": import.meta.env.VITE_INTERNAL_SERVICE_KEY,
                            }
                        }
                    )
                },
                (err) => console.error("Location Error:", err),
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
            )
        }

        fetchLocation()
        const interval = setInterval(fetchLocation, 10000)

        return () => clearInterval(interval)
    }, [order.userId, order.deliveryAddress.latitude, order.deliveryAddress.longitude])

    // Early returns AFTER all hooks
    if (order.deliveryAddress.latitude == null || order.deliveryAddress.longitude == null) {
        return null
    }

    if (!riderLocation) return null

    const deliveryLocation: [number, number] = [
        order.deliveryAddress.latitude,
        order.deliveryAddress.longitude
    ]

    return (
        <div className="rounded-xl bg-white shadow-sm p-3">  {/* fixed: was shadow-smp-3 */}
            <MapContainer
                center={riderLocation}
                zoom={14}
                className="w-full rounded-lg"
                style={{ height: "350px" }}  // fixed: inline height avoids Tailwind JIT issues
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
    )
}

export default RiderOrderMap