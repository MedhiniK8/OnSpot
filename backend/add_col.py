import asyncio
import sys
from sqlalchemy import text
from database.db import engine

async def add_column():
    print("Running ALTER TABLE...")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS training_metadata JSONB DEFAULT '{}'::jsonb;"))
        print("Column added successfully!")
    except Exception as e:
        print(f"Error adding column: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_column())
