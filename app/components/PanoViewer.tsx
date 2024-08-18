import WebView from "react-native-webview";

export default function PanoViewer({panoId, viewerWidth, initialCompassBearing} : {panoId: number, viewerWidth: number, initialCompassBearing: number | null}) {
  return (
    <WebView source={{
      uri: `http://194.195.120.192:8080/view/pano/${panoId}` + (initialCompassBearing !== null ? `?yaw=${-initialCompassBearing + 180}` : '')
    }} style={{ width: viewerWidth, marginTop: 16 }}/>
  );
}
