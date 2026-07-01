# Diamond Intelligence Engine (DIE)
## Version 6.0 — K Props Scrollable Panel

Diamond Intelligence Engine (DIE) is a professional MLB analytics platform designed to combine live MLB data, advanced baseball metrics, historical tracking, and prediction intelligence into one clean, responsive web experience.

The long-term goal is to make DIE a centralized prediction engine for Home Run, Strikeout, Moneyline, and Over/Under analysis, with a Tracker that learns from completed predictions and improves future projections.

---

## Version 6.0 Changes

### K Props Scrollable Panel
- Made **K Props** scroll inside its own section on mobile and tablet.
- Reduced the need to scroll through the entire Props page when reviewing all K Props.
- Added touch-friendly smooth/momentum scrolling.
- Added clean scrollbar styling for supported browsers.
- Added sticky behavior for the K Props summary area when today's record appears.

### Preserved From v5.8
- **HR Potential** and **K's Today** stay side by side on mobile.
- **HR's Today** and **HR's Completed from Projection** stay side by side on the row below.
- Mobile-safe spacing and title sizing remain intact.

---

## Previous Version 5.8 Changes

### Mobile Props Two-Column Layout
- Updated the Props tab mobile layout so **HR Potential** and **K's Today** display next to each other.
- Updated the row below so **HR's Today** and **HR's Completed from Projection** display next to each other on mobile.
- Added mobile-safe spacing, title sizing, and min-width protection to prevent layout overflow.
- Preserved the developer-side first-load fixes from v5.7.

## Diamond Intelligence Engine Vision

DIE is being built as more than a sports picks website. The platform is evolving into a self-learning baseball intelligence engine where every module contributes to one centralized prediction system.

Future engine components include:

### Prediction Engine
Generates projections for:
- Home Run potential
- Strikeout props
- Moneyline picks
- Over/Under game totals

### Learning Engine
Uses the Tracker to measure:
- Daily accuracy
- All-time accuracy
- Team trends
- Pitcher tendencies
- Player prediction results
- Model strengths and weaknesses

### Confidence Engine
Every prediction should eventually include:
- Confidence score
- Risk level
- Data agreement percentage
- Explanation of the strongest factors

### Situational Intelligence
Planned factors include:
- Weather
- Ballpark factors
- Umpire tendencies
- Bullpen fatigue
- Lineup changes
- Rest days
- Travel schedules
- Pitch mix
- Exit velocity
- Barrel rate
- Hard-hit percentage
- Expected statistics
- Platoon advantages

---

## Planned Data Sources

- Baseball Savant
- FanGraphs
- Baseball Reference
- StatMuse
- Brooks Baseball
- Baseball Prospectus
- MLB Stats API
- Weather APIs
- Sportsbook odds APIs
- Injury reports
- Umpire data
- Market movement data

---

## Development Standards

Every future release should include:
- Incremented version number
- Updated README.md
- Updated changelog when applicable
- ZIP package output
- Mobile-first testing
- Tablet and desktop review
- Performance-conscious changes
- Preservation of existing working features unless intentionally changed

---

## Current Version

**Version:** 5.8  
**Status:** Active Development  
**Latest Update:** Mobile Props layout update: HR Potential and K's Today now sit side by side, with HR's Today and HR's Completed from Projection side by side below.

© 2026 Diamond Intelligence Engine (DIE)


## Version 6.0 — Mobile Layout Optimization

### Changes
- Restored **HR Potential** to full width on mobile so player cards remain readable.
- Moved **K's Today** below HR Potential as its own full-width internally scrollable panel.
- Kept **HR's Today** and **HR's Completed from Projection** side by side on the row below.
- Reduced mobile spacing for a cleaner developer layout.
- Preserved previous first-load fixes for HR Potential, Pitcher Report, and K's Today.
- Preserved v5.9 K Props internal scrolling improvements.

### Deployment Note
This is a developer/test build. Test on mobile before promoting to the live DIE Foundation site.
