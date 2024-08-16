import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, Text } from "react-native";
import Mapbox, {MapView} from "@rnmapbox/maps";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from "react-native-gesture-handler";

Mapbox.setAccessToken("pk.eyJ1Ijoic3RhY2tvdHRlciIsImEiOiJjbHp3amxuY24waG02MmpvZDhmN2QyZHQyIn0.j7bBcGFDFDhwrbzj6cgWQw");

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  container: {
    height: "100%",
    width: "100%",
    backgroundColor: "tomato"
  },
  map: {
    flex: 1
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});

export default function Index() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.page}>
        <View style={styles.container}>
          <MapView style={styles.map} />
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={['20%', '80%']}
          onChange={handleSheetChanges}
        >
          <BottomSheetView style={styles.contentContainer}>
            <Text>Awesome 🎉</Text>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
