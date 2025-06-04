import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
export default function MapTest() {
  return (
    <div className="">
      <h1>Map Test</h1>
      <div className="">
      <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={true} style={{ height: '500px', width: '100%' }}>
        <TileLayer
         
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[51.505, -0.09]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
      </MapContainer>
      </div>
    </div>
  );
}