import folium
import json

from time import sleep
from selenium import webdriver

driver = webdriver.Firefox()

firstTime = True
while True:
    map = folium.Map(
        [-27.49999290407647, 153.01510439349107],
        zoom_start=22
    )

    with open("latlongs.json", "r") as f:
        nodes = json.loads(f.read())

    for i, node in enumerate(nodes):
        point = folium.Marker([node["lat"], node["lng"]], popup=f"Node {i}")
        point.add_to(map)

    map.save("map.html")

    if firstTime:
        driver.get("file:///Users/stackotter/Desktop/Projects/UQMapsReborn/uq-maps-reborn/imaging/map.html")
        firstTime = False
    else:
        driver.refresh()

    sleep(5)
