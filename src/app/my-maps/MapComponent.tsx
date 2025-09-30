"use client"

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Activity {
    activityId: string
    name: string
    catchy_description: string | null
    duration: number
    latitude: number
    longitude: number
    openingTime: number
    closingTime: number
    sectionId: string
    url: string
    ticket: string
    "interests.architecture": number
    "interests.landscape": number
    "interests.politic": number
    "interests.history": number
    "interests.courtlife": number
    "interests.art": number
    "interests.engineering": number
    "interests.spirituality": number
    "interests.nature": number
}

interface MapComponentProps {
    activities: Activity[]
    selectedActivity: Activity | null
    setSelectedActivity: (activity: Activity | null) => void
    hoveredActivity: string | null
}

// Composant pour gérer le centrage de la carte
function MapController({ selectedActivity }: { selectedActivity: Activity | null }) {
    const map = useMap()

    useEffect(() => {
        if (selectedActivity) {
            map.flyTo([selectedActivity.latitude, selectedActivity.longitude], 16, {
                duration: 1
            })
        }
    }, [selectedActivity, map])

    return null
}

export default function MapComponent({
    activities,
    selectedActivity,
    setSelectedActivity,
    hoveredActivity
}: MapComponentProps) {
    // Centre de Versailles
    const center: [number, number] = [48.8049, 2.1204]

    // Icônes personnalisées avec numéro d'ordre
    const createCustomIcon = (isSelected: boolean, isHovered: boolean, orderNumber: number) => {
        const size = isSelected ? 40 : isHovered ? 35 : 30
        const color = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#ef4444'
        const fontSize = isSelected ? 16 : isHovered ? 14 : 12
        
        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    width: ${size}px;
                    height: ${size}px;
                    background-color: ${color};
                    border: 3px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                ">
                    <div style="
                        color: white;
                        font-weight: bold;
                        font-size: ${fontSize}px;
                        transform: rotate(45deg);
                    ">${orderNumber}</div>
                </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size]
        })
    }

    useEffect(() => {
        // Fix pour les icônes Leaflet par défaut
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
    }, [])

    return (
        <MapContainer
            center={center}
            zoom={14}
            className="h-full w-full"
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController selectedActivity={selectedActivity} />

            {activities.map((activity, index) => {
                const isSelected = selectedActivity?.activityId === activity.activityId
                const isHovered = hoveredActivity === activity.activityId

                return (
                    <Marker
                        key={activity.activityId}
                        position={[activity.latitude, activity.longitude]}
                        icon={createCustomIcon(isSelected, isHovered, index + 1)}
                        eventHandlers={{
                            click: () => {
                                setSelectedActivity(activity)
                            }
                        }}
                    >
                        <Popup>
                            <div className="p-2">
                                <h3 className="font-semibold text-sm mb-1">
                                    {activity.name}
                                </h3>
                                {activity.catchy_description && (
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                        {activity.catchy_description}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                )
            })}
        </MapContainer>
    )
}
