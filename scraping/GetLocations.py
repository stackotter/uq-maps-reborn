import json

from scrape import *

path = 'https://uqmaps.app.uq.edu.au/json/location/'

MIN = 4500
MAX = 10000
if __name__ == '__main__':
    for i in range(MIN, MAX):
        result = GET(f'{path}{i}')
        if i%500 == 0: print(f'mile: {i}')
        if not result.success:
            continue
        print(f'SUCCEEDED {i}')
        with open(f'locations/{i}', 'w') as f:
            f.write(json.dumps(result.value))
