import json

with open("data/buildings.json", "r") as f:
    buildings = json.loads(f.read())

search_term = input("Search term: ")
for i, building in enumerate(buildings):
    if search_term in json.dumps(building):
        print("Building %d matches: %s" % (i, json.dumps(building)))
