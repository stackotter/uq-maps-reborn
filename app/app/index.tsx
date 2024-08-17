import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, StyleSheet, View, TextInput, Keyboard, FlatList, TouchableOpacity, ScrollView } from "react-native";

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Mapbox, {MapView, MarkerView} from "@rnmapbox/maps";
import * as Location from 'expo-location';

import untypedMap from "../assets/data/map.json";
import { Building, Campus, Room } from "@/core/map-data";
import Fuse from "fuse.js";
import { MaterialIcons } from "@expo/vector-icons";

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

const map: Campus = untypedMap as unknown as Campus;

interface SearchableItem {
  type: "room" | "building";
  building?: Building,
  room?: Room
}

// Searchable rooms and buildings
const searchableItems: SearchableItem[] = map.buildings
  .map((building) => {
    return {
      type: "building" as "building" | "room",
      building
    }
  }).concat(map.rooms.map((room) => {
    return {
      type: "room",
      building: map.buildings[room.building],
      room: room
    }
  }));


const fuse = new Fuse(
  searchableItems,
  {
    keys: [
      "type",
      "building.name",
      "building.number",
      "room.name",
      "room.number"
    ]
  }
);

function searchableItemCard(item: SearchableItem) {
  if (item.type === "building") {
    let building = item.building as unknown as Building;
    return <View style={styles.sheetContents}>
      <Text style={styles.heading}>{building.name}</Text>
      <Text style={styles.subtitle}>Building {building.number}</Text>
    </View>;
  } else if (item.type === "room") {
    let building = item.building as unknown as Building;
    let room = item.room as unknown as Room;
    let heading;
    if (room.name !== undefined) {
      heading = `${room.name} - ${building.number}-${room.number}`;
    } else {
      heading = `Room ${building.number}-${room.number}`;
    }
    return <View style={styles.sheetContents}>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.subtitle}>{building.name}</Text>
    </View>;
  }
}

function searchableItemSummary(item: SearchableItem) {
  if (item.type === "building") {
    let building = item.building as unknown as Building;
    return <Text>{building.name + " - " + building.number}</Text>;
  } else if (item.type === "room") {
    let building = item.building as unknown as Building;
    let room = item.room as unknown as Room;
    return <Text>{`Room ${building.number}-${room.number} (${building.name})`}</Text>;
  }
}

// Returns the item's coordinates as `[lat, long]`.
function searchableItemCoordinates(item: SearchableItem) {
  if (item.type === "building") {
    let building = item.building as unknown as Building;
    return [building.longitude, building.latitude];
  } else if (item.type === "room") {
    let room = item.room as unknown as Room;
    return [room.longitude, room.latitude];
  }
}

export default function Index() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchableItem | null>(null);

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

  function selectItem(item:SearchableItem) {
    setSelectedItem(item);
    bottomSheetRef.current?.snapToIndex(0);
  }

  let sheetContent;
  if (selectedItem === null) {
    let searchResultsView;
    if (searchTerm.length !== 0) {
      searchResultsView = <FlatList
        data={fuse.search(searchTerm)}
        keyboardShouldPersistTaps="never"
        renderItem={({item: { item }}) => {
          return <TouchableOpacity onPress={() => selectItem(item)} style={styles.searchResult}>
            {searchableItemSummary(item)}
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
    sheetContent = searchableItemCard(selectedItem);
  }

  let markers = selectedItem === null ? [] : [{key: "selected", item: selectedItem}];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.page}>
        <View style={styles.container}>
          <MapView style={styles.map}>
            {
              markers.map(({key, item}) => {
                return <MarkerView key={key} anchor={{x: 0.5, y: 1}} coordinate={searchableItemCoordinates(item)} isSelected={true}>
                  <MaterialIcons name="location-pin" color="#e56a6a" size={40} />
                </MarkerView>;
              })
            }
          </MapView>
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
