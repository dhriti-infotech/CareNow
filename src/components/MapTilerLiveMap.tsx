import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type LiveMapPoint = { latitude: number; longitude: number };

type Props = {
  patient: LiveMapPoint;
  nurse?: LiveMapPoint | null;
  apiKey?: string;
};

const DEFAULT_KEY = 'YOUR_MAPTILER_API_KEY';

const buildHtml = (apiKey: string) => `<!doctype html>
<html>
<head>
<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html,body,#map { width:100%; height:100%; margin:0; padding:0; overflow:hidden; background:#eaf8fa; }
  .leaflet-control-attribution { font-size:9px; }
  .pin { width:40px;height:40px;border-radius:20px;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:20px; }
  .patient { background:#0ea5b7; }
  .nurse { background:#2563eb; }
  .pulse { position:relative; }
  .pulse:after { content:'';position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(37,99,235,.35);animation:pulse 1.8s infinite; }
  @keyframes pulse { 0%{transform:scale(.7);opacity:.9} 100%{transform:scale(1.45);opacity:0} }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const key=${JSON.stringify(apiKey)};
const map=L.map('map',{zoomControl:true,attributionControl:true});
L.tileLayer('https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key='+encodeURIComponent(key),{tileSize:512,zoomOffset:-1,minZoom:1,maxZoom:20,attribution:'&copy; MapTiler &copy; OpenStreetMap contributors'}).addTo(map);
let patientMarker=null,nurseMarker=null,route=null;
const icon=(cls,emoji)=>L.divIcon({className:'',html:'<div class="pin '+cls+'">'+emoji+'</div>',iconSize:[40,40],iconAnchor:[20,20]});
function updateMap(data){
  const patient=L.latLng(data.patient.latitude,data.patient.longitude);
  if(!patientMarker) patientMarker=L.marker(patient,{icon:icon('patient','⌂'),title:'Patient location'}).addTo(map); else patientMarker.setLatLng(patient);
  const points=[patient];
  if(data.nurse){
    const nurse=L.latLng(data.nurse.latitude,data.nurse.longitude); points.push(nurse);
    if(!nurseMarker) nurseMarker=L.marker(nurse,{icon:icon('nurse pulse','●'),title:'Nurse location'}).addTo(map); else nurseMarker.setLatLng(nurse);
  } else if(nurseMarker){ map.removeLayer(nurseMarker); nurseMarker=null; }
  if(route) map.removeLayer(route);
  route=data.nurse?L.polyline([L.latLng(data.nurse.latitude,data.nurse.longitude),patient],{color:'#0ea5b7',weight:4,dashArray:'8 6',opacity:.9}).addTo(map):null;
  map.fitBounds(L.latLngBounds(points),{paddingTopLeft:[40,70],paddingBottomRight:[40,280],maxZoom:16,animate:true});
}
window.updateMap=updateMap;
window.addEventListener('message',event=>{try{updateMap(JSON.parse(event.data));}catch(e){}});
document.addEventListener('message',event=>{try{updateMap(JSON.parse(event.data));}catch(e){}});
map.whenReady(()=>window.ReactNativeWebView?.postMessage('MAP_READY'));
</script>
</body>
</html>`;

export default function MapTilerLiveMap({ patient, nurse, apiKey }: Props) {
  const webViewRef = useRef<WebView | null>(null);
  const key = apiKey || process.env.EXPO_PUBLIC_MAPTILER_API_KEY || DEFAULT_KEY;
  const readyRef = useRef(false);

  const update = () => {
    if (!webViewRef.current || !readyRef.current) return;
    webViewRef.current.injectJavaScript(`window.updateMap(${JSON.stringify({ patient, nurse: nurse ?? null })}); true;`);
  };

  useEffect(() => { update(); }, [patient.latitude, patient.longitude, nurse?.latitude, nurse?.longitude]);

  if (key === DEFAULT_KEY) {
    return (
      <View style={styles.missingKey}>
        <ActivityIndicator color="#0EA5B7" />
        <Text style={styles.missingTitle}>MapTiler API key required</Text>
        <Text style={styles.missingText}>Set EXPO_PUBLIC_MAPTILER_API_KEY in your Expo environment and restart Metro.</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      style={styles.webview}
      originWhitelist={['*']}
      source={{ html: buildHtml(key), baseUrl: 'https://carenow.local' }}
      javaScriptEnabled
      domStorageEnabled
      geolocationEnabled
      onLoadEnd={() => { readyRef.current = true; update(); }}
      onMessage={(event) => {
        if (event.nativeEvent.data === 'MAP_READY') { readyRef.current = true; update(); }
      }}
      mixedContentMode="always"
      allowsInlineMediaPlayback
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: '#EAF8FA' },
  missingKey: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF8FA', padding: 24 },
  missingTitle: { marginTop: 10, color: '#0F172A', fontSize: 15, fontWeight: '800' },
  missingText: { marginTop: 6, color: '#64748B', textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
