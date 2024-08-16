from scrape import GetCampuses, GetBuildings


if __name__ == '__main__':
    campuses = GetCampuses()
    print(campuses)

    for campus in campuses.value:
        buildings = GetBuildings(campus.id)
    # if an error occurs then we messed up
