# Fantasy Idle Adventure - Project Notes

This document provides a detailed overview of the "Fantasy Idle Adventure" web-based idle/clicker game project. It's intended for developers (human or AI) who are taking over or collaborating on the project.

## 1. Project Overview

This project is a minimal viable product (MVP) of a fantasy-themed idle/clicker game built using HTML, CSS, and JavaScript.  The core game loop is implemented, including:

*   **Resource Accumulation:**  Players earn gold through clicking and passive income.
*   **Jobs:** Players can hire "jobs" (Miners, Soldiers, Wizards) that generate resources passively or enhance click income.
*   **Upgrades:**  Players can purchase upgrades that improve the efficiency of their jobs.
*   **Persistence:** Game state is currently saved to `localStorage`.  **Future versions will implement server-side persistence with a database.**
*   **Developer Tools:** A hidden developer overlay (activated by Ctrl+Shift) provides tools for testing and debugging.
*   **Tabbed Interface:** The UI is organized into tabs for "Jobs" and "Upgrades".
*   **Bulk Buy:** The ability to buy jobs and upgrades using x1, x10 and max.
*   **Prestige System:** Players can reset their progress to earn permanent bonuses when they reach enough lifetime gold.
*   **Mobile-First Design:** The game features a responsive, touch-friendly interface optimized for all devices with special focus on mobile experience.
*   **Sound Effects:** The game includes sound effects for clicks, purchases, and interactions, enhancing the player experience. Sounds can be toggled on/off.

## 2. Technology Stack

*   **HTML:**  Provides the structure of the game's user interface.
*   **CSS:**  Styles the game's appearance, creating a fantasy theme with mobile-first responsive design.
*   **JavaScript:**  Implements the game logic, event handling, data management, and mobile-specific optimizations.
*   **localStorage:**  Used for client-side data persistence **(temporary for MVP - will be replaced by database in future phases)**.
*   **Future Technologies (Phase 2):**
    *   **Backend Framework/Language:** (e.g., Node.js, Python, etc.)
    *   **Database:** (e.g., PostgreSQL, MySQL, MongoDB)

## 3. File Structure

The project consists of the following files:

*   **`index.html`:**  The main HTML file containing the game's UI structure.  It links to `style.css` and `script.js`.
*   **`style.css`:**  The CSS file containing all the styles for the game, with a mobile-first responsive design.
*   **`script.js`:** The JavaScript file containing the core game logic and balance data.
*   **`README.md`:**  A general project overview (less detailed than this file).
*   **`PROJECT_NOTES.md`:** This File.

## 4. Code Structure (`script.js`)

The `script.js` file is organized into the following sections:

1.  **README (JSDoc Comment):**  A detailed comment at the top of the file explaining the purpose, functionality, changelog, and TODOs.  *Always keep this updated.*
2.  **Game State Variables:**  The `gameState` object stores all the player's progress and game settings (gold, jobs, upgrades, etc.).  This is the *single source of truth* for the game's state.
3.  **Balance Data Constant:** The `BALANCE_DATA` constant stores game balance parameters directly in the code.
4.  **DOM Element References:**  Variables that store references to HTML elements (e.g., `goldCountEl`, `clickButton`). This avoids repeated calls to `document.getElementById()`.
5.  **Helper Functions:**
    *   `loadGame()`: Loads the game state from `localStorage`.
    *   `saveGame()`: Saves the game state to `localStorage`.
    *   `showAutosaveNotification()`: Displays a brief "Game saved!" notification.
    *   `formatNumber(number)`: Formats numbers for display (handles K/M/B/T suffixes and scientific notation).
    *   `updateUI()`: Updates *all* UI elements to reflect the current `gameState`.  This is called after *any* change to the game state.
    *   `createGoldParticle(event)`: Creates the floating gold particle animation on clicks.
    *   `calculateNextCost(type, owned)`: Calculates the cost of the next job/upgrade.
    *   `calculateBulkCost(type, baseCost, increaseRate, exponent, owned, quantity)`: Calculates the cost to buy in bulk.
    *   `buyJob(jobType, quantity)`: Handles purchasing jobs.
    *   `buyUpgrade(upgradeId, quantity)`: Handles purchasing upgrades.
    *   `toggleDevOverlay()`: Shows/hides the developer overlay.
    *   `openTab(tabName)`: Handles switching between tabs.
    *   `calculatePrestigePoints()`: Calculates prestige points based on lifetime gold.
    *   `prestigeGame()`: Handles the prestige action, resetting progress and awarding permanent bonuses.
    *   `saveGame()`: Enhanced to save game state to both localStorage and sessionStorage as a backup, with error handling.
    *   `loadGame()`: Improved to include fallback to sessionStorage backup, data validation, and timestamp logging.
    *   `isMobileDevice()`: Detects if the user is on a mobile device.
    *   `applyMobileSpecificBehavior()`: Applies mobile-specific enhancements.
    *   `loadSound(soundPath)`: Loads and caches sound files for better performance.
    *   `playSound(soundKey)`: Plays a sound effect by its key.
    *   `toggleSound()`: Toggles sound effects on/off.
    *   `loadSoundPreference()`: Loads sound preference from localStorage.
    *   `addSoundToggleToDevOverlay()`: Adds a sound toggle checkbox to the developer overlay.
    *   `addSoundToStatItems()`: Attaches sound event listeners to stat items.
6.  **Event Listeners:**
    *   Click event listener for the main click button.
    *   Event listeners for job and upgrade purchase buttons (including quantity buttons).
    *   Event listeners for the developer overlay (Ctrl+Shift toggle, reset button, "Set Values" button, number format toggle).
    *   Event listeners for tab switching.
    *   Event listener for the prestige button.
    *   `setInterval` for idle income.
    *   `setInterval` for autosaving.
    *   `beforeunload` event listener to save the game when the page is closed.
    *   Touch event listeners for mobile devices.
    *   **Persistence Strategy:** Initially using `localStorage` for simplicity in the MVP phase.  **The project is planned to move to server-side persistence with a database and user accounts in a future development phase (Phase 2).** This will enable more robust data management, user accounts, and potential cross-device play.

7.  **`initGame()` Function:**
    *   Sets `balanceData` to `BALANCE_DATA` constant.
    *   Initializes `gameState` with default values and values from `balanceData`.
    *   Calls `loadGame()` to load any saved game data.
    *   Sets the initial active tab.
    *   Calls `updateUI()` to render the initial game state.
    *   Applies mobile-specific behavior enhancements.
    *   Displays the welcome message (if it's the player's first visit).
8.  **Calling `initGame()`:** The `initGame()` function is called to start the game.

## 5. Data Structures

### 5.1. `gameState` (Object)

This is the most important data structure. It holds all the player's progress.

```javascript
let gameState = {
    gold: 0,                 // Current gold amount (number)
    goldPerClick: 1,         // Gold earned per click (number)
    goldPerSec: 0,           // Gold earned passively per second (number)
    minerJobs: 0,           // Number of miners owned (integer)
    minerJobCost: 10,       // Cost of the next miner (integer)
    minerJobGPS: 1,         // Gold per second *per miner* (number)
    soldierJobs: 0,         // Number of soldiers owned (integer)
    soldierJobCost: 50,     // Cost of the next soldier (integer)
    soldierJobGPS: 5,        // Gold per second *per soldier* (number)
    wizardJobs: 0,          // Number of wizards owned (integer)
    wizardJobCost: 100,      // Cost of the next wizard (integer)
    wizardJobGPC: 2,        // Gold per click *per wizard* (number)
    upgrades: {             // Object containing upgrade information
        "miner-sharp-pickaxe": { level: 0, cost: 50 }, // Example upgrade
        "soldier-stronger-swords": { level: 0, cost: 150 },
        "wizard-better-focus": { level: 0, cost: 250 },
    },
    useScientificNotation: false, // Whether to use scientific notation (boolean)
    prestigePoints: 0,          // Total prestige points earned
    prestigeBonusMultiplier: 1, // Multiplier to gold gain from prestige
    lifetimeGold: 0,            // Total gold earned in current prestige cycle
};
```

### 5.2. `BALANCE_DATA` (Constant Object)

This constant holds the balance parameters directly in the code. It has the following structure:

```json
{
  "general": {
    "clicksPerMinute": 60,  // Assumed clicks per minute for calculations
    "baseGoldPerClick": 1   // Base gold per click (before upgrades)
  },
  "jobs": {
    "miners": {
      "baseCost": 10,
      "costIncreaseRate": 0.15,
      "costExponent": 0.9,
      "goldPerSecond": 1
    },
    "soldiers": {
      "baseCost": 50,
      "costIncreaseRate": 0.17,
      "costExponent": 0.95,
      "goldPerSecond": 5
    },
    "wizards": {
      "baseCost": 100,
      "costIncreaseRate": 0.2,
      "costExponent": 1.05,
      "goldPerClick": 2
    }
  },
  "upgrades": {
    "miner-sharp-pickaxe": {
      "baseCost": 50,
      "costIncreaseRate": 0.25,
      "costExponent": 1.1,
      "effectMultiplier": 0.1,
      "job": "miners"
    },
    "soldier-stronger-swords": {
      "baseCost": 150,
      "costIncreaseRate": 0.28,
      "costExponent": 1.15,
      "effectMultiplier": 0.1,
      "job": "soldiers"
    },
    "wizard-better-focus":{
      "baseCost": 250,
      "costIncreaseRate": 0.3,
      "costExponent": 1.2,
      "effectMultiplier": 0.1,
      "job": "wizards"
    }
  },
  "prestige": {
    "unlockThreshold": 1000000,
    "pointsFormulaDivisor": 1000000,
    "bonusMultiplierPerPoint": 0.02
  }
}
```

## 6. Design Choices and Rationale

*   **Tabbed Interface:**  Using tabs ("Jobs" and "Upgrades") provides a cleaner UI and better organization than having all elements visible at once.
*   **Bulk Buying:**  The x1, x10, and Max buttons are essential for quality of life, especially as the game progresses and numbers get larger.
*   **`BALANCE_DATA` Constant:**  Moved balance parameters into a constant in the JavaScript code for easier development and testing. This eliminates network requests during development.
*   **`gameState` as Single Source of Truth:**  All game state is stored in the `gameState` object.  This makes it easy to save, load, and reason about the game's state.
*   **`updateUI()` Function:**  This centralized function ensures that the UI is *always* consistent with the `gameState`.  Any change to the game state should be followed by a call to `updateUI()`.
*   **Developer Overlay:** The developer overlay (Ctrl+Shift) provides convenient tools for testing and debugging:
    *   **Reset Button:** Quickly resets the game to its initial state.
    *   **Number Format Toggle:** Switches between standard and scientific notation, which is useful for understanding very large numbers.
    *   **Value Setting:** Allows direct manipulation of gold, job counts, and upgrade levels, making it easy to test different game states.
    *   **Close Button:** Added for easier use on mobile devices where keyboard shortcuts are less accessible.
* **Number Formatting:** The `formatNumber()` function handles both standard formatting (with K/M/B/T suffixes) and scientific notation, providing flexibility for displaying large numbers. It also intelligently handles decimal places, showing them only when necessary.
* **Cost Calculation Formula:** The `calculateNextCost()` and `calculateBulkCost()` functions use a formula that allows for a more controlled cost increase than a simple exponential curve.  This helps prevent runaway inflation and keeps upgrades achievable. The formula is: `nextCost = baseCost * (1 + costIncreaseRate * Math.pow(owned, costExponent))`.
* **Event Driven:** The code uses an event based approach to handle changes in the state.
* **Prestige Button Progress:** The prestige button shows current progress toward the prestige threshold, helping players understand how close they are to being able to prestige.
* **Mobile-First Design:**
  * **Responsive Layout:** The game adapts to different screen sizes with a focus on mobile devices, using CSS media queries to progressively enhance the experience on larger screens.
  * **Touch-Optimized UI:** All interactive elements are sized and spaced appropriately for touch, with a minimum tap target size of 48x48px.
  * **Bottom Navigation:** On mobile devices, the tab navigation is positioned at the bottom of the screen for easier thumb access.
  * **Enhanced Gold Button:** The main click button is larger on mobile for easier tapping.
  * **Dark Mode Support:** The game automatically adapts to system dark mode preferences using the `prefers-color-scheme` media query.
  * **Input Prevention:** Double-tap zooming is prevented on the gold button to improve the gameplay experience.
* **Enhanced Data Persistence:** The game now saves data more frequently (every 10 seconds) and uses multiple approaches to prevent data loss:
  * Primary storage in localStorage
  * Backup storage in sessionStorage
  * Saves on visibility change (tab switching)
  * Saves after important game actions (purchases, prestige)
  * Manual save option in developer tools
  * Data validation when loading saves to prevent corrupt data

### 7.1. Prestige Mechanic Details

*   **Prestige Currency:** Prestige Points (⭐) are earned by resetting the game.
*   **Prestige Bonus:** Prestige Points provide a permanent multiplier to gold per click and gold per second in subsequent playthroughs. This bonus scales with the number of prestige points accumulated.
*   **Prestige Reset:** When a player prestiges:
    *   Their current gold, jobs, and upgrades are reset to their initial values.
    *   Their `lifetimeGold` is used to calculate the prestige points earned in that playthrough.
    *   The calculated prestige points are added to their `prestigePoints`.
    *   The `prestigeBonusMultiplier` is updated based on the total `prestigePoints`.
    *   The game restarts with the permanent bonus applied.
*   **Prestige Unlock Condition:** The Prestige button is initially disabled. It becomes enabled when the player reaches a certain milestone (1 million lifetime gold by default). The button shows progress toward this threshold.
*   **Prestige Calculation:** Prestige points are calculated using the square root of lifetime gold divided by a constant, ensuring diminishing returns that incentivize multiple prestiges.

## 8. Future Development (TODOs)

**Phase 1 TODOs (Current Focus):**

*   [ ] **Implement offline progression calculation (Client-Side, localStorage):**
*   [ ] **Balance and Progression Curve Refinement:**
*   [ ] **Add More Upgrade Types:**
*   [ ] **Implement Achievements System:**

**Phase 2 TODOs (Future Focus - Backend and Accounts):**

*   [ ] **Implement Login Mechanism and Database Integration:**
    *   Choose backend technology and database.
    *   Design database schema.
    *   Develop backend API.
    *   Update frontend to use API for saving/loading.
    *   Deploy backend and database.

**Long-Term TODOs (Lower Priority):**

*   [x] **Prestige Mechanic:** Implemented with progress indicator on button
*   [x] **Responsive Design:** Implemented mobile-first, touch-friendly design
*   [x] **Dark Mode:** Added automatic dark mode support based on system preferences
*   [x] **Sound Effects:** Added sound effects for clicks, purchases, and interactions with volume control
*   [ ] **Improved Visuals and Animations:**
*   [ ] **Game Events and Challenges:**
*   [ ] **Multiple Resource Types:**

## 9.  Debugging and Testing

*   **Use the Developer Overlay:** The developer overlay (Ctrl+Shift) is your primary tool for testing and debugging.
*   **Browser Developer Tools:** Use your browser's developer tools (usually opened with F12) to:
    *   Inspect the HTML and CSS.
    *   Debug JavaScript code (set breakpoints, step through execution, examine variables).
    *   Monitor network requests.
    *   Clear `localStorage` (to simulate a first-time player).
*   **Console Logging:** Use `console.log()` statements liberally to output values and track the flow of execution. Current logging tracks prestige progress.
*   **Developer Gold Setting:** The developer gold setting now also sets lifetime gold if the value is higher than current lifetime gold, making it easier to test prestige functionality.
*   **Playtesting:**  Thorough playtesting is *essential* for balancing and identifying bugs.
*   **Manual Save Button:** A "Force Save Game" button has been added to the developer overlay for testing save functionality.
*   **Mobile Testing:** Test the game on various mobile devices and screen sizes to ensure the responsive design works correctly.
*   **Device Emulation:** Use browser developer tools' device emulation to test various screen sizes and device types quickly.

## 10. Balance and Progression

The game's balance is currently defined in the `BALANCE_DATA` constant. Key parameters include:

*   **`baseCost`:**  The initial cost of a job/upgrade.
*   **`costIncreaseRate`:**  Controls how quickly the cost increases.
*   **`costExponent`:**  Controls the shape of the cost curve.
*   **`goldPerSecond` / `goldPerClick`:** The base resource generation rate.
*   **`effectMultiplier` (for upgrades):**  The percentage increase provided by the upgrade.
*   **Prestige Parameters:**
    *   **`unlockThreshold`:** Amount of lifetime gold needed to enable prestige (default: 1,000,000)
    *   **`pointsFormulaDivisor`:** Controls how many prestige points are earned (higher = fewer points)
    *   **`bonusMultiplierPerPoint`:** How much bonus each prestige point gives (default: 2% per point)

Balancing an idle game is an iterative process. It's highly recommended to use a spreadsheet to model the game's economy and experiment with different parameter values.

This document should provide a solid foundation for anyone continuing development on this project. Remember to keep the README, changelogs, and TODOs updated as the game evolves. Good luck!

## 11. Known Issues and Bugfixes

*   **Soldier Job Purchase Bug (FIXED):**
    *   **Issue:** Players were unable to purchase soldiers even when they had enough gold. The purchase function was failing with "Total cost: NaN" error.
    *   **Root Cause:** The string manipulation code in the `buyJob` function was incorrectly handling plural job names. When replacing 's' in "soldiers", it produced "oldiers" instead of "soldier", causing property access to undefined values.
    *   **Fix:** Implemented a direct mapping from plural job types to their singular base forms, ensuring correct property access in the gameState object.
    *   **Files Modified:** `script.js` - Updated the buyJob function to properly handle job type string manipulations.
    *   **Technical Note:** This highlights the dangers of simple string replacements for deriving object property names. A more robust approach using explicit mappings is less error-prone.

*   **Mobile UI Implementation (NEW):**
    *   **Enhancement:** The game UI has been completely redesigned with a mobile-first approach.
    *   **Files Modified:** 
        * `style.css` - Implemented responsive design with mobile-first principles
        * `index.html` - Adjusted structure for better mobile layout and added mobile meta tags
        * `script.js` - Added mobile-specific behaviors and touch optimizations
    *   **Features Added:**
        * Bottom-positioned tab navigation for thumb accessibility on mobile
        * Larger touch targets for all interactive elements
        * Dark mode support based on system preferences
        * Mobile-friendly developer overlay with close button
        * Touch feedback for button interactions
        * Prevention of unwanted zoom on double-tap
    *   **Technical Note:** Using media queries with a mobile-first approach allows the layout to naturally adapt from small screens to larger ones. The enhanced mobile UI makes the game accessible to the 80% of users expected to play on mobile devices.

## Sound Effects

The game includes audio feedback for various interactions:

- **Sound Effects System**: Sound effects for clicks, purchases, and interactions, with ability to toggle on/off.

### Sound Sources and Attribution

All sound effects are sourced from [Mixkit](https://mixkit.co/free-sound-effects/):

1. **Coin Click Sound** (`coin-click.mp3`): Used for the main gold button. [Mixkit](https://mixkit.co/free-sound-effects/).
2. **Stats Tap Sound** (`stat-tap.mp3`): Used for tapping on stat items. [Mixkit](https://mixkit.co/free-sound-effects/).
3. **Buy Job Sound** (`buy-job.mp3`): Played on successful job purchases. [Mixkit](https://mixkit.co/free-sound-effects/).
4. **Buy Upgrade Sound** (`buy-upgrade.mp3`): Played on successful upgrade purchases. [Mixkit](https://mixkit.co/free-sound-effects/).
5. **Error Sound** (`error.mp3`): Played when a purchase fails due to insufficient gold. [Mixkit](https://mixkit.co/free-sound-effects/).
6. **Prestige Sound** (`prestige.mp3`): Played during successful prestige actions. [Mixkit](https://mixkit.co/free-sound-effects/).
7. **Level Up Sound** (`level-up.mp3`): Reserved for future use with achievements and milestones. [Mixkit](https://mixkit.co/free-sound-effects/).

These sounds are used under the [Mixkit Free License](https://mixkit.co/license/), which allows:
- Use in commercial and personal projects
- No attribution required (although appreciated)
- No royalty payments
- No sign-up required

## Background Music

The game includes a background music system with 5 fantasy-themed tracks that play randomly.

### Music System Features:

- **Random Playlist**: The 5 music tracks play in random order, never repeating the same track consecutively.
- **Volume Control**: 
  - Music plays at 25% volume by default for a non-intrusive experience
  - Volume can be adjusted using a slider that appears when hovering over the music button
  - Volume setting is saved in localStorage and persists between sessions
  - Volume can also be adjusted via a slider in the developer overlay
- **Toggle Controls**: Music can be toggled on/off using:
  - The 'M' key
  - A visible music button in the bottom right corner of the screen
  - A checkbox in the developer overlay

### Music Sources and Attribution:

Background music tracks are sourced from royalty-free providers:

1. **Angevin** from Incompetech (Kevin MacLeod) - A medieval-inspired soundtrack ideal for fantasy settings.
2. **Market Day** from RandomMind - A lively medieval market atmosphere.
3. **Medieval Tavern** from RandomMind - Creates a cozy, adventurous inn atmosphere.
4. **Fantasy Adventure** from Alexander Nakarada - An epic soundtrack for questing.
5. **Medieval Village** from RandomMind - Ambient village sounds with medieval instruments.

These tracks are used under CC0 or Creative Commons Attribution licenses. While attribution is not required for some tracks, we appreciate the composers' work.

## Technology Stack

* **JavaScript (ES6+)**: Core game mechanics, idle mechanics, upgrade system, prestige system, sound and music management
* **HTML5**: Structure and game elements
* **CSS3**: Mobile-first responsive design, animation effects, dark mode
* **LocalStorage API**: Game state persistence
* **JSON**: Balance data and configuration
* **Audio API**: Sound effects and background music management

## File Structure

* **`style.css`**: CSS styling for the game, implementing mobile-first responsive design with dark mode
* **`script.js`**: Core game logic, including resource management, jobs, upgrades, prestige, sound and music systems
* **`balance.json`**: Game balance parameters and formulas
* **`sounds/`**: Directory containing sound effect files
* **`sounds/music/`**: Directory containing background music tracks
* **`index.html`**: Game interface and structure

## Code Structure

*   `initGame()`: Initializes and loads the game state, sets up event listeners, and prepare the UI.
*   `updateUI()`: Updates all UI elements with current game state.
*   `formatNumber(number)`: Formats numbers for display (scientific notation or K/M/B/T).
*   `clickGold()`: Handles gold button clicks, updates resources, and animates click feedback.
*   `calculateJobCost(baseAmount, owned, growthRate)`: Calculates cost for the next job based on current ownership.
*   `buyJob(jobType, quantity)`: Purchases the specified job in the given quantity.
*   `buyUpgrade(upgradeType)`: Purchases the specified upgrade.
*   `saveGame()`: Saves game state to localStorage.
*   `loadGame()`: Loads game state from localStorage.
*   `prestigeGame()`: Resets game progress in exchange for permanent bonuses.
*   `calculatePrestigePoints()`: Calculates prestige points based on lifetime gold earned.
*   `openTab(tabName)`: Handles tab switching between Jobs and Upgrades views.
*   `loadSound(soundPath)`: Loads and caches sound files for better performance.
*   `playSound(soundKey)`: Plays a sound effect by its key.
*   `toggleSound()`: Toggles sound effects on/off.
*   `loadSoundPreference()`: Loads sound preference from localStorage.
*   `playRandomMusic()`: Selects and plays a random background music track.
*   `playMusic(musicPath)`: Plays the specified music track.
*   `toggleMusic()`: Toggles background music on/off.
*   `loadMusicPreference()`: Loads music preference from localStorage.
*   `isMobileDevice()`: Detects if the user is on a mobile device.
*   `applyMobileSpecificBehavior()`: Applies mobile-specific enhancements.