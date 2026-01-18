import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import SessionLocal, engine, Base
from app.models.models import JobRole

ROLES = [
    # Tech
    ("Software Engineer", "Tech", 100),
    ("Frontend Developer", "Tech", 95),
    ("Backend Developer", "Tech", 95),
    ("Full Stack Developer", "Tech", 98),
    ("Data Scientist", "Tech", 90),
    ("DevOps Engineer", "Tech", 85),
    ("Product Manager", "Management", 88),
    ("UI/UX Designer", "Design", 85),
    ("Mobile App Developer", "Tech", 80),
    ("Cloud Architect", "Tech", 75),
    ("Cybersecurity Analyst", "Tech", 70),
    ("QA Automation Engineer", "Tech", 65),

    # Business & Finance
    ("Accountant", "Finance", 80),
    ("Financial Analyst", "Finance", 85),
    ("Business Analyst", "Business", 90),
    ("Marketing Manager", "Marketing", 88),
    ("Sales Representative", "Sales", 85),
    ("HR Manager", "HR", 80),
    ("Project Manager", "Management", 92),
    ("Operations Manager", "Management", 85),

    # Healthcare
    ("Registered Nurse", "Healthcare", 95),
    ("Physician", "Healthcare", 85),
    ("Pharmacist", "Healthcare", 80),
    ("Physical Therapist", "Healthcare", 75),

    # Creative
    ("Graphic Designer", "Creative", 85),
    ("Content Writer", "Creative", 80),
    ("Art Director", "Creative", 70),
    ("Video Editor", "Creative", 75),
]

# Expand to 500+ using common patterns
DEPARTMENTS = ["Junior", "Senior", "Lead", "Principal", "Associate"]
expanded_roles = []
for role, cat, pop in ROLES:
    expanded_roles.append((role, cat, pop))
    for dept in DEPARTMENTS:
        expanded_roles.append((f"{dept} {role}", cat, max(0, pop - 10)))


async def seed():
    async with SessionLocal() as session:
        for name, category, popularity in expanded_roles:
            role = JobRole(name=name, category=category, popularity=popularity)
            session.add(role)
        await session.commit()
    print(f"Seeded {len(expanded_roles)} job roles.")

if __name__ == "__main__":
    asyncio.run(seed())
