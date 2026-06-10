# Agricultural Inspector Role Restructure & Kerala Assignment Model

Restructure the Agricultural Inspector role to restrict public registration, allow Admin-managed inspector creation with first-login password changes, replace PIN-code-based matching with a Kerala administrative hierarchy, and implement inspector-specific MetaMask connection flows.

## User Review Required

> [!IMPORTANT]
> - **No Public Inspector Signups**: The registration dropdown role options will be modified to remove the `INSPECTOR` option, preventing anyone from signing up as an Inspector publicly.
> - **Database Re-seeding**: Since we are adding new database columns (`sub_district`, `village`, `coverage_level`, `must_change_password`, and `evidence_docs`) to the SQLite schema, we will need to re-seed the local database. Running `python Backend/seed.py --reset` will safely clear the SQLite DB and rebuild it with Kerala-based seed data.
> - **Wallet Ownership**: Admins will never generate or handle keys/seed phrases for Inspectors. Wallet linkage is done client-side by the Inspector during their first login.

## Proposed Changes

---

### Backend Components

#### [MODIFY] [models.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/models.py)
* Add `sub_district`, `coverage_level`, and `must_change_password` fields to the `User` model.
* Add `sub_district`, `village`, and `evidence_docs` fields to the `Farmer` model.
* Update the serialization helpers (`to_dict`) for both models to include the new fields.

#### [MODIFY] [seed.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/seed.py)
* Update seeded inspector accounts to reflect the new location hierarchy (District, Sub-District, Coverage Level) and default `must_change_password=False` for standard testing.
* Update seeded farmers to include Kerala district/sub-district/village hierarchies.

#### [MODIFY] [auth.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/auth.py)
* Remove `INSPECTOR` from the allowed roles in the public `/register` endpoint.
* Implement a new authenticated `/change-password` endpoint that allows users with `must_change_password` flags to update their password.

#### [MODIFY] [admin.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/admin.py)
* Create `/create-inspector` endpoint allowing Admins to create Inspector accounts (generates a temporary password, sets location values, and sets `must_change_password=True`).
* Auto-notify the inspector via the async email utility when the admin creates their account.

#### [MODIFY] [farmer.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/farmer.py)
* Update crop registration endpoints to receive District, Sub-District, Village, Farm Address, Evidence Photos, and Evidence Documents.
* Implement the Kerala-based **Inspector Assignment Logic**:
  * **Priority 1**: Find inspectors covering the same Sub-District (`sub_district`).
  * **Priority 2**: Find inspectors in the same District (`district`).
  * **Priority 3**: Calculate the geodesic distance from the crop coordinates (or district center fallback) to all district-level inspectors, assigning the nearest one.

#### [MODIFY] [quality.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/quality.py)
* Implement `/save-notes/<int:crop_id>` endpoint to allow Inspectors to upload and save notes to the database without requiring MetaMask or doing blockchain transactions.

---

### Frontend Components

#### [MODIFY] [AuthContext.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/context/AuthContext.jsx)
* Add `changePassword` method calling `/api/auth/change-password` to update the password and refresh the active user state.

#### [MODIFY] [RegisterPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/RegisterPage.jsx)
* Remove `Agricultural Inspector` option from the registration roles dropdown.

#### [MODIFY] [AdminDashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/AdminDashboard.jsx)
* Add a tab/form to create Inspectors, showing Name, Official Email, District, Sub-District (Taluk), Coverage Level (`SUB_DISTRICT` or `DISTRICT`), and Contact Number. Display the generated temporary password upon creation.

#### [MODIFY] [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx)
* Restructure the registration form inputs: replace PIN code matching with Taluk (Sub-District) and Village inputs.
* Add an "Evidence Documents" upload field supporting document uploads (mocked/stored as URLs).

#### [MODIFY] [Dashboard.jsx](file:///c:/MY%2520PROJECTS/AgroChain-Morden/Frontend/src/pages/Dashboard.jsx)
* Implement a fullscreen/prominent **First Login Change Password Modal** that blocks dashboard interactions if `user.must_change_password` is `true`.
* Implement a **MetaMask Wallet Connection Card** for Inspectors. If the inspector has no linked wallet, show "Wallet Status: Not Connected" and a "Connect MetaMask" button. Once linked, store the address in the database and display "Wallet Status: Connected".

#### [MODIFY] [QualityTesting.jsx](file:///c:/MY%2520PROJECTS/AgroChain-Morden/Frontend/src/pages/QualityTesting.jsx)
* Display District, Taluk, Village, and Evidence Documents in the inspection details panel.
* Implement a "Save Inspection Notes" button that uploads remarks without MetaMask.
* In "Approve Crop", verify MetaMask connection; if not connected, set error to `"Please connect MetaMask to continue."` instead of auto-opening wallet.

---

## Verification Plan

### Automated Tests
* Re-seed the database: `python Backend/seed.py --reset`
* Launch Flask: `python app.py` (inside `Backend`)
* Launch Frontend: `npm run dev` (inside `Frontend`)

### Manual Verification
1. Verify signup page has no `INSPECTOR` role option. Try manually calling the register API with `role: "INSPECTOR"` and verify it returns a `400 Invalid role` error.
2. Log in as Admin, create a new Inspector account with a custom district/sub-district, copy the generated temporary password, and verify the email was sent/logged.
3. Log in as the new Inspector, verify the Change Password form is shown, change the password, and verify you are redirected to the dashboard.
4. Verify the Inspector Dashboard prompts to connect MetaMask. Click "Connect MetaMask" and verify that the wallet address is linked and saved to the database.
5. Log in as a Farmer, register a crop under Kerala coordinates/hierarchy, upload photos & documents, and verify the correct Inspector is assigned based on the Priority 1/2/3 logic.
6. Log in as the Inspector, open the assigned crop lot, verify you can view details and save notes without MetaMask. Connect MetaMask and verify you can approve/reject crop registrations using MetaMask signatures.
