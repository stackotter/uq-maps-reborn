import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, StyleSheet, View, TextInput, Keyboard, FlatList, Button, TouchableOpacity } from "react-native";

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Mapbox, {MapView} from "@rnmapbox/maps";
import * as Location from 'expo-location';

import buildings from "../assets/data/buildings.json";

// import {Dimensions} from 'react-native';
// import PanoViewer from "@/components/PanoViewer";

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
  },
  searchResult: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomColor: "#d9d9d9",
    borderBottomWidth: 1
  },
  heading: {
    fontSize: 28
  },
  subtitle: {
    fontSize: 14
  }
});

interface Building {
  name: string[]
  id: number
  floors: any[]
  border: {lat: number, lng: number}[]
}

export default function Index() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
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

  // let windowWidth = Dimensions.get("window").width;
  // <PanoViewer panoId={1} viewerWidth={windowWidth - 32} />

  let sheetContent;
  if (selectedBuilding === null) {
    let searchResultsView;
    if (searchTerm.length !== 0) {
      searchResultsView = <FlatList
        data={
          buildings
            .filter((building) => {
              return building.name.join(" ").includes(searchTerm);
            })
            .sort((a, b) => {
              return (parseInt(a.name[0]) - parseInt(b.name[0]) ||
                  a.name[0].localeCompare(b.name[0]) ||
                  a.name[1].localeCompare(b.name[1]));
            })
        }
        renderItem={({item}) => {
          return <TouchableOpacity onPress={() => setSelectedBuilding(item)} style={styles.searchResult}>
            <Text>{item.name[0] + " - " + item.name[1]}</Text>
          </TouchableOpacity>;
        }}
      />;
    } else {
      function searchTermSuggestion(color: string, label: string, suggestedSearchTerm: string) {
        return <TouchableOpacity onPress={() => onChangeSearchTerm(suggestedSearchTerm)}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16
            }}
          >
            <Text style={{color: "white"}}>{label}</Text>
          </View>
        </TouchableOpacity>
      }

      searchResultsView = <View style={{display: "flex", marginTop: 16, flexDirection: "row"}}>
        {searchTermSuggestion("#5071e6", "Toilets", "Toilet")}
        {searchTermSuggestion("#5a9149", "Bike Boxes", "Bike box")}
        {searchTermSuggestion("#dbc44f", "Showers", "Shower")}
      </View>;
    }

    sheetContent = <View style={styles.sheetContents}>
      <TextInput
        style={styles.input}
        onChangeText={onChangeSearchTerm}
        onFocus={onFocusSearchInput}
        value={searchTerm}
        placeholder="Search UQ..."
        placeholderTextColor={"#fff"}
      />
      {searchResultsView}
    </View>;
  } else {
    sheetContent = <View style={styles.sheetContents}>
      <Text style={styles.heading}>{selectedBuilding.name[1]}</Text>
      <Text style={styles.subtitle}>Building {selectedBuilding.name[0]}</Text>
    </View>;
  }

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
            {sheetContent}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
