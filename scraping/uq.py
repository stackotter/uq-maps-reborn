import numpy as np
from shapely.geometry import Point
from shapely.geometry.polygon import Polygon


class Endpoints:
    def GetParking(campusId: int) -> str:
        return f'https://maps.uq.edu.au/api_v1/parking?campusId={campusId}'

    def GetComputers(campusId: int) -> str:
        return f'https://maps.uq.edu.au/api_v1/computer?campusId={campusId}'

    def GetSafePaths(campusId: int) -> str:
        return f'https://maps.uq.edu.au/api_v1/feature/safepath?campusId={campusId}'

    def GetAccessiblePaths(campusId: int) -> str:
        return f'https://maps.uq.edu.au/api_v1/feature/accessiblepath?campusId={campusId}'

    def GetIcon(iconId: int) -> str:
        return f'https://maps.uq.edu.au/static/media/{iconId}'

    def GetCampuses() -> str:
        return 'https://api.mazemap.com/api/campuscollection/uq/?withcampuses=true'

    def GetBuildings(campusId: int) -> str:
        # srid=4326 means lat/lng
        return f'https://staging-api.mazemap.com/api/buildings/?campusid={campusId}&srid=4326'

    def GetTypes() -> str:
        return 'https://uqmaps.app.uq.edu.au/json/type/collection/0'

    def GetTypeMembers(typeCode: str) -> str:
        return f'https://uqmaps.app.uq.edu.au/json/type/collection/0/{typeCode}'

'''
class Point:
    def __init__(self, lat: float, lng: float):
        self.lat = lat
        self.lng = lng
'''


'''
class Area:
    def __init__(self, name: str, ID: int,
                 centerpoint: Point,
                 borderpoints: list[Point]) -> None:
        self.name = name
        self.id = ID
        
        self.centerpoint = centerpoint
        self.borderpoints = borderpoints
    
class Campus(Area):
    def __init__(self, name: str, ID: int,
                 centerpoint: Point,
                 borderpoints: list[Point]) -> None:
        super().__init__(name, ID, centerpoint, borderpoints)


class Building(Area):
    def __init__(self, name, ID: int,
                 floors: dict[int, int],
                 centerpoint: Point,
                 borderpoints: list[Point]) -> None:
        super().__init__(name, ID, centerpoint, borderpoints)
        self.floors = floors
'''


class Area:
    def __init__(self, borderpoints: list[Point]) -> None:
        self.borderpoints = borderpoints
        array = np.array([[p.x, p.y] for p in self.borderpoints])
        self.polygon = Polygon(array)

    def Contains(self, point: Point) -> bool:
        return self.polygon.contains(point)

class Campus(Area):
    def __init__(self, name: str, ID: int,
                 centerpoint: Point,
                 borderpoints: list[Point]) -> None:
        super().__init__(borderpoints)
        self.name = name
        self.id = ID
        self.centerpoint = centerpoint
    

class Building(Area):
    def __init__(self, name, ID: int,
                 floors: dict[int, int],
                 borderpoints: list[Point]) -> None:
        super().__init__(borderpoints)
        self.name = name
        self.id = ID
        # `self.floors` is a mapping between floor number
        # and the unique identifier of the floor
        self.floors = floors,
        self.borderpoints = borderpoints
