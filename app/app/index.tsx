import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, StyleSheet, View, TextInput, Keyboard, FlatList, TouchableOpacity, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { lineString } from "@turf/helpers";

import { useNetInfo } from "@react-native-community/netinfo";

import Mapbox, {Camera, LocationPuck, MapView, MarkerView} from "@rnmapbox/maps";
import * as Location from 'expo-location';
import { getDistance } from "geolib";

import untypedMap from "../assets/data/map.json";
import { Building, Campus, Node, Path, Room } from "@/core/map-data";
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
  12: 10,
  7: -20,
  9: 20,
  19: 55,
  13: 40
};

const map: Campus = untypedMap as unknown as Campus;

interface SearchableItem {
  type: "room" | "building" | "named_node";
  building?: Building,
  room?: Room,
  node?: Node,
  nodeIndex?: number
}

const nonBuildingSearchableItems: SearchableItem[] = map.rooms.map((room) => {
    return {
      type: "room",
      building: map.buildings[room.building],
      room: room
    } as SearchableItem
  }).concat(map.nodes.map((node, i) => {
    let building;
    let room;
    if (node.building !== null && node.building !== undefined) {
      building = map.buildings[node.building];
    }
    if (node.room !== null && node.room !== undefined) {
      room = map.rooms.find((room) => room.number === node.room);
    }
    return {
      type: "named_node",
      building,
      room,
      node,
      nodeIndex: i
    } as SearchableItem;
  }).filter((item) => {
    return item.node!.name !== undefined && item.node!.name !== null;
  }));

// Searchable rooms and buildings
const searchableItems: SearchableItem[] = map.buildings
  .map((building) => {
    return {
      type: "building",
      building
    } as SearchableItem
  }).concat(nonBuildingSearchableItems);

const fuse = new Fuse(
  searchableItems,
  {
    keys: [
      "type",
      "building.name",
      "building.number",
      "room.name",
      "room.number",
      "node.name"
    ]
  }
);

const fuseWithoutBuildings = new Fuse(
  nonBuildingSearchableItems,
  {
    keys: [
      "type",
      "building.name",
      "building.number",
      "room.name",
      "room.number",
      "node.name"
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
  } else if (item.type === "named_node") {
    let building = item.building;
    let room = item.room;
    if (building !== null && building !== undefined) {
      if (room !== null && room !== undefined) {
        return `${item.node!.name!} (in room ${building.number}-${room.number})`;
      } else {
        return `${item.node!.name!} - ${building.name}`;
      }
    } else {
      return item.node!.name!;
    }
  }
}

function findShortestPathFromNodeToLocation(startNode: number, endLocation: SearchableItem, accessible: boolean) {
  let destinations = searchableItemNodes(endLocation) || [];
  let paths = destinations.map((destination: number) => {
    return FindPath(startNode, destination, map, accessible);
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
      length: shortestPathLength,
      timeEstimateMinutes: Math.ceil(shortestPathLength / WALKING_METERS_PER_SECOND / 60)
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
  } else if (item.type === "named_node") {
    let subtitle = null;
    let building = item.building;
    let room = item.room;
    if (building !== null && building !== undefined) {
      if (room !== null && room !== undefined) {
        subtitle = `Room ${building.number}-${room.number}`;
      } else {
        subtitle = `Building ${building.number}`;
      }
    }
    return <View>
      <Text style={styles.heading}>{item.node!.name!}</Text>
      {subtitle !== null ? <Text style={styles.subtitle}>{subtitle}</Text> : <></>}
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
  } else if (item.type === "named_node") {
    return <Text>{displayNameForLocation(item)}</Text>;
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
  } else if (item.type === "named_node") {
    return [item.nodeIndex!];
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
  } else if (item.type === "named_node") {
    return [item.node!.longitude, item.node!.latitude];
  }
}

export default function Index() {
  // Ensure that UQ is available offline
  useEffect(() => {
    (async () => {
      console.log("Checking for offline UQ region");
      let pack = await Mapbox.offlineManager.getPack("uq");
      if (pack === undefined) {
        const progressListener = (_: any, status: any) => console.log("Map download progress:", status);
        const errorListener = (_: any, error: any) => console.log("Map download error:", error);
        await Mapbox.offlineManager.createPack({
          name: 'uq',
          styleURL: Mapbox.StyleURL.Street,
          minZoom: 14,
          maxZoom: 22,
          bounds: [[153.02678934205406, -27.488477129684053], [152.98988214725247, -27.509908655524164]]
        }, progressListener, errorListener);
      } else {
        console.log("Found offline region");
      }
    })();
  }, []);

  const netInfo = useNetInfo();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchableItem | null>(null);
  const [searchTerm, onChangeSearchTerm] = React.useState('');
  const [selectedStartNode, setSelectedStartNode] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [currentNavigationPathIndex, setCurrentNavigationPathIndex] = useState<number>(0);
  const [isSelectingStartLocation, setIsSelectingStartLocation] = useState<boolean>(false);
  const [isSelectingEndLocation, setIsSelectingEndLocation] = useState<boolean>(false);

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

      if (isSelectingStartLocation || isSelectingEndLocation) {
        setIsSelectingStartLocation(false);
        setIsSelectingEndLocation(false);
      }
    }
  }, []);

  const onFocusSearchInput = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
  }, []);

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
  let route;
  let accessibleRoute;
  let markers: { key: string, location: number[] }[] = [];
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
      function searchTermSuggestion(color: string, icon: string, suggestedSearchTerm: string) {
        return <TouchableOpacity
          onPress={() => {
            onChangeSearchTerm(suggestedSearchTerm);
            bottomSheetRef.current?.snapToIndex(1);
          }}
        >
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
            <MaterialIcons name={icon as any} size={32} color="white"/>
          </View>
        </TouchableOpacity>
      }

      searchResultsView = <View style={{display: "flex", marginTop: 16, flexDirection: "row"}}>
        {searchTermSuggestion("#5071e6", "wc", "Toilet")}
        {searchTermSuggestion("#EB7D2D", "elevator", "Elevator")}
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
      let shortestPath = findShortestPathFromNodeToLocation(nearestNode, selectedItem, false);
      timeEstimateMinutes = shortestPath?.timeEstimateMinutes ?? null;
    }

    let endLocation = searchableItemCoordinates(selectedItem);
    if (endLocation !== undefined) {
      markers = [{key: "selected", location: endLocation}];
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
  } else if (isSelectingStartLocation || isSelectingEndLocation) {
    snapPoints = ["30%", "80%"];
    let searchableList = isSelectingStartLocation ? fuseWithoutBuildings : fuse;
    let searchResultsView = <FlatList
      data={searchableList.search(searchTerm)}
      keyboardShouldPersistTaps="always"
      renderItem={({item: { item }}) => {
        return <TouchableOpacity
          onPress={() => {
            bottomSheetRef.current?.snapToIndex(0);
            if (isSelectingStartLocation) {
              setSelectedStartNode((item.nodeIndex ?? item.room?.nodes[0]) ?? -1);
            } else {
              setSelectedItem(item);
            }
            setIsSelectingStartLocation(false);
            setIsSelectingEndLocation(false);
          }}
          style={styles.searchResult}
        >
          {searchableItemSummary(item)}
        </TouchableOpacity>;
      }}
    />;

    sheetContent = <View style={styles.sheetContents}>
      <TextInput
        style={styles.input}
        onChangeText={onChangeSearchTerm}
        onFocus={onFocusSearchInput}
        autoFocus
        value={searchTerm}
        placeholder="Search UQ..."
        placeholderTextColor={"#333"}
      />
      {searchResultsView}
    </View>;
  } else if (selectedPath === null) {
    let shortestPath = findShortestPathFromNodeToLocation(selectedStartNode, selectedItem, false);
    let shortestAccessiblePath = findShortestPathFromNodeToLocation(selectedStartNode, selectedItem, true);
    if (shortestPath !== null) {
      let nodePositions = [];
      for (let nodeIndex of shortestPath.path.nodes) {
        let node = map.nodes[nodeIndex];
        nodePositions.push([node.longitude, node.latitude]);
      }
      if (nodePositions.length > 1) {
        route = lineString(nodePositions);
        markers = [{key: "Destination", location: route.geometry.coordinates[route.geometry.coordinates.length - 1]}];
      } else {
        markers = [{key: "Destination", location: nodePositions[0]}];
      }
    } else {
      let endLocation = searchableItemCoordinates(selectedItem);
      if (endLocation !== undefined) {
        markers = [{key: "selected", location: endLocation}];
      }
    }

    if (shortestAccessiblePath !== null) {
      let pathsMatch = JSON.stringify(shortestPath!.path.edges) === JSON.stringify(shortestAccessiblePath.path.edges) && JSON.stringify(shortestPath!.path.nodes) === JSON.stringify(shortestAccessiblePath.path.nodes);
      if (pathsMatch) {
        shortestAccessiblePath = null;
      } else {
        let nodePositions = [];
        for (let nodeIndex of shortestAccessiblePath.path.nodes) {
          let node = map.nodes[nodeIndex];
          nodePositions.push([node.longitude, node.latitude]);
        }
        if (nodePositions.length > 1) {
          accessibleRoute = lineString(nodePositions);
        }
      }
    }

    function routeOption(label: string, buttonColor: string | null, path: {path: Path, length: number, timeEstimateMinutes: number}) {
      let extraButtonStyles = buttonColor !== null ? {backgroundColor: buttonColor} : {};
      return <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
        <View style={{paddingLeft: 4}}>
          <Text style={{fontSize: 20}}>{label}</Text>
          <Text style={styles.subtitle}>{path.timeEstimateMinutes} min • {Math.ceil(path.length || 0)}m</Text>
        </View>
        <Pressable
          style={{...styles.squareButton, ...extraStyles, ...extraButtonStyles}}
          onPress={() => {
            setSelectedPath(path.path as Path);
            if (netInfo.isConnected) {
              bottomSheetRef.current?.snapToIndex(1);
            }
          }}
        >
          <Text style={styles.squareButtonText}>Go</Text>
        </Pressable>
      </View>
    }

    let extraStyles = shortestPath === null ? styles.disabledButton : {};
    snapPoints = ["40%", "80%"];
    sheetContent = <View style={styles.sheetContents}>
      <View style={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4}}>
        <View>
          <Pressable style={styles.startLocationInput} onPress={() => setIsSelectingStartLocation(true)}>
            <Text numberOfLines={1} style={styles.locationInputText}>From: {displayNameForNode(selectedStartNode)}</Text>
          </Pressable>
          <Pressable style={styles.endLocationInput} onPress={() => setIsSelectingEndLocation(true)}>
            <Text numberOfLines={1} style={styles.locationInputText}>To: {displayNameForLocation(selectedItem)}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.closeButton} onPress={closeSheet}>
          <MaterialIcons name="close" color="#333" size={30} />
        </Pressable>
      </View>
      <View style={{marginTop: 32, padding: 8, backgroundColor: "#ddd", borderRadius: 10}}>
        { shortestPath !== null ?
          <View>
            {routeOption("Shortest path", "#4759fc", shortestPath!)}
              {shortestAccessiblePath !== null ?
                <View style={{marginTop: 8}}>
                  {routeOption("Accessible path", "#a745f4", shortestAccessiblePath!)}
                </View> : <></>}
          </View> :
          <Text>Directions unavailable</Text>
        }
      </View>
    </View>
  } else {
    snapPoints = ["32%", "80%"];
    let directions = ToDirections(selectedPath);
    let currentDirection;
    currentDirection = directions[currentNavigationPathIndex];
    let currentEdge = selectedPath.edges[currentNavigationPathIndex === selectedPath.edges.length ? currentNavigationPathIndex - 1 : currentNavigationPathIndex];
    let currentNode = selectedPath.nodes[currentNavigationPathIndex];
    if (selectedPath.edges.length === 0) {
      panoBearing = 0;
    } else {
      panoBearing = map.edges[currentEdge].bearing_degrees;
      if (currentNavigationPathIndex < selectedPath.edges.length ? map.edges[currentEdge].startnode === currentNode : map.edges[currentEdge].endnode === currentNode) {
        panoBearing -= 180;
      }
    }
    let bearingAdjustment = nodeBearingAdjustments[currentNode] || 0;
    panoBearing += bearingAdjustment;

    panoId = selectedPath.nodes[currentNavigationPathIndex];

    let previousButtonDisabled = currentNavigationPathIndex === 0;
    let nextButtonIsDoneButton = currentNavigationPathIndex === selectedPath.nodes.length - 1;
    let previousButtonExtraStyles = previousButtonDisabled ? {display: "none"} : {};
    let nextButtonExtraStyles = previousButtonDisabled ? {width: "100%", paddingLeft: 12} :
      (nextButtonIsDoneButton ? {} : {paddingLeft: 12});

    function onPressPrevious() {
      if (currentNavigationPathIndex > 0) {
        setCurrentNavigationPathIndex(currentNavigationPathIndex - 1);
      }
    }

    function onPressNext() {
      if (nextButtonIsDoneButton) {
        closeSheet();
      } else if (currentNavigationPathIndex < selectedPath!.nodes.length - 1) {
        setCurrentNavigationPathIndex(currentNavigationPathIndex + 1);
      }
    }

    let hasArrived = currentNavigationPathIndex === selectedPath.nodes.length - 1;
    let iconBackgroundColor = hasArrived ? "#009900" : "#f2bf2d";
    let iconForegroundColor = hasArrived ? "white" : "black";

    let nodePositions = [];
    for (let nodeIndex of selectedPath.nodes) {
      let node = map.nodes[nodeIndex];
      nodePositions.push([node.longitude, node.latitude]);
    }
    if (nodePositions.length > 1) {
      route = lineString(nodePositions);
      markers = [{key: "Destination", location: route.geometry.coordinates[route.geometry.coordinates.length - 1]}];
    } else {
      markers = [{key: "Destination", location: nodePositions[0]}];
    }

    let currentDirectionTitle;
    let currentDirectionSubtitle;
    if (currentDirection.title) {
      currentDirectionTitle = currentDirection.title;
      currentDirectionSubtitle = currentDirection.message;
    } else {
      currentDirectionTitle = currentDirection.message;
      currentDirectionSubtitle = "";
    }

    sheetContent = <View style={styles.sheetContents}>
      <View style={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, height: 56}}>
        <View style={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8}}>
          <View style={{marginRight: 16, marginLeft: 8, transform: "rotate(45deg)", backgroundColor: iconBackgroundColor, padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <MaterialIcons name={currentDirection?.icon as any} size={36} color={iconForegroundColor} style={{transform: "rotate(-45deg)"}} />
          </View>
          <View>
            <Text style={styles.heading}>{currentDirectionTitle}</Text>
            {currentDirectionSubtitle !== null && currentDirectionSubtitle !== "" ? <Text style={styles.subtitle}>{currentDirectionSubtitle}</Text> : <></>}
          </View>
        </View>
        <Pressable style={styles.closeButton} onPress={closeSheet}>
          <MaterialIcons name="close" color="#333" size={30} />
        </Pressable>
      </View>
      <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
        <Pressable style={{...styles.previousButton, ...previousButtonExtraStyles}} onPress={onPressPrevious}>
          <View style={{display: "flex", flexDirection: "row", alignItems: "center", margin: "auto", paddingRight: 12, justifyContent: "center"}}>
            <MaterialIcons name="chevron-left" color="black" size={28}/>
            <Text style={styles.previousButtonText}>Previous</Text>
          </View>
        </Pressable>
        <Pressable style={{...styles.nextButton, ...nextButtonExtraStyles}} onPress={onPressNext}>
          <View style={{display: "flex", flexDirection: "row", alignItems: "center", margin: "auto", justifyContent: "center"}}>
            <Text style={styles.nextButtonText}>{nextButtonIsDoneButton ? "Done" : "Next"}</Text>
            {nextButtonIsDoneButton ? <></> : <MaterialIcons name="chevron-right" color="white" size={28}/>}
          </View>
        </Pressable>
      </View>
    </View>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.page}>
        <View style={styles.container}>
          <MapView style={styles.map} compassEnabled compassFadeWhenNorth compassPosition={{top: 64, right: 8}}>
            <Camera ref={setCamera}/>
            <LocationPuck puckBearingEnabled puckBearing="heading"/>
            {route !== undefined ?
              <Mapbox.ShapeSource id="routeSource" shape={route.geometry}>
                <Mapbox.LineLayer id="routeFill" style={{lineColor: "#4759fc", lineWidth: 3.2, lineCap: Mapbox.LineJoin.Round, lineOpacity: 100}} />
              </Mapbox.ShapeSource> :
              <></>
            }
            {accessibleRoute !== undefined ?
              <Mapbox.ShapeSource id="accessibleRouteSource" shape={accessibleRoute.geometry}>
                <Mapbox.LineLayer id="accessibileRouteFill" style={{lineColor: "#a745f4", lineWidth: 3.2, lineCap: Mapbox.LineJoin.Round, lineOpacity: 100}} />
              </Mapbox.ShapeSource> :
              <></>
            }
            {
              markers.map(({key, location}) => {
                return <MarkerView key={key} anchor={{x: 0.5, y: 1}} coordinate={location} isSelected={true}>
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
            {
              panoId === null ?
                <></> :
                (netInfo.isConnected ?
                  <PanoViewer panoId={panoId} initialCompassBearing={panoBearing} viewerWidth={Dimensions.get("window").width - 32}/> :
                  <View style={{display: "flex", flexDirection: "row", width: "100%", alignItems: "center", marginLeft: 16, marginRight: 16, marginTop: 16, justifyContent: "center" }}>
                    <MaterialIcons name="info" size={20} style={{marginRight: 4}} />
                    <Text>Connect to the internet for 360 imagery.</Text>
                  </View>)
            }
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
