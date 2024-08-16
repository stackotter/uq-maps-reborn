import requests
from shapely.geometry import Point

from uq import *
from util import *
from result import Result


def GET(target: str, ok: list[int] = [200], json: bool = True) -> Result:
    response = requests.get(target)
    if response.status_code in ok:
        value = response.json() if json else response.text
        return Result.Succeed(value=value)
    return Result.Fail(f'{target} returned {response.status_code}')

                       
def GetParking(campusId: int) -> Result:
    result = GET(Endpoints.GetParking(campusId))    
    return result

def GetComputers(campusId: int) -> Result:
    result = GET(Endpoints.GetComputers(campusId))    
    return result

def GetSafePaths(campusId: int) -> Result:
    result = GET(Endpoints.GetSafePaths(campusId))    
    if not result.success:
        return result
    paths = []

    for path in result.value['data']['features']:
        path = path['geometry']['coordinates']
        path = [Point(x[0], x[1]) for x in path]
        paths.append(path)
    result.value = paths
    return result

def GetAccessiblePaths(campusId: int) -> Result:
    result = GET(Endpoints.GetAccessiblePaths(campusId))    
    if not result.success:
        return result
    paths = []

    for path in result.value['data']['features']:
        path = path['geometry']['coordinates']
        path = [Point(x[0], x[1]) for x in path]
        paths.append(path)
    result.value = paths
    return result

def GetIcon(iconId: int) -> Result:
    result = GET(Endpoints.GetIcon(iconId))    
    return result

def GetCampuses() -> Result:
    result = GET(Endpoints.GetCampuses())
    if not result.success:
        return result

    campuses = []
    for x in result.value['campuses']:
        point = x['center']['coordinates']
        campus = Campus(x['name'],
                        x['campusId'],
                        ToPoint(point),
                        ToBorder(x['geometry']['coordinates'][0]))
        campuses.append(campus)
    result.value = campuses
    return result

def GetBuildings(campusId: int) -> Result:
    result = GET(Endpoints.GetBuildings(campusId))
    if not result.success:
        return result
    
    buildings = []
    for x in result.value['buildings']:
        # NOTE: for the outline there are three goddamn fields what
        #       'SimpleGeom', 'fullOutline', and 'visibleOutline'
        building = Building(FromBuildingName(x['name']),
                            x['id'],
                            {floor['z']: floor['id'] for floor in x['floors']},
                            ToBorder(x['simpleGeom']['coordinates'][0]))
        buildings.append(building)
    result.value = buildings
    return result


def GetTypes() -> Result:
    result = GET(Endpoints.GetTypes())
    return result

def GetTypeMembers(typeCode: str) -> str:
    result = GET(Endpoints.GetTypeMembers(typeCode))
    return result


if __name__ == '__main__':
    x = GetBuildings(406)
    print(x)
    input()
    print(x.value)
