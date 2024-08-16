import os
import sys
import json

from scrape import *

def TryFormat(name: str):
    if 'room' in name.lower().split():
        if '(' in name:
            name = name.split('(')
            building_code = name[-1].replace(')', '')
            name = ' '.join(name[:-1]).strip().split(' Room ')
            building_name = name[0]
            room_code = name[1]
            return room_code, building_code, building_name
    return None

            

def main():
    TOTAL = 0
    IN_CAMPUS = 0
    IN_BUILDING = 0
    campuses = GetCampuses()
    buildings = GetBuildings(406)

    safe_paths = GetSafePaths(406)
    accessible_paths = GetAccessiblePaths(406)

    if not campuses.success:
        print(campuses)
        sys.exit(1)
    campuses = campuses.value

    if not buildings.success:
        print(buildings)
        sys.exit(1)
    buildings = buildings.value

    if not safe_paths.success:
        print(safe_paths)
        sys.exit(1)
    safe_paths = safe_paths.value

    if not accessible_paths.success:
        print(accessible_paths)
        sys.exit(1)
    accessible_paths = accessible_paths.value


    path_coords = []
    for path in safe_paths + accessible_paths:
        for coord in path:
            if coord not in path_coords:
                path_coords.append(coord)

    print('Preprocessing complete')
    with open('data/unique-paths', 'w') as f:
        raw_coords = [[p.x, p.y] for p in path_coords]
        f.write(json.dumps(raw_coords, indent=4))
    print(len(path_coords))


    items = []
    files = os.listdir('locations')
    for file in files:
        content = None
        with open(f'locations/{file}', 'r') as f:
            content = f.read()
            content = json.loads(content)

        newitem = {}
        for item in content:
            TOTAL += 1
            newitem['uqmaps_id'] = item['id']
            newitem['lat'] = item['latitude']
            newitem['lng'] = item['longitude']

            # otherwise use TryFormat for the name
            newitem['name'] = item['title']
            
            # check which campuse and building this node
            # belongs to (if any)
            point = Point(item['latitude'], item['longitude'])
            if point in path_coords:
                print(item['title'], 'is in a path omg!')
            newitem['campus'] = ''   # default
            newitem['building'] = '' # default
            for campus in campuses:
                if campus.Contains(point):
                    newitem['campus'] = campus.id 
                    IN_CAMPUS += 1
                    break
            for building in buildings:
                if building.Contains(point):
                    newitem['building'] = building.id 
                    IN_BUILDING += 1
                    break

            # get tags working (mapping from UQs original codes)
            newitem['tags'] = [item['typeCode']]

            items.append(newitem)
        

    # larger file but very human readable
    with open('data/nodes', 'w') as f:
        content = json.dumps(items, indent=4, separators=(',', ': '))
        f.write(content)
    # smaller file but less human readable
    with open('data/nodes-raw', 'w') as f:
        f.write(json.dumps(items))

    print('----- The End -----')
    print(f'Total at ST Lucia: {TOTAL}')
    print(f'Within the campus border: {IN_CAMPUS}')
    print(f'Within a building: {IN_BUILDING}')


if __name__ == '__main__':
    main()
