# Picks random shopper names, like "Marcus Webb" instead of "synthetic-35".

FIRST_NAMES = [
    "Marcus", "Priya", "Diego", "Hannah", "Jamal", "Elena", "Noah", "Aisha",
    "Lucas", "Freya", "Omar", "Grace", "Kenji", "Isabella", "Ethan", "Maya",
    "Tobias", "Ruth", "Andres", "Nadia", "Caleb", "Sofia", "Malik", "Chloe",
    "Felix", "Amara", "Owen", "Yuki", "Gabriel", "Willow",
]  # fmt: skip

LAST_NAMES = [
    "Webb", "Sharma", "Torres", "Kim", "Diallo", "Novak", "Reyes", "Bennett",
    "Okafor", "Larsen", "Fischer", "Holt", "Nakamura", "Duarte", "Whitfield",
    "Rossi", "Beckett", "Osei", "Mercer", "Kowalski", "Abara", "Lindqvist",
    "Castillo", "Hargrove", "Petrov", "Ibrahim", "Sinclair", "Delgado", "Vance", "Moreau",
]  # fmt: skip


class NameGenerator:
    def generate(self, rng):
        first = rng.choice(FIRST_NAMES)
        last = rng.choice(LAST_NAMES)
        return f"{first} {last}"
