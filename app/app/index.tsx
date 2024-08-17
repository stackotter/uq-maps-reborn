import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, StyleSheet, View, TextInput, Keyboard, FlatList, TouchableOpacity, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Mapbox, {Camera, LocationPuck, MapView, MarkerView} from "@rnmapbox/maps";
import * as Location from 'expo-location';
import { getDistance } from "geolib";

import untypedMap from "../assets/data/map.json";
import { Building, Campus, InstructionType, Path, Room } from "@/core/map-data";
import Fuse from "fuse.js";
import { FindPath, ToDirections } from "@/core/pathfinder";

import {Dimensions} from 'react-native';
import PanoViewer from "@/components/PanoViewer";

Mapbox.setAccessToken("pk.eyJ1Ijoic3RhY2tvdHRlciIsImEiOiJjbHp3amxuY24waG02MmpvZDhmN2QyZHQyIn0.j7bBcGFDFDhwrbzj6cgWQw");

const WALKING_METERS_PER_SECOND = 1.2;

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
    backgroundColor: "white",
    position: "relative"
  },
  map: {
    height: Dimensions.get("window").height * 0.85
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
    backgroundColor: "#ddd",
    borderRadius: 4,
    padding: 8
  },
  startLocationInput: {
    width: 260,
    backgroundColor: "#ddd",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomColor: "gray",
    borderBottomWidth: 1,
    height: 34,
    padding: 8,
    overflow: "hidden",
  },
  endLocationInput: {
    width: 260,
    backgroundColor: "#ddd",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    height: 34,
    padding: 8,
    overflow: "hidden"
  },
  locationInputText: {
    color: "#1557ff"
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
  },
  previousButton: {
    width: "48%",
    backgroundColor: "#ddd",
    borderRadius: 8,
    paddingTop: 14,
    paddingBottom: 14,
    marginTop: 16
  },
  previousButtonText: {
    color: "black",
    fontSize: 16,
    textAlign: "center"
  },
  nextButton: {
    width: "48%",
    backgroundColor: "#4759fc",
    borderRadius: 8,
    paddingTop: 14,
    paddingBottom: 14,
    marginTop: 16
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center"
  },
  button: {
    width: "100%",
    backgroundColor: "#4759fc",
    borderRadius: 8,
    paddingTop: 14,
    paddingBottom: 14,
    marginTop: 16
  },
  squareButton: {
    aspectRatio: 1,
    backgroundColor: "#4759fc",
    borderRadius: 8,
    padding: 14,
  },
  disabledButton: {
    backgroundColor: "#ddd"
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold"
  },
  squareButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold"
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd",
    borderRadius: 20,
    width: 40,
    height: 40
  },
  centerUserButton: {
    backgroundColor: "white",
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 2},
    position: "absolute",
    top: 32,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 8,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
});

const nodeBearingAdjustments: {[key: number]: number} = {
  8: 25,
  10: 45,
  12: 10
};

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

function displayNameForNode(nodeId: number) {
  let node = map.nodes[nodeId];
  if (node.name !== undefined && node.name !== null) {
    if (node.building !== null && node.building !== undefined) {
      return `${node.name} - ${map.buildings[node.building].name}`;
    } else {
      return node.name;
    }
  } else if (node.room !== undefined && node.room !== null) {
    let building = map.buildings[node.building as number];
    return `Room ${building.number}-${node.room}`;
  } else if (node.building !== undefined && node.building !== null) {
    return map.buildings[node.building].name;
  } else {
    return "Selected location";
  }
}

function displayNameForLocation(item: SearchableItem) {
  if (item.type === "room") {
    let building = item.building as Building;
    let room = item.room as Room;
    return `Room ${building.number}-${room.number} (${building.name})`;
  } else if (item.type === "building") {
    let building = item.building as Building;
    return `${building.number} - ${building.name}`;
  }
}

function findShortestPathFromNodeToLocation(startNode: number, endLocation: SearchableItem) {
  let destinations = searchableItemNodes(endLocation) || [];
  let paths = destinations.map((destination) => {
    return FindPath(startNode, destination, map);
  })
  return shortestOf(paths);  
}

function nearestNodeTo(location: Location.LocationObject | null) {
  if (location !== null) {
    let nearestNodeIndex = null;
    let minDistance = Number.MAX_VALUE;
    let i = 0;
    for (let node of map.nodes) {
      let distance = getDistance(node, location.coords);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNodeIndex = i;
      }
      i++;
    }
    return nearestNodeIndex;
  } else {
    return null;
  }
}

function pathLengthOf(path: Path) {
  if (path.edges.length === 0) {
    return 0;
  }
  return path.edges.map((edge) => {
    return map.edges[edge].length;
  }).reduce((x, y) => x + y);
}

function shortestOf(paths: Path[]) {
  let shortestPath = null;
  let shortestPathLength = null;
  for (let path of paths) {
    let pathLength = pathLengthOf(path);
    if (shortestPathLength === null || pathLength < shortestPathLength) {
      shortestPathLength = pathLength;
      shortestPath = path;
    }
  }
  if (shortestPath !== null && shortestPathLength !== null) {
    return {
      path: shortestPath,
      length: shortestPathLength
    };
  } else {
    return null;
  }
}

function searchableItemCard(item: SearchableItem) {
  if (item.type === "building") {
    let building = item.building as unknown as Building;
    return <View>
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
    return <View>
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

function searchableItemNodes(item: SearchableItem) {
  if (item.type === "building") {
    let building = item.building as unknown as Building;
    return map.nodes
      .map((node, i) => {return {node, index: i}})
      .filter(({node}) => {
        return node.building !== undefined && map.buildings[node.building].number === building.number;
      })
      .map(({index}) => index);
  } else if (item.type === "room") {
    let room = item.room as unknown as Room;
    return room.nodes;
  }
}

// Returns the item's coordinates as `[long, lat]`.
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
  const [searchTerm, onChangeSearchTerm] = React.useState('');
  const [selectedStartNode, setSelectedStartNode] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [currentNavigationPathIndex, setCurrentNavigationPathIndex] = useState<number>(0);

  let [camera, setCamera] = useState<Camera | null>(null);
  useEffect(() => {
    camera?.setCamera({centerCoordinate: [153.0142397517875, -27.49864297144247], zoomLevel: 15.5, animationDuration: 0});
  }, [camera]);

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
      onChangeSearchTerm("");
    }
  }, []);

  const onFocusSearchInput = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
  }, []);

  // let windowWidth = Dimensions.get("window").width;
  // <PanoViewer panoId={1} viewerWidth={windowWidth - 32} />

  function selectItem(item: SearchableItem) {
    setSelectedItem(item);
    bottomSheetRef.current?.snapToIndex(0);
    camera?.setCamera({centerCoordinate: searchableItemCoordinates(item), zoomLevel: 17});
    onChangeSearchTerm("");
  }

  function centerUser() {
    if (location !== null) {
      let latitude = location.coords.latitude;
      let longitude = location.coords.longitude;
      camera?.setCamera({centerCoordinate: [longitude, latitude], zoomLevel: 16.5});
    }
  }

  function closeSheet() {
    setSelectedItem(null);
    setSelectedStartNode(null);
    setSelectedPath(null);
    setCurrentNavigationPathIndex(0);
    bottomSheetRef.current?.snapToIndex(0);
  }

  let sheetContent;
  let snapPoints;
  let panoId: number | null = null;
  let panoBearing: number | null = null;
  if (selectedItem === null) {
    snapPoints = ["20%", "80%"];
    let searchResultsView;
    if (searchTerm.length !== 0) {
      searchResultsView = <FlatList
        data={fuse.search(searchTerm)}
        keyboardShouldPersistTaps="always"
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
        placeholderTextColor={"#333"}
      />
      {searchResultsView}
    </View>;
  } else if (selectedStartNode === null) {
    let nearestNode = nearestNodeTo(location);
    let timeEstimateMinutes: number | null = null;
    if (nearestNode !== null) {
      let shortestPath = findShortestPathFromNodeToLocation(nearestNode, selectedItem);
      let shortestPathLength = shortestPath?.length;
      if (shortestPathLength !== null && shortestPathLength !== undefined) {
        timeEstimateMinutes = Math.ceil(shortestPathLength / WALKING_METERS_PER_SECOND / 60);
      }
    }

    function onPressDirectionsButton() {
      setSelectedStartNode(nearestNode);
    }

    snapPoints = ["30%", "80%"];
    sheetContent = <View style={styles.sheetContents}>
      <View style={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
        {searchableItemCard(selectedItem)}
        <Pressable style={styles.closeButton} onPress={closeSheet}>
          <MaterialIcons name="close" color="#333" size={30} />
        </Pressable>
      </View>
      <Pressable style={{...styles.button}} onPress={onPressDirectionsButton}>
        <Text style={styles.buttonText}>
          {timeEstimateMinutes === null ? "Directions" : `Directions (${timeEstimateMinutes} min)`}
        </Text>
      </Pressable>
    </View>;
  } else if (selectedPath === null) {
    let timeEstimateMinutes: number | null = null;
    let shortestPath = findShortestPathFromNodeToLocation(selectedStartNode, selectedItem);
    if (shortestPath !== null) {
      let shortestPathLength = shortestPath?.length;
      timeEstimateMinutes = Math.ceil(shortestPathLength / WALKING_METERS_PER_SECOND / 60);
    }

    let extraStyles = timeEstimateMinutes === null ? styles.disabledButton : {};
    snapPoints = ["40%", "80%"];
    sheetContent = <View style={styles.sheetContents}>
      <View style={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4}}>
        <View>
          <Pressable style={styles.startLocationInput}>
            <Text numberOfLines={1} style={styles.locationInputText}>From: {displayNameForNode(selectedStartNode)}</Text>
          </Pressable>
          <Pressable style={styles.endLocationInput}>
            <Text numberOfLines={1} style={styles.locationInputText}>To: {displayNameForLocation(selectedItem)}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.closeButton} onPress={closeSheet}>
          <MaterialIcons name="close" color="#333" size={30} />
        </Pressable>
      </View>
      <View style={{marginTop: 32, padding: 8, backgroundColor: "#ddd", borderRadius: 10}}>
        { timeEstimateMinutes !== null && shortestPath !== null ?
          <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
            <View>
              <Text style={{fontSize: 20}}>Shortest route</Text>
              <Text style={styles.subtitle}>{timeEstimateMinutes} min • {Math.ceil(shortestPath?.length || 0)}m</Text>
            </View>
            <Pressable
              style={{...styles.squareButton, ...extraStyles}}
              onPress={() => {
                setSelectedPath(shortestPath?.path as Path);
                bottomSheetRef.current?.snapToIndex(1);
              }}
            >
              <Text style={styles.squareButtonText}>Go</Text>
            </Pressable>
          </View> :
          <Text>Directions unavailable</Text>
        }
      </View>
    </View>
  } else {
    snapPoints = ["32%", "80%"];
    let directions = ToDirections(selectedPath);
    let currentDirection = directions.nodeDirectionChanges[currentNavigationPathIndex];
    let currentEdgeMessage = currentNavigationPathIndex < directions.edgeMessages.length ? directions.edgeMessages[currentNavigationPathIndex] : null;
    let currentEdge = selectedPath.edges[currentNavigationPathIndex === selectedPath.edges.length ? currentNavigationPathIndex - 1 : currentNavigationPathIndex];
    let currentNode = selectedPath.nodes[currentNavigationPathIndex];
    panoBearing = map.edges[currentEdge].bearing_degrees;
    if (currentNavigationPathIndex < selectedPath.edges.length ? map.edges[currentEdge].startnode === currentNode : map.edges[currentEdge].endnode === currentNode) {
      panoBearing -= 180;
    }
    let bearingAdjustment = nodeBearingAdjustments[currentNode] || 0;
    panoBearing += bearingAdjustment;

    panoId = selectedPath.nodes[currentNavigationPathIndex];

    function onPressPrevious() {
      if (currentNavigationPathIndex > 0) {
        setCurrentNavigationPathIndex(currentNavigationPathIndex - 1);
      }
    }

    function onPressNext() {
      if (currentNavigationPathIndex < selectedPath!.nodes.length - 1) {
        setCurrentNavigationPathIndex(currentNavigationPathIndex + 1);
      }
    }

    sheetContent = <View style={styles.sheetContents}>
      <View style={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4}}>
        <View>
          <Text style={styles.heading}>{currentDirection}</Text>
          {currentEdgeMessage !== null ? <Text style={styles.subtitle}>{currentEdgeMessage}</Text> : <></>}
        </View>
        <Pressable style={styles.closeButton} onPress={closeSheet}>
          <MaterialIcons name="close" color="#333" size={30} />
        </Pressable>
      </View>
      <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
        <Pressable style={styles.previousButton} onPress={onPressPrevious}>
          <View style={{display: "flex", flexDirection: "row", alignItems: "center", margin: "auto", paddingRight: 12, justifyContent: "center"}}>
            <MaterialIcons name="chevron-left" color="black" size={28} />
            <Text style={styles.previousButtonText}>Previous</Text>
          </View>
        </Pressable>
        <Pressable style={styles.nextButton} onPress={onPressNext}>
          <View style={{display: "flex", flexDirection: "row", alignItems: "center", margin: "auto", paddingLeft: 12, justifyContent: "center"}}>
            <Text style={styles.nextButtonText}>Next</Text>
            <MaterialIcons name="chevron-right" color="white" size={28} />
          </View>
        </Pressable>
      </View>
    </View>;
  }

  let markers = selectedItem === null ? [] : [{key: "selected", item: selectedItem}];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.page}>
        <View style={styles.container}>
          <MapView style={styles.map} compassEnabled compassFadeWhenNorth compassPosition={{top: 64, right: 8}}>
            <Camera ref={setCamera}/>
            <LocationPuck puckBearingEnabled puckBearing="heading"/>
            {
              markers.map(({key, item}) => {
                return <MarkerView key={key} anchor={{x: 0.5, y: 1}} coordinate={searchableItemCoordinates(item)} isSelected={true}>
                  <MaterialIcons name="location-pin" color="#e56a6a" size={40} />
                </MarkerView>;
              })
            }
          </MapView>
          <Pressable style={styles.centerUserButton} onPress={centerUser}>
            <MaterialIcons name="my-location" color="#333" size={30} />
          </Pressable>
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
        >
          <BottomSheetView style={styles.contentContainer}>
            {sheetContent}
            {panoId === null ? <></> : <PanoViewer panoId={panoId} initialCompassBearing={panoBearing} viewerWidth={Dimensions.get("window").width - 32}/>}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
