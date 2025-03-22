# Fantasy Idle Adventure - README

This is a simple, web-based idle/clicker game with a fantasy theme.

## Project Structure

*   **`index.html`:**  Contains the HTML structure of the game.
*   **`style.css`:**  Contains the CSS styles for the game.
*   **`script.js`:** Contains the JavaScript code for the game logic.

## Development Roadmap

Here's a prioritized list of features and improvements for the game, broken down into phases:

**Phase 1: Essential Gameplay and Enhanced Features (Current Focus - Frontend MVP)**

**I. Essential Gameplay Improvements (High Priority):**

*   [x] **Bug Fix:** Passive gold increment was every 100ms instead of 1000ms.
*   [x] **Welcome/Tutorial:** Add a brief welcome message for new players.
*   [ ] **Offline Progression (Client-Side, localStorage):** Calculate and apply gold earned while the game was closed (using localStorage for now, may be revisited for server-side persistence).
*   [ ] **Balance and Progression Curve:**  Adjust upgrade costs and income rates for a smooth gameplay experience.

**II. Enhanced Features and Content (Medium Priority):**

*   [ ] **More Upgrades:** Add more variety to the upgrade system.
*   [ ] **Achievements:** Implement an achievement system.
*   [ ] **Prestige Mechanic:**  Add a "prestige" system for long-term replayability.

**Phase 2: Backend Integration and User Accounts (Future Focus - Medium/High Priority Later)**

**III. Backend and Account Features (Medium/High Priority - Future Phase):**

*   [ ] **Login Mechanism and Database Integration:** Implement user accounts and store game data in a database for persistence, cross-device play, and scalability.

**IV. Long-Term Additions (Lower Priority):**

*   [ ] **Prestige Mechanic:**  Add a "prestige" system for long-term replayability.
*   [ ] **Sound Effects:** Add sound effects for clicks and upgrades.
*   [ ] **Improved Visuals and Animations:** Enhance the visual presentation.
*   [ ] **Game Events and Challenges:** Add random events or challenges.
*   [ ] **Multiple Resource Types:** Introduce additional resources.
*   [ ] **Dark Mode:** Add a dark mode option.
*   [ ] **Responsive Design:** Make the game responsive for mobile devices.

**Completed Tasks:**
* Split code into `index.html`, `style.css`, and `script.js`
* Corrected passive gold increment bug.
* Implemented a welcome message/tutorial.
* Implemented Prestige Mechanic UI elements (button, points display, bonus display).