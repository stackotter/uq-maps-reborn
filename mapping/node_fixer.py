import json

from selenium import webdriver


driver = webdriver.Firefox()

outfile = "latlongs.json"
with open(outfile, "r") as f:
    nodes = json.loads(f.read())

fixed_nodes = []
for node in nodes:
    lat = node["lat"]
    long = node["lng"]
    driver.get(f"https://maps.uq.edu.au/?zoom=19&campusId=406&lat={lat}&lng={long}&zLevel=3")
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

    keep = None
    while keep not in ["y", "n"]:
        keep = input("Keep? (y/n): ")
    if keep == "n":
        continue

    floor = input("Floor: ")

    url = driver.current_url

    lat = float(url.split("&lat=")[1].split("&")[0])
    long = float(url.split("&lng=")[1].split("&")[0])
    node["floor"] = floor
    node["lat"] = lat
    node["lng"] = long

    fixed_nodes.append(node)

with open(outfile, "w") as f:
    f.write(json.dumps(fixed_nodes))
