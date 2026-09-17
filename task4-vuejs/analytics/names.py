"""Real-sounding shopper names, so a synthetic shopper is "Marcus Webb",
not just "tech-enthusiast" or "synthetic-35". The persona and city still
drive the actual buying behaviour - a name is cosmetic, attached once per
shopper the same way a location is.
"""


class NameGenerator:
    FIRST_NAMES = (
        "Marcus", "Priya", "Diego", "Hannah", "Jamal", "Elena", "Noah", "Aisha",
        "Lucas", "Freya", "Omar", "Grace", "Kenji", "Isabella", "Ethan", "Maya",
        "Tobias", "Ruth", "Andres", "Nadia", "Caleb", "Sofia", "Malik", "Chloe",
        "Felix", "Amara", "Owen", "Yuki", "Gabriel", "Willow",
    )  # fmt: skip

    LAST_NAMES = (
        "Webb", "Sharma", "Torres", "Kim", "Diallo", "Novak", "Reyes", "Bennett",
        "Okafor", "Larsen", "Fischer", "Holt", "Nakamura", "Duarte", "Whitfield",
        "Rossi", "Beckett", "Osei", "Mercer", "Kowalski", "Abara", "Lindqvist",
        "Castillo", "Hargrove", "Petrov", "Ibrahim", "Sinclair", "Delgado", "Vance", "Moreau",
    )  # fmt: skip

    def generate(self, rng) -> str:
        return f"{rng.choice(self.FIRST_NAMES)} {rng.choice(self.LAST_NAMES)}"
