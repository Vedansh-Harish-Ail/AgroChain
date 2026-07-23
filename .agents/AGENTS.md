# Project Rules for AgroChain

## Database Protection Rule
- ⚠️ **CRITICAL: NEVER reset or drop the SQLite database (`Backend/agrochain.db` or `Backend/instance/agrochain.db`)**.
- ⚠️ **NEVER run `py seed.py --reset`** or any command that deletes user data or re-initializes tables.
- Always preserve the existing users, crops, and investments, as these represent the developer's original records and login credentials (including `vedaks126145@gmail.com`).
