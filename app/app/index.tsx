import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, TextInput, Keyboard } from "react-native";
import Mapbox, {MapView} from "@rnmapbox/maps";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Location from 'expo-location';

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
  sheetContents: {
    width: "100%",
    paddingLeft: 16,
    paddingRight: 16
  },
  input: {
    width: "100%",
    backgroundColor: "lightgray",
    borderRadius: 4,
    padding: 8
  }
});

export default function Index() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      console.log(currentLocation);
      setLocation(currentLocation);
    })();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index == 0) {
      Keyboard.dismiss();
    }
  }, []);

  const [searchTerm, onChangeSearchTerm] = React.useState('');

  const onFocusSearchInput = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
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
            <View style={styles.sheetContents}>
              <TextInput
                style={styles.input}
                onChangeText={onChangeSearchTerm}
                onFocus={onFocusSearchInput}
                value={searchTerm}
                placeholder="Search UQ..."
              />
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
