/**
 * ================================================================
 * JAVASCRIPT README
 * ================================================================
 *
 * Purpose:
 * This script implements the core game mechanics for Fantasy Idle Adventure.
 * It handles resource generation, job hiring, upgrades, game state management,
 * and UI updates.  It also includes a tabbed interface, bulk buying, and
 * a developer option to switch number formatting.
 *
 * Core Functionality:
 * - Resource management (gold, per-click, per-second)
 * - Job system (formerly "upgrades") with multiple unit types
 * - Upgrade system to enhance job output
 * - Click mechanics with visual feedback
 * - Idle income generation
 * - Game state persistence using localStorage
 * - Developer tools (reset button, number format toggle, value setting - now with additive/subtractive behavior)
 * - Balance parameters loaded from balance.json (prestige parameters moved to balance.json)
 * - Tabbed interface for Jobs and Upgrades
 * - Bulk buying for jobs and upgrades (x1, x10, Max)
 * - Prestige Mechanic to reset progress for permanent bonuses (full logic implemented, parameters from balance.json)
 *
 * Changelog:
 * v1.0.0  - Initial implementation with basic game mechanics
 * v1.0.1  - Added additional upgrade types (soldiers, wizards)
 * v1.0.2  - Implemented visual feedback and animations
 * v1.0.3  - Fixed passive income timing bug, added welcome message
 * v1.0.4  - Split code into separate HTML, CSS, and JavaScript files
 * v1.0.5  - Added developer reset button (Ctrl+Shift to activate)
 * v1.0.6  - Implemented new cost calculation for balancing
 * v1.0.7  - Refined balancing parameters based on spreadsheet modeling
 * v1.0.8  - Moved balancing parameters to external balance.json file
 * v1.0.9  - Renamed "upgrades" to "jobs", added new "upgrades" for job-specific buffs
 * v1.0.10 - Completed and corrected script.js, including wizard upgrade logic and initGame()
 * v1.0.11 - Implemented tabbed interface for Jobs and Upgrades views.
 * v1.0.12 - Limited displayed numbers to a maximum of 3 decimal places.
 * v1.0.13 - Improved number formatting to only show decimal places when needed.
 * v1.0.14 - Implemented bulk buying (x1, x10, Max) for jobs and upgrades.
 * v1.0.15 - Added number format toggle (scientific notation vs. K/M/B/T) to developer overlay.
 * v1.0.16 - Implemented Prestige Mechanic (initial structure and UI elements).
 * v1.0.17 - Modified developer overlay to toggle visibility on Ctrl+Shift press.
 * v1.0.18 - Fixed error in initGame tab activation.
 * v1.0.19 - Implemented functionality for "Set Values" button in dev overlay.
 * v1.0.20 - Modified "Set Values" button in dev overlay to allow additive/subtractive changes (0 input ignores change).
 * v1.0.21 - Implemented prestige button enabling logic based on lifetime gold.
 * v1.0.22 - Implemented prestige mechanic core logic (calculatePrestigePoints, prestigeGame functionality).
 * v1.0.23 - Moved prestige parameters to balance.json.
 *
 * TODO:
 * - Implement offline progression calculation
 * - Add achievements system
 * - Implement more upgrade types and job types
 * - Add sound effects
 * - Further refine balance and progression curve (ongoing)
 * ================================================================
 */

// Game state variables - stores all player progress and game settings
let gameState = {
    gold: 0,
    goldPerClick: 1,
    goldPerSec: 0,
    minerJobs: 0,       // Number of miners
    minerJobCost: 10,   // Cost of next miner
    minerJobGPS: 1,     // Gold per second *per miner*
    soldierJobs: 0,
    soldierJobCost: 50,
    soldierJobGPS: 5,    // Gold per second *per soldier*
    wizardJobs: 0,
    wizardJobCost: 100,
    wizardJobGPC: 2,     //Added to calculate the Total Gold Per Click.
    upgrades: {  // New upgrades object
        "miner-sharp-pickaxe": { level: 0, cost: 50 },
        "soldier-stronger-swords": { level: 0, cost: 150 },
        "wizard-better-focus": { level: 0, cost: 250 },
    },
    useScientificNotation: false, // Flag for number formatting
    prestigePoints: 0,          // Total prestige points earned
    prestigeBonusMultiplier: 1, // Multiplier to gold gain from prestige
    lifetimeGold: 0,            // Total gold earned in current prestige cycle
};

// Move balance.json contents here as a constant
const BALANCE_DATA = {
    "general": {
      "clicksPerMinute": 60,
      "baseGoldPerClick": 1
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
};

// DOM element references
const goldCountEl = document.getElementById('gold-count');
const goldPerClickEl = document.getElementById('gold-per-click');
const goldPerSecondEl = document.getElementById('gold-per-second');
const minerJobCountEl = document.getElementById('miner-job-count');
const soldierJobCountEl = document.getElementById('soldier-job-count');
const wizardJobCountEl = document.getElementById('wizard-job-count');
const minerJobCostEl = document.getElementById('miner-job-cost');
const soldierJobCostEl = document.getElementById('soldier-job-cost');
const wizardJobCostEl = document.getElementById('wizard-job-cost');
const clickButton = document.getElementById('click-button');
const hireMinerJobButton = document.getElementById('hire-miner-job'); //  Not used directly anymore
const hireSoldierJobButton = document.getElementById('hire-soldier-job'); //  Not used directly anymore
const hireWizardJobButton = document.getElementById('hire-wizard-job'); //  Not used directly anymore
const autosaveNotification = document.getElementById('autosave-notification');
const devOverlay = document.getElementById('dev-overlay');
const resetButton = document.getElementById('reset-button');
//miner
const minerGps = document.getElementById('miner-gps');
//upgrade
const upgradeMinerSharpPickaxeButton = document.getElementById('upgrade-miner-sharp-pickaxe');
const upgradeMinerSharpPickaxeLevelEl = document.getElementById('upgrade-miner-sharp-pickaxe-level');
const upgradeMinerSharpPickaxeCostEl = document.getElementById('upgrade-miner-sharp-pickaxe-cost');
//soldier
const soldierGps = document.getElementById('soldier-gps');
//upgrade
const upgradeSoldierStrongerSwordsButton = document.getElementById('upgrade-soldier-stronger-swords');
const upgradeSoldierStrongerSwordsLevelEl = document.getElementById('upgrade-soldier-stronger-swords-level');
const upgradeSoldierStrongerSwordsCostEl = document.getElementById('upgrade-soldier-stronger-swords-cost');
//wizard
const upgradeWizardBetterFocusButton = document.getElementById('upgrade-wizard-better-focus');
const upgradeWizardBetterFocusLevelEl = document.getElementById('upgrade-wizard-better-focus-level');
const upgradeWizardBetterFocusCostEl = document.getElementById('upgrade-wizard-better-focus-cost');
//tabs
const jobsTabButton = document.getElementById('jobs-tab-button');
const upgradesTabButton = document.getElementById('upgrades-tab-button');
//dev
const numberFormatToggle = document.getElementById('number-format-toggle');
//prestige
const prestigeButton = document.getElementById('prestige-button');
const prestigePointsDisplay = document.getElementById('prestige-points');
const prestigeBonusDisplay = document.getElementById('prestige-bonus');
//dev input fields
const devGoldInput = document.getElementById('dev-gold');
const devMinersInput = document.getElementById('dev-miners');
const devSoldiersInput = document.getElementById('dev-soldiers');
const devWizardsInput = document.getElementById('dev-wizards');
const devMinerUpgradeInput = document.getElementById('dev-miner-upgrade');
const devSoldierUpgradeInput = document.getElementById('dev-soldier-upgrade');
const devWizardUpgradeInput = document.getElementById('dev-wizard-upgrade');
const devSetValuesButton = document.getElementById('dev-set-values');


// Developer overlay visibility state
let devOverlayVisible = false;

// Store balance parameters - assign it immediately to BALANCE_DATA
let balanceData = BALANCE_DATA;

/**
 * Saves current game state to localStorage with enhanced reliability
 * @returns {boolean} Whether the save was successful
 */
function saveGame() {
    try {
        // Add a timestamp to the save data
        gameState.lastSaved = new Date().getTime();
        
        // Save to localStorage
        localStorage.setItem('fantasyIdleGame', JSON.stringify(gameState));
        
        // Also save to sessionStorage as a backup
        sessionStorage.setItem('fantasyIdleGame_backup', JSON.stringify(gameState));
        
        showAutosaveNotification();
        return true;
    } catch (e) {
        console.error('Failed to save game:', e);
        return false;
    }
}

/**
 * Loads game state from localStorage with improved error handling
 */
function loadGame() {
    let loadedState = null;
    
    try {
        // Try to load from localStorage first
        const savedState = localStorage.getItem('fantasyIdleGame');
        if (savedState) {
            loadedState = JSON.parse(savedState);
        }
    } catch (e) {
        console.error('Failed to load game from localStorage:', e);
    }
    
    // If localStorage failed, try sessionStorage backup
    if (!loadedState) {
        try {
            const backupState = sessionStorage.getItem('fantasyIdleGame_backup');
            if (backupState) {
                loadedState = JSON.parse(backupState);
                console.log('Restored game from backup');
            }
        } catch (e) {
            console.error('Failed to load game from backup:', e);
        }
    }
    
    if (loadedState) {
        // Data validation - make sure essential properties exist
        if (typeof loadedState.gold !== 'number' || typeof loadedState.prestigePoints !== 'number') {
            console.error('Saved game data appears to be corrupt');
            return; // Don't load corrupt data
        }
        
        // Merge loaded state with current state
        gameState = { ...gameState, ...loadedState };
        updateUI();
        
        // Log when the data was last saved
        if (gameState.lastSaved) {
            const lastSavedDate = new Date(gameState.lastSaved);
            console.log(`Game loaded from save (last saved: ${lastSavedDate.toLocaleString()})`);
        }
    }
}

/**
 * Displays the autosave notification
 */
function showAutosaveNotification() {
    autosaveNotification.classList.add('show');
    setTimeout(() => {
        autosaveNotification.classList.remove('show');
    }, 2000);
}

/**
 * Formats a number for display, showing up to 3 decimal places, but
 * removing trailing zeros and the decimal point if unnecessary.  Uses
 * scientific notation if the useScientificNotation flag is true.
 * @param {number} number The number to format.
 * @returns {string} The formatted number string.
 */
function formatNumber(number) {
    if (gameState.useScientificNotation) {
        return number.toExponential(3);
    }

    let formatted = number.toFixed(3);
     // Remove trailing zeros and decimal point
    formatted = formatted.replace(/(\.[0-9]*?)0+$/, "$1");
    formatted = formatted.replace(/\.$/, "");
    // Add K/M/B/T suffixes
    if (number >= 1000000000000) {
        return (number / 1000000000000).toFixed(3).replace(/\.?0+$/, "") + "T";
    } else if (number >= 1000000000) {
        return (number / 1000000000).toFixed(3).replace(/\.?0+$/, "") + "B";
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(3).replace(/\.?0+$/, "") + "M";
    } else if (number >= 1000) {
        return (number / 1000).toFixed(3).replace(/\.?0+$/, "") + "K";
    }

    return formatted;
}

/**
 * Updates all UI elements
 */
function updateUI() {
    goldCountEl.textContent = formatNumber(gameState.gold);
    goldPerClickEl.textContent = formatNumber(gameState.goldPerClick);
    goldPerSecondEl.textContent = formatNumber(gameState.goldPerSec);
    minerJobCountEl.textContent = gameState.minerJobs;
    soldierJobCountEl.textContent = gameState.soldierJobs;
    wizardJobCountEl.textContent = gameState.wizardJobs;

    minerJobCostEl.textContent = Math.floor(gameState.minerJobCost);
    soldierJobCostEl.textContent = Math.floor(gameState.soldierJobCost);
    wizardJobCostEl.textContent = Math.floor(gameState.wizardJobCost);

    // Update upgrade UI elements
    upgradeMinerSharpPickaxeLevelEl.textContent = gameState.upgrades["miner-sharp-pickaxe"].level;
    upgradeMinerSharpPickaxeCostEl.textContent = Math.floor(gameState.upgrades["miner-sharp-pickaxe"].cost);

    upgradeSoldierStrongerSwordsLevelEl.textContent = gameState.upgrades["soldier-stronger-swords"].level;
    upgradeSoldierStrongerSwordsCostEl.textContent = Math.floor(gameState.upgrades["soldier-stronger-swords"].cost);

    upgradeWizardBetterFocusLevelEl.textContent = gameState.upgrades["wizard-better-focus"].level;
    upgradeWizardBetterFocusCostEl.textContent = Math.floor(gameState.upgrades["wizard-better-focus"].cost);

    minerGps.textContent = formatNumber(gameState.minerJobGPS);
    soldierGps.textContent = formatNumber(gameState.soldierJobGPS);

    prestigePointsDisplay.textContent = formatNumber(gameState.prestigePoints);
    prestigeBonusDisplay.textContent = (gameState.prestigeBonusMultiplier - 1) > 0 ? "+" + formatNumber((gameState.prestigeBonusMultiplier - 1) * 100) + "%": "";

    // Update prestige button text to show progress
    const prestigeThreshold = balanceData.prestige.unlockThreshold;
    const progressPercent = Math.min(100, Math.floor((gameState.lifetimeGold / prestigeThreshold) * 100));
    
    // Display progress on the prestige button
    prestigeButton.textContent = `Prestige (${formatNumber(gameState.lifetimeGold)} / ${formatNumber(prestigeThreshold)})`;
    
    // Check and enable prestige button
    if (gameState.lifetimeGold >= prestigeThreshold) {
        prestigeButton.disabled = false;
        prestigeButton.textContent = `Prestige Now! (${formatNumber(gameState.lifetimeGold)} / ${formatNumber(prestigeThreshold)})`;
        console.log("Prestige available!");
    } else {
        prestigeButton.disabled = true;
    }

     // Disable buttons if not enough gold
     document.querySelectorAll('.job-button').forEach(button => {
        const jobType = button.dataset.job;
        const quantity = parseInt(button.dataset.quantity, 10) || 'max'; // 'max' is a string
        if (jobType) {
             const nextCost = calculateBulkCost(jobType, balanceData.jobs[jobType].baseCost, balanceData.jobs[jobType].costIncreaseRate, balanceData.jobs[jobType].costExponent, gameState[jobType.replace('s', '') + 'Jobs'], quantity === 'max' ? 1 : quantity);
             button.disabled = gameState.gold < nextCost;

        }
    });

    document.querySelectorAll('.upgrade-button').forEach(button => {
        const upgradeId = button.dataset.upgrade;
        const quantity = parseInt(button.dataset.quantity, 10) || 'max'; // 'max' is a string, handle it correctly
        if (upgradeId) {
            const nextCost = calculateBulkCost(upgradeId, balanceData.upgrades[upgradeId].baseCost, balanceData.upgrades[upgradeId].costIncreaseRate, balanceData.upgrades[upgradeId].costExponent, gameState.upgrades[upgradeId].level, quantity === 'max' ? 1 : quantity);
            button.disabled = gameState.gold < nextCost;
        }
    });
}

// Click event handler
clickButton.addEventListener('click', (event) => {
    const goldGained = gameState.goldPerClick * gameState.prestigeBonusMultiplier;
    gameState.gold += goldGained;
    gameState.lifetimeGold += goldGained;
    console.log(`Lifetime gold: ${gameState.lifetimeGold}, Threshold: ${balanceData.prestige.unlockThreshold}`);
    clickButton.classList.add('clicked');
    setTimeout(() => {
        clickButton.classList.remove('clicked');
    }, 100);
    createGoldParticle(event);
    updateUI();
});

/**
 * Creates a floating gold particle
 */
function createGoldParticle(event) {
    if (!event) return;
    const particle = document.createElement('div');
    particle.className = 'gold-particle';
    particle.textContent = '+' + formatNumber(gameState.goldPerClick * gameState.prestigeBonusMultiplier); // Use formatNumber here too
    const rect = clickButton.getBoundingClientRect();
    const x = event.clientX - rect.width / 2;
    const y = event.clientY - 20;
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    document.body.appendChild(particle);
    setTimeout(() => {
        document.body.removeChild(particle);
    }, 1000);
}

/**
 * Calculates the next cost of a *single* job or upgrade.
 * @param {string} type The type of item ('miners', 'soldiers', 'wizards', or an upgrade ID).
 * @param {number} owned The number of units/levels already owned.
 * @returns {number} The calculated next cost.
 */
function calculateNextCost(type, owned) {
    if (balanceData.jobs[type]) {
        // It's a job
        const jobData = balanceData.jobs[type];
        return Math.floor(jobData.baseCost * (1 + jobData.costIncreaseRate * Math.pow(owned, jobData.costExponent)));
    } else if (balanceData.upgrades[type]) {
        // It's an upgrade
        const upgradeData = balanceData.upgrades[type];
        return Math.floor(upgradeData.baseCost * (1 + upgradeData.costIncreaseRate * Math.pow(owned, upgradeData.costExponent)));
    } else {
        console.error(`Invalid type for cost calculation: ${type}`);
        return 0;
    }
}

/**
 * Calculates the *total* cost of buying multiple jobs or upgrades.
 * @param {string} type - The type of item ('miners', 'soldiers', 'wizards', or upgrade ID)
 * @param {number} baseCost - The base cost of the item.
 * @param {number} increaseRate - The cost increase rate.
 * @param {number} exponent - The cost exponent.
 * @param {number} owned - The number of items already owned.
 * @param {number|string} quantity - The number of items to purchase, or "max".
 * @returns {number} The total cost.
 */
function calculateBulkCost(type, baseCost, increaseRate, exponent, owned, quantity) {
    if (quantity === 'max') {
        let maxBuyable = 0;
        let totalCost = 0;
        let currentOwned = owned;
        let nextCost = calculateNextCost(type, currentOwned);

        while (gameState.gold >= totalCost + nextCost) {
            totalCost += nextCost;
            maxBuyable++;
            currentOwned++;
            nextCost = calculateNextCost(type, currentOwned);
        }
        return totalCost; // Return the *cost* of the maximum buyable, not the quantity
    } else {
        let totalCost = 0;
        for (let i = 0; i < quantity; i++) {
            totalCost += calculateNextCost(type, owned + i);
        }
        return totalCost;
    }
}

/**
 * Purchases a specified quantity of a job.
 * @param {string} jobType - The type of job to purchase ('miners', 'soldiers', 'wizards').
 * @param {number|string} quantity - The number of jobs to purchase, or "max".
 */
function buyJob(jobType, quantity) {
    const jobData = balanceData.jobs[jobType];
    if (!jobData) {
        console.error(`Invalid job type: ${jobType}`);
        return;
    }

    let numToBuy = 0;
    if(quantity === 'max') {
        let maxBuyable = 0;
        let totalCost = 0;
        let currentOwned = gameState[jobType.replace('s', '') + 'Jobs'];
        let nextCost = calculateNextCost(jobType, currentOwned);
        while (gameState.gold >= totalCost + nextCost) {
            totalCost += nextCost;
            maxBuyable++;
            currentOwned++;
            nextCost = calculateNextCost(jobType, currentOwned);
    }
    numToBuy = maxBuyable;

    }else{
        numToBuy = quantity;
    }


    const totalCost = calculateBulkCost(jobType, jobData.baseCost, jobData.costIncreaseRate, jobData.costExponent, gameState[jobType.replace('s', '') + 'Jobs'], quantity);

    if (gameState.gold >= totalCost) {
        gameState.gold -= totalCost;
        gameState[jobType.replace('s', '') + 'Jobs'] += numToBuy; // Use dynamic property name
        if(jobType === "wizards"){
            gameState.goldPerClick += numToBuy * balanceData.jobs[jobType].goldPerClick;
        }else{
             gameState.goldPerSec += numToBuy * gameState[jobType.replace('s', '') + 'JobGPS']; //jobType === "miners" ? gameState.minerJobGPS : gameState.soldierJobGPS;
        }
        gameState[jobType.replace('s', '') + 'JobCost'] = calculateNextCost(jobType, gameState[jobType.replace('s', '') + 'Jobs']);  // Update the *individual* cost
        updateUI();
        saveGame();
    }
}

/**
 * Purchases a specified quantity of an upgrade.
 * @param {string} upgradeId - The ID of the upgrade to purchase.
 * @param {number|string} quantity - The number of upgrade levels to purchase, or "max"
 */
function buyUpgrade(upgradeId, quantity) {
    const upgradeData = balanceData.upgrades[upgradeId];
        if (!upgradeData) {
        console.error(`Invalid upgrade ID: ${upgradeId}`);
        return;
    }
    let numToBuy = 0;

    if(quantity === 'max'){
        //logic
        let maxBuyable = 0;
        let totalCost = 0;
        let currentOwned = gameState.upgrades[upgradeId].level;
        let nextCost = calculateNextCost(upgradeId, currentOwned);

        while (gameState.gold >= totalCost + nextCost) {
            totalCost += nextCost;
            maxBuyable++;
            currentOwned++;
            nextCost = calculateNextCost(upgradeId, currentOwned);
        }
        numToBuy = maxBuyable;
    } else {
        numToBuy = quantity;
    }
     const totalCost = calculateBulkCost(upgradeId, upgradeData.baseCost, upgradeData.costIncreaseRate, upgradeData.costExponent, gameState.upgrades[upgradeId].level, quantity);
     if (gameState.gold >= totalCost) {
        gameState.gold -= totalCost;
        gameState.upgrades[upgradeId].level += numToBuy;

        // Apply upgrade effects, being careful with wizards (goldPerClick)
        if (upgradeData.job === "miners") {
            gameState.minerJobGPS *= Math.pow((1 + upgradeData.effectMultiplier), numToBuy); // Apply effect *per level* bought
            gameState.goldPerSec = gameState.minerJobGPS * gameState.minerJobs + gameState.soldierJobGPS * gameState.soldierJobs; // Recalc total
        } else if (upgradeData.job === "soldiers") {
            gameState.soldierJobGPS *= Math.pow((1 + upgradeData.effectMultiplier), numToBuy);
            gameState.goldPerSec = gameState.minerJobGPS * gameState.minerJobs + gameState.soldierJobGPS * gameState.soldierJobs; // Recalc total
        } else if (upgradeData.job === "wizards") {
            gameState.wizardJobGPC *= Math.pow((1 + upgradeData.effectMultiplier), numToBuy); // Apply to wizardJobGPC
            gameState.goldPerClick = balanceData.general.baseGoldPerClick + gameState.wizardJobGPC * gameState.wizardJobs;  // Recalc total
        }

        gameState.upgrades[upgradeId].cost = calculateNextCost(upgradeId, gameState.upgrades[upgradeId].level); // Update the *individual* cost
        updateUI();
        saveGame();
    }
}

// --- Event Listeners for Jobs ---
document.querySelectorAll('.job-button').forEach(button => {
    button.addEventListener('click', () => {
        const jobType = button.dataset.job;
        const quantity = parseInt(button.dataset.quantity, 10) || button.dataset.quantity; // Handle "max"
        buyJob(jobType, quantity);
    });
});

// --- Event Listeners for Upgrades ---
document.querySelectorAll('.upgrade-button').forEach(button => {
    button.addEventListener('click', () => {
        const upgradeId = button.dataset.upgrade;
        const quantity = parseInt(button.dataset.quantity, 10) || button.dataset.quantity; // Handle "max"
        buyUpgrade(upgradeId, quantity);
    });
});

// Idle income loop
setInterval(() => {
    const goldGained = gameState.goldPerSec * gameState.prestigeBonusMultiplier;
    gameState.gold += goldGained;
    gameState.lifetimeGold += goldGained;
    updateUI();
}, 1000);

// Save more frequently (every 10 seconds instead of 30)
setInterval(() => {
    saveGame();
}, 10000);

// Save on page visibility change (user switches tabs or minimizes)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveGame();
    }
});

// Developer Tools (Toggle Overlay)
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey) {
        devOverlayVisible = !devOverlayVisible; // Toggle visibility state
        devOverlay.style.display = devOverlayVisible ? 'block' : 'none'; // Update display based on state
    }
});

// Developer Set Values Button
devSetValuesButton.addEventListener('click', () => {
    if(devGoldInput.value !== "0" && devGoldInput.value !== ""){
        const goldValue = parseInt(devGoldInput.value);
        gameState.gold = goldValue;
        // Also set lifetime gold to the same value for testing prestige
        gameState.lifetimeGold = Math.max(gameState.lifetimeGold, goldValue);
        console.log(`Set gold to ${goldValue}, lifetime gold is now ${gameState.lifetimeGold}`);
    }
    if(devMinersInput.value !== "0" && devMinersInput.value !== ""){
        gameState.minerJobs = parseInt(devMinersInput.value);
    }
    if(devSoldiersInput.value !== "0" && devSoldiersInput.value !== ""){
        gameState.soldierJobs = parseInt(devSoldiersInput.value);
    }
    if(devWizardsInput.value !== "0" && devWizardsInput.value !== ""){
        gameState.wizardJobs = parseInt(devWizardsInput.value);
    }
    if(devMinerUpgradeInput.value !== "0" && devMinerUpgradeInput.value !== ""){
        gameState.upgrades["miner-sharp-pickaxe"].level = parseInt(devMinerUpgradeInput.value);
    }
    if(devSoldierUpgradeInput.value !== "0" && devSoldierUpgradeInput.value !== ""){
        gameState.upgrades["soldier-stronger-swords"].level = parseInt(devSoldierUpgradeInput.value);
    }
     if(devWizardUpgradeInput.value !== "0" && devWizardUpgradeInput.value !== ""){
        gameState.upgrades["wizard-better-focus"].level = parseInt(devWizardUpgradeInput.value);
    }


    // Recalculate derived values that depend on jobs/upgrades
    gameState.goldPerClick = balanceData.general.baseGoldPerClick + gameState.wizardJobGPC * gameState.wizardJobs;
    gameState.goldPerSec = gameState.minerJobGPS * gameState.minerJobs + gameState.soldierJobGPS * gameState.soldierJobs;


    updateUI();
    saveGame();
});


resetButton.addEventListener('click', () => {
    localStorage.clear();
    gameState = { //keep consistancy, reset for testing prestige
        gold: 0,
        goldPerClick: 1,
        goldPerSec: 0,
        minerJobs: 0,
        minerJobCost: 10,
        minerJobGPS: 1,
        soldierJobs: 0,
        soldierJobCost: 50,
        soldierJobGPS: 5,
        wizardJobs: 0,
        wizardJobGPC: 2,
        wizardJobCost: 100,
        upgrades: {
            "miner-sharp-pickaxe": { level: 0, cost: 50 },
            "soldier-stronger-swords": { level: 0, cost: 150 },
            "wizard-better-focus": { level: 0, cost: 250 },
        },
        useScientificNotation: false,
        prestigePoints: gameState.prestigePoints, // Keep prestige points
        prestigeBonusMultiplier: gameState.prestigeBonusMultiplier, // Keep bonus multiplier
        lifetimeGold: 0, // Reset lifetime gold for new prestige cycle
    };
    localStorage.removeItem('hasVisited');
    updateUI();
    location.reload();
});

// --- Tab Switching Logic ---

function openTab(tabName, event) { // Make event parameter optional
    // Hide all tab content
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove "active" class from all tab buttons
    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the selected tab content and mark the button as active
    document.getElementById(tabName).style.display = "block";
    if (event) { // Only add active class if event exists (i.e., not called from initGame)
        event.currentTarget.classList.add("active");
    }
}

/**
 * Calculates prestige points based on lifetime gold, using parameters from balance.json.
 * @returns {number} - calculated prestige points
 */
function calculatePrestigePoints() {
    const lifetimeGoldForPrestige = gameState.lifetimeGold;
    if (lifetimeGoldForPrestige <= 0) {
        return 0;
    }
    const prestigePoints = Math.sqrt(lifetimeGoldForPrestige / balanceData.prestige.pointsFormulaDivisor);
    return Math.floor(prestigePoints); // Ensure prestige points are whole numbers
}

/**
 * Handles the prestige action.
 */
function prestigeGame() {
    const pointsToGain = calculatePrestigePoints();

    if (pointsToGain > 0) {
        gameState.prestigePoints += pointsToGain;
        gameState.prestigeBonusMultiplier = 1 + (gameState.prestigePoints * balanceData.prestige.bonusMultiplierPerPoint); // Use bonusMultiplierPerPoint from balance

        // Reset game state (keep prestige points and multiplier)
        gameState.gold = 0;
        gameState.goldPerClick = balanceData.general.baseGoldPerClick * gameState.prestigeBonusMultiplier; // Apply bonus immediately to base click - use baseGoldPerClick from balance
        gameState.goldPerSec = 0;
        gameState.minerJobs = 0;
        gameState.minerJobCost = balanceData.jobs.miners.baseCost;
        gameState.soldierJobs = 0;
        gameState.soldierJobCost = balanceData.jobs.soldiers.baseCost;
        gameState.wizardJobs = 0;
        gameState.wizardJobCost = balanceData.jobs.wizards.baseCost;
        gameState.wizardJobGPC = balanceData.jobs.wizards.goldPerClick; // Reset Wizard GPC to base
        gameState.upgrades = {
            "miner-sharp-pickaxe": { level: 0, cost: balanceData.upgrades["miner-sharp-pickaxe"].baseCost },
            "soldier-stronger-swords": { level: 0, cost: balanceData.upgrades["soldier-stronger-swords"].baseCost },
            "wizard-better-focus": { level: 0, cost: balanceData.upgrades["wizard-better-focus"].baseCost },
        };
        gameState.lifetimeGold = 0; // Reset lifetime gold for new prestige cycle

        updateUI();
        saveGame();
        alert(`Prestiged! Earned ${pointsToGain} Prestige Points. Gold gain bonus increased to +${formatNumber((gameState.prestigeBonusMultiplier - 1) * 100)}%`); // Notification

    } else {
        alert("Not enough lifetime gold to prestige yet!"); // Inform player if no prestige points are earned
    }
}


// --- Game Initialization ---

/**
 * Fetches the balance data from balance.json and initializes the game.
 */
async function initGame() {
    // Remove the fetch since we now have the data directly
    balanceData = BALANCE_DATA;

    // Initialize game state with values from balanceData
    gameState.minerJobCost = balanceData.jobs.miners.baseCost;
    gameState.soldierJobCost = balanceData.jobs.soldiers.baseCost;
    gameState.wizardJobCost = balanceData.jobs.wizards.baseCost;
    gameState.goldPerClick = balanceData.general.baseGoldPerClick * gameState.prestigeBonusMultiplier;
    gameState.wizardJobGPC = balanceData.jobs.wizards.goldPerClick;

    loadGame();
    openTab('jobs-content');
    jobsTabButton.classList.add("active");
    numberFormatToggle.checked = gameState.useScientificNotation;
    updateUI();

    if (!localStorage.getItem('hasVisited')) {
        alert("Welcome to Fantasy Idle Adventure!\n\n" +
            "Click the gold coin to earn gold.\n" +
            "Use your gold to hire Miners, Soldiers, and Wizards (Jobs).\n" +
            "Miners and Soldiers generate gold passively.\n" +
            "Wizards increase the gold you earn per click.\n" +
            "Buy Upgrades to enhance your Jobs' production!\n" +
            "Good luck!");
        localStorage.setItem('hasVisited', 'true');
    }

    addManualSaveButton();
}

// Add event listeners to tab buttons
jobsTabButton.addEventListener('click', (event) => openTab('jobs-content', event)); // Pass event object
upgradesTabButton.addEventListener('click', (event) => openTab('upgrades-content', event)); // Pass event object
// Add event listener to number format toggle
numberFormatToggle.addEventListener('change', () => {
    gameState.useScientificNotation = numberFormatToggle.checked; // Update the game state
    updateUI(); // Re-render the UI with the new format
    saveGame(); //save preference
});
// Add event listener to prestige button
prestigeButton.addEventListener('click', prestigeGame);


initGame(); // Call the initialization function

// Add manual save function to the dev overlay
function addManualSaveButton() {
    const devOverlay = document.getElementById('dev-overlay');
    
    // Create a manual save button if it doesn't exist
    if (!document.getElementById('manual-save-button')) {
        const saveButton = document.createElement('button');
        saveButton.id = 'manual-save-button';
        saveButton.textContent = 'Force Save Game';
        saveButton.addEventListener('click', () => {
            if (saveGame()) {
                alert('Game saved successfully!');
            } else {
                alert('Failed to save game!');
            }
        });
        
        // Add button to dev overlay
        devOverlay.appendChild(saveButton);
    }
}