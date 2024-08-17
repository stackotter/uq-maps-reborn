import folium
import json

map = folium.Map(
    [-27.49999290407647, 153.01510439349107],
    zoom_start=23,
    max_zoom=100
)

with open("latlongs.json", "r") as f:
    nodes = json.loads(f.read())

orphan_icon = folium.Icon(color='red')
regular_icon = folium.Icon(color='blue')

floor = input("Floor [default: None]: ")
if floor == "":
    floor = None

for i, node in enumerate(nodes):
    if floor is not None and node["floor"] != floor:
        continue
    lat = node["lat"]
    long = node["lng"]
    start = [lat, long]
    label = "Node %d" % i
    point = folium.Marker(
        start,
        popup=label
        # icon=orphan_icon if node["connected_nodes"] == [] else regular_icon
    )
    point.add_to(map)
    for end_node in node["connected_nodes"]:
        end_node_index = end_node["index"]
        if floor is not None and nodes[end_node_index]["floor"] != floor:
            continue
        end = [
            nodes[end_node_index]["lat"],
            nodes[end_node_index]["lng"]
        ]
        line = folium.PolyLine([start, end])
        line.add_to(map)

map.save("map.html")
