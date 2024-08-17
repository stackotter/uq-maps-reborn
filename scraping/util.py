from shapely.geometry import Point

# assume input is given as lng/lat (NOT lat/lng)
def ToPoint(coord: list[float]) -> Point:
    return Point(coord[1], coord[0])

# assume input is given as lng/lat (NOT lat/lng)
def ToBorder(coords) -> list[Point]:
    return [ToPoint(x) for x in coords]


MANUAL_NAMES = {
    '85B': 'Industrial Centre',
    '40A': 'Athletics Field Shelter North',
    '53D': 'UQ Drame Pavilion',
    '56L': 'Shipping Container North of 56E',
    '56M': 'Shed to North of 56F',
    '91C': 'Cairngorm Homestead',
    '21D': 'Student Support Services Building',
    '70B': 'UQ Cricket Club Pavilion',
    '56E': 'Field Storage Shed',
    '87A': 'Building 87',
    '58': 'UQ Lakes Drivers Amenities Building',
    '92B': 'Grounds Shed Playing Field 9',
    '92A': 'Pavilion Playing Field 9'
}

# split a building name into the id and name
# MazeMap returns these in two formats
#   1. '{ID} - {NAME}'
#   2. '{ID} ({NAME})'
def FromBuildingName(title: str) -> tuple[str, str]:
    # set default cases
    number = ''
    name = title
    if title[0].isdigit():
        if ' - ' in title:
            number, name = title.split(' - ')
        elif '(' in title:
            number, name = title.split('(')
            number = number.strip()
            name = name.replace(')', '').strip()
    return number, name
            


'''
try:
    number, name = title.split(' ', 1)
except ValueError:
    # if this occurs its because the
    # title doesn't contain a name
    number = title
    name = MANUAL_NAMES.get(number)
    if name == None:
        raise ValueError('Idk this one chief')

# ignore first character (always either
# a hyphen or a '(' character)
name = name[1:].replace('-', '').strip()
if name.endswith(")"):
    name = name[:-1]
return number, name
'''
