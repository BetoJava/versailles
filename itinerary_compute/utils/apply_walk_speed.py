def apply_walk_speed(speed: float, dist_df_walk: pd.DataFrame):

    coefficient = min(0.2, speed / 100)
    dist_df_walk["travel_time"] = dist_df_walk["travel_time"] * speed