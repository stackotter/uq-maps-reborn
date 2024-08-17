import WebView from "react-native-webview";

export default function PanoViewer({panoId, viewerWidth} : {panoId: number, viewerWidth: number}) {
  console.log(panoId);
  return (
    <WebView source={{
      uri: `http://194.195.120.192:8080/view/pano/${panoId}`
    }} style={{ width: viewerWidth, marginTop: 16 }}/>
  );
}
