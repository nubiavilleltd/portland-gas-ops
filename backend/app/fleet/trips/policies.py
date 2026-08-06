from app.authorization import policies as auth

def can_manage_trips(user):
    return auth.is_admin(user)


def is_trip_owner(user, trip):
    return trip.created_by == user.id