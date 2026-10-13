# Layer strain-standard source audit — status as of 2026-10-13

This register distinguishes the existence of an official guide from the verification of every numeric point in the application. A guide being official does not prove that a stored point or an interpolated value was transcribed correctly.

| Strain profile | Source / housing | Active comparison status | Required follow-up |
|---|---|---|---|
| Hy-Line W-36 | Official Hy-Line management guide, January 2020 | No active numeric curve; operational fallback only | Extract the exact current W-36 table and version before enabling a curve |
| Hy-Line W-80 | Official April 2026 Performance Standards Guide, conventional/cage | Selected official min/max ranges active for rearing/laying ages; values between anchors are interpolated | Expand selected ages to every published week and add quality/Haugh/egg-size ranges |
| Hy-Line W-80 Plus | Official April 2026 Performance Standards Guide, conventional/cage | Selected official min/max ranges active; values between anchors are interpolated | Expand selected ages to every published week and add quality/Haugh/egg-size ranges |
| Hy-Line W-80 Pro | Official April 2026 Performance Standards Guide, conventional/cage | No active numeric curve | Extract and validate exact W-80 Pro tables; do not reuse W-80/W-80 Plus values |
| Hy-Line Brown | Official Hy-Line guide available | No active numeric curve | Extract and validate the exact guide tables before enabling comparisons |
| ISA Brown | Official ISA Brown EU CS cage guide | Selected published weekly point anchors active; cage-only; interpolation explicitly identified | Add separate alternative-housing anchors from the official alternative guide; expand anchors to all published weeks |
| LOHMANN BROWN-CLASSIC | Official cage performance-data guide | Legacy selected points marked provisional pending row-level verification | Verify each stored age/value and confirm whether the source provides a point or a range |
| LOHMANN BROWN-LITE | Official alternative-housing performance-data guide | Legacy selected points marked provisional pending row-level verification | Verify each stored age/value and housing-system mapping |
| LOHMANN LSL-CLASSIC | Official cage performance-data guide | Legacy selected points marked provisional pending row-level verification | Verify each stored age/value and point/range semantics |
| LOHMANN LSL-LITE | Official breeder strain page | Legacy selected points marked provisional pending row-level verification | Replace summary-page assumptions with exact versioned performance tables |
| NOVOgen BROWN | Official NOVOgen management guide | Legacy selected points marked provisional pending row-level verification | Confirm whether values are point targets or midpoints of source ranges |
| NOVOgen WHITE | Official NOVOgen management guide | Legacy selected points marked provisional pending row-level verification | Confirm whether values are point targets or midpoints of source ranges |
| H&N Super Nick | Older field-performance report (2011 source) | Numeric curve disabled; not treated as a current official standard | Obtain a current official Super Nick management/performance guide |
| H&N Nick Chick | Official alternative-housing guide | Legacy selected points marked provisional pending row-level verification; housing-specific | Verify exact values and version against the current guide |
| TETRA Brown | Third-party mirror, publisher provenance not verified | Numeric curve disabled | Obtain the official publisher's current TETRA guide before reactivating |

## Runtime safeguards
- A numeric point is labelled **verified official** only when its profile explicitly carries `sourceStatus: verified_selected_points`.
- Legacy values from an official guide but not yet rechecked row by row are labelled **provisional breeder-guide points** and produce a caution in the daily assessment.
- Official housing-specific curves are disabled when the housing system is unknown or mismatched. The current live house records use `cage` and `floor`; `floor` is not treated as cage.
- When no usable curve is available, the engine may use the local operational screening reference. It must be labelled as management screening, not as a world standard or a genetic target.
- Interpolation is an estimate between source anchors, never an original source value. Min/max ranges remain ranges; a midpoint is not substituted as a hard target.

## Verified official sources
- Hy-Line W-80 (conventional/cage, April 2026): https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80%20STD%20ENG.pdf
- Hy-Line W-80 Plus (conventional/cage, April 2026): https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80PLUS%20STD%20ENG.pdf
- Hy-Line W-80 Pro (conventional/cage, April 2026): https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80R%20STD%20ENG.pdf
- Hy-Line official variety literature index: https://www.hyline.com/literature/w-80
- ISA Brown cage guide: https://www.isa-poultry.com/documents/1399/ISA_Brown_EU_CS_product_guide_cage_EN_L6230-1.pdf
- ISA Brown alternative-housing guide: https://www.isa-poultry.com/documents/2591/ISA_Brown_EU_CS_product_guide_alternative_EN_L6230-1.pdf
- LOHMANN breeder guides: https://lohmann-breeders.com/
- NOVOgen guides: https://novocenter.novogen-layers.com/
- H&N guides: https://hn-int.com/
