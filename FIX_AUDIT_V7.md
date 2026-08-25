# Fix audit V7

Based on the real schema supplied during debugging.

- `profiles` is treated as account-only: no `user_type` or `activity_types` columns are assumed.
- Professional identity is read from `professional_profiles`.
- Canonical user types used by the real constraint: veterinarian, technical_veterinarian, farm_operator, farm_manager, diagnostic_lab, poultry_technical_expert, company_manager, other.
- Legacy UI aliases are normalized before saving: poultry_operator -> farm_operator; poultry_manager -> farm_manager; veterinary_lab -> diagnostic_lab; organization_manager -> company_manager.
- Owner save writes `activity_types` as JSONB.
- Login/professional routing uses the canonical types.
- Professional panel SQL no longer references nonexistent `profiles.user_type`/`profiles.activity_types`.
- Farm/flock pages retain session and show access errors instead of intentionally signing the user out unless the account is actually inactive/blocked.
