def serialize_sets(obj):
    if isinstance(obj, set):
        return list(obj)

    return obj