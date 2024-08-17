import json
import folium
from scrape import *


def main():
    campuses = GetCampuses()
    stlucia = None
    for campus in campuses.value:
        if campus.id == 406:
            stlucia = campus
            break
    
    map = folium.Map(location=[stlucia.centerpoint.x, stlucia.centerpoint.y], 
                     zoom_start=15, max_zoom=23, control_scale=True)

    lines = []
    for path in GetSafePaths(stlucia.id).value:
        path = [[p.y, p.x] for p in path]
        line = folium.PolyLine(path,
                               color='blue',
                               weight=15,
                               opacity=0.8)
        lines.append(line)
        line.add_to(map)
    
    '''
    # add custom points on with label
    for point in points:
        point = folium.Marker(point, popup='Point')
        point.add_to(map)
    '''

    markers = []
    with open('data/nodes', 'r') as f:
        content = json.load(f)
        for item in content:
            if 'General Purpose South' in item['name']:
                print(item['name'])
                marker = folium.Marker([item['lat'], item['lng']], color='red', weight=10, popup=item['name'])
                marker.add_to(map)
                markers.append(marker)


    map.save('map.html')

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        pass
