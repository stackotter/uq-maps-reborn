import json

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

for i, node in enumerate(in_nodes):
    name = node["name"]
    is_room = node["tags"]
    nodes.append({
        "name": node["name"],
        "floor": node["floor"],
        "building": 24,
        "latitude": node["lat"],
        "longitude": node["lng"],
        "tags": node["tags"],
        "edges": []
    })
    for connection in node["connected_nodes"]:
        endnode = connection["index"]
        edge_id = len(edges)
        edges.append({
            "tags": [connection["type"]] if "type" in connection else [],
            "startnode": i,
            "endnode": endnode
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
        "lat": lat,
        "long": long,
        "border": border
    })

with open(outfile, "w") as f:
    f.write(json.dumps({
        "buildings": buildings,
        "nodes": nodes,
        "edges": edges
    }, indent=2))
