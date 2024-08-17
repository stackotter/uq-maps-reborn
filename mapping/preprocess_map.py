import json
from math import sqrt
import geopy.distance

infile = "latlongs.json"
buildingsfile = "../scraping/data/buildings.json"
outfile = "map.json"

with open(infile, "r") as f:
    in_nodes = json.loads(f.read())
with open(buildingsfile, "r") as f:
    in_buildings = json.loads(f.read())

buildings = []
nodes = []
edges = []
rooms = []

# Maps buildings to a map from room numbers to nodes
building_room_nodes = {}

# Advanced Engineering Building
assumed_building = 24

for i, node in enumerate(in_nodes):
    name = node["name"]
    room = None
    if "room" in node["tags"]:
        room = name
        name = None
        if assumed_building in building_room_nodes:
            room_nodes = building_room_nodes[assumed_building]
        else:
            room_nodes = {}
            building_room_nodes[assumed_building] = room_nodes
        if room in room_nodes:
            room_nodes[room].append((i, node))
        else:
            room_nodes[room] = [(i, node)]

    nodes.append({
        "name": node["name"],
        "room": room,
        "floor": node["floor"],
        "building": assumed_building,
        "latitude": node["lat"],
        "longitude": node["lng"],
        "tags": node["tags"],
        "edges": []
    })
    for connection in node["connected_nodes"]:
        endnode = connection["index"]
        edge_id = len(edges)

        start_point = (in_nodes[endnode]['lat'], in_nodes[endnode]['lng'])
        end_point = (node['lat'], node['lng'])

        edges.append({
            "tags": [connection["type"]] if "type" in connection else [],
            "startnode": i,
            "endnode": endnode,
            "length": geopy.distance.geodesic(start_point, end_point).m
        })
        nodes[endnode]["edges"].append(edge_id)
        nodes[i]["edges"].append(edge_id)

for building in in_buildings:
    border = building["border"]
    lat_sum = sum(x["lat"] for x in border)
    long_sum = sum(x["lng"] for x in border)
    lat = lat_sum / len(border)
    long = long_sum / len(border)
    buildings.append({
        "name": building["name"][1],
        "number": building["name"][0],
        "latitude": lat,
        "longitude": long,
        "border": border
    })

for building_id, room_nodes in building_room_nodes.items():
    for room_number, nodes_of_room in room_nodes.items():
        lat = sum(node[1]["lat"] for node in nodes_of_room) / len(nodes_of_room)
        long = sum(node[1]["lng"] for node in nodes_of_room) / len(nodes_of_room)
        rooms.append({
            "building": building_id,
            "number": room_number,
            "latitude": lat,
            "longitude": long,
            "nodes": [node[0] for node in nodes_of_room]
        })


with open(outfile, "w") as f:
    f.write(json.dumps({
        "buildings": buildings,
        "rooms": rooms,
        "nodes": nodes,
        "edges": edges
    }, indent=2))
