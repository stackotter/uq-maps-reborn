import os
import json

from selenium import webdriver

# https://maps.uq.edu.au/?zoom=16.580889752958626&campusId=406&lat=-27.4979649714223&lng=153.015831589828&zLevel=1

driver = webdriver.Firefox()
driver.get("https://maps.uq.edu.au/")
driver.execute_script(
    """
    let div = document.createElement("div")
    div.style.backgroundColor = "red";
    div.style.width = "10px";
    div.style.height = "10px";
    div.style.position = "absolute";
    div.style.top = "50%";
    div.style.left = "50%";
    div.style.transform = "translate(-50%, -50%)";
    document.body.appendChild(div);
    """
)

outfile = "latlongs.json"
if not os.path.isfile(outfile):
    with open(outfile, "w") as f:
        f.write("[]")

with open(outfile, "r") as f:
    data = json.loads(f.read())

floor = None
while True:
    try:
        new_floor = input(f"Floor [default: {floor}]: " if floor is not None else "Floor: ")
        if new_floor != "" or floor is None:
            floor = new_floor

        tags = [x.strip() for x in input("Tags: ").split(",") if x.strip() != ""]
        name = input("Name: ")
        if name == "":
            name = None

        connected_nodes = input("Connected nodes: ")
        if connected_nodes == "":
            connected_nodes = []
        else:
            connected_nodes = [x.strip() for x in connected_nodes.split(",")]
            parsed = []
            for node in connected_nodes:
                parts = node.split(" ", 1)
                if len(parts) == 2:
                    parsed.append({"index": int(parts[0]), "type": parts[1]})
                else:
                    parsed.append({"index": int(parts[0])})
            connected_nodes = parsed

        has_photo = input("Took photo? [default: y]: ") != "n"

        notes = input("Notes [optional]: ")
        if notes == "":
            notes = None

        url = driver.current_url

        lat = float(url.split("&lat=")[1].split("&")[0])
        long = float(url.split("&lng=")[1].split("&")[0])

        print("Done.\n")

        data.append({
            "lat": lat,
            "floor": floor,
            "lng": long,
            "name": name,
            "has_photo": has_photo,
            "tags": tags,
            "connected_nodes": connected_nodes,
            "notes": notes
        })
        with open(outfile, "w") as f:
            f.write(json.dumps(data))
    except KeyboardInterrupt:
        break
    except Exception as e:
        print(e)
        continue
