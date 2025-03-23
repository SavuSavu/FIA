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
    totalPrestiges: 0,          // Total number of prestiges performed
    artifacts: {                // Artifacts unlocked through prestige
        unlockedIds: [],        // Array of unlocked artifact IDs
    },
    artifactEffects: {          // Current active effects from artifacts
        goldMultiplier: 1,      // Multiplier for all gold income
        clickMultiplier: 1,     // Additional multiplier for click gold
        passiveMultiplier: 1,   // Additional multiplier for passive gold
        jobCostReduction: 0,    // Percentage reduction in job costs
        startingResources: {    // Resources granted on prestige
            gold: 0,            // Starting gold
            miners: 0,          // Starting miners
            soldiers: 0,        // Starting soldiers
            wizards: 0          // Starting wizards
        }
    }
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

// Artifact definitions
const ARTIFACTS = {
    "ancient-coin": {
        id: "ancient-coin",
        name: "Ancient Gold Coin",
        icon: "🪙",
        rarity: "common",
        effect: "Increases all gold income by 20%",
        description: "A mysteriously preserved gold coin bearing the face of a forgotten king.",
        unlockCondition: { prestiges: 1 },
        applyEffect: (gameState) => {
            gameState.artifactEffects.goldMultiplier *= 1.2;
            return gameState;
        }
    },
    "mystic-pickaxe": {
        id: "mystic-pickaxe",
        name: "Mystic Pickaxe",
        icon: "⛏️",
        rarity: "uncommon",
        effect: "Miners are 35% more efficient",
        description: "A finely-crafted pickaxe that hums with arcane energy when held.",
        unlockCondition: { prestiges: 2 },
        applyEffect: (gameState) => {
            // Apply directly to the miners GPS
            gameState.minerJobGPS *= 1.35;
            return gameState;
        }
    },
    "lucky-clover": {
        id: "lucky-clover",
        name: "Four-Leaf Clover",
        icon: "🍀",
        rarity: "uncommon",
        effect: "Gold per click increased by 25%",
        description: "A perfectly preserved clover that seems to shimmer with an inner light.",
        unlockCondition: { prestiges: 3 },
        applyEffect: (gameState) => {
            gameState.artifactEffects.clickMultiplier *= 1.25;
            return gameState;
        }
    },
    "heroes-medallion": {
        id: "heroes-medallion",
        name: "Hero's Medallion",
        icon: "🏅",
        rarity: "rare",
        effect: "Soldiers are 40% more efficient",
        description: "A polished medal awarded to a legendary warrior for feats of valor.",
        unlockCondition: { prestiges: 4 },
        applyEffect: (gameState) => {
            // Apply directly to the soldiers GPS
            gameState.soldierJobGPS *= 1.4;
            return gameState;
        }
    },
    "ancient-scroll": {
        id: "ancient-scroll",
        name: "Ancient Scroll",
        icon: "📜",
        rarity: "rare",
        effect: "Wizards provide 35% more gold per click",
        description: "Fragile parchment inscribed with faded spells of fortune and prosperity.",
        unlockCondition: { prestiges: 5 },
        applyEffect: (gameState) => {
            // Apply directly to the wizard GPC
            gameState.wizardJobGPC *= 1.35;
            return gameState;
        }
    },
    "mercantile-emblem": {
        id: "mercantile-emblem",
        name: "Mercantile Emblem",
        icon: "💼",
        rarity: "epic",
        effect: "All jobs cost 15% less gold",
        description: "A trader's token that whispers secrets of bargaining to its owner.",
        unlockCondition: { prestiges: 6 },
        applyEffect: (gameState) => {
            gameState.artifactEffects.jobCostReduction = 0.15; // 15% reduction
            return gameState;
        }
    },
    "bottomless-pouch": {
        id: "bottomless-pouch",
        name: "Bottomless Pouch",
        icon: "👝",
        rarity: "legendary",
        effect: "Start with 100 gold after each prestige",
        description: "A small leather pouch that somehow produces gold coins from thin air.",
        unlockCondition: { prestiges: 7 },
        applyEffect: (gameState) => {
            gameState.artifactEffects.startingResources.gold = 100;
            return gameState;
        }
    },
    "midas-touch": {
        id: "midas-touch",
        name: "Midas Touch",
        icon: "👆",
        rarity: "legendary",
        effect: "Increases all gold income by 50%",
        description: "Your fingertips glimmer with golden light, turning everything you touch to riches.",
        unlockCondition: { prestiges: 8 },
        applyEffect: (gameState) => {
            gameState.artifactEffects.goldMultiplier *= 1.5;
            return gameState;
        }
    },
    "philosophers-stone": {
        id: "philosophers-stone",
        name: "Philosopher's Stone",
        icon: "💎",
        rarity: "mythic",
        effect: "Start with 3 of each job after prestige and increases all gold income by 25%",
        description: "The legendary alchemical substance that transforms not just lead to gold, but poverty to prosperity.",
        unlockCondition: { prestiges: 10 },
        applyEffect: (gameState) => {
            gameState.artifactEffects.startingResources.miners = 3;
            gameState.artifactEffects.startingResources.soldiers = 3;
            gameState.artifactEffects.startingResources.wizards = 3;
            gameState.artifactEffects.goldMultiplier *= 1.25;
            return gameState;
        }
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
const artifactsTabButton = document.getElementById('artifacts-tab-button');
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

const artifactsContainer = document.getElementById('artifacts-container');
const noArtifactsMessage = document.getElementById('no-artifacts-message');

// Developer overlay visibility state
let devOverlayVisible = false;

// Store balance parameters - assign it immediately to BALANCE_DATA
let balanceData = BALANCE_DATA;

// Sound management system
const SOUNDS = {
    goldClick: 'sounds/coin-click.mp3',
    statsTap: 'sounds/stat-tap.mp3',
    buyJob: 'sounds/buy-job.mp3',
    buyUpgrade: 'sounds/buy-upgrade.mp3',
    levelUp: 'sounds/level-up.mp3',
    error: 'sounds/error.mp3',
    prestige: 'sounds/prestige.mp3'
};

// Music system variables
let musicFiles = []; // Will store discovered music files
let currentMusic = null;
let currentMusicIndex = -1;
let musicEnabled = true;
let musicVolume = 0.25; // Default music volume at 25%

// Sound cache to prevent reloading sounds
const soundCache = {};

// Sound settings
let soundEnabled = true;

/**
 * Loads a sound file and caches it
 * @param {string} soundPath - Path to the sound file
 * @returns {HTMLAudioElement} - Audio element
 */
function loadSound(soundPath) {
    if (!soundCache[soundPath]) {
        const audio = new Audio(soundPath);
        audio.load();
        soundCache[soundPath] = audio;
    }
    return soundCache[soundPath];
}

/**
 * Plays a sound by its key in the SOUNDS object
 * @param {string} soundKey - Key of the sound in SOUNDS object
 */
function playSound(soundKey) {
    if (!soundEnabled) return;
    
    try {
        const soundPath = SOUNDS[soundKey];
        if (!soundPath) return;
        
        const audio = loadSound(soundPath);
        
        // Reset the audio to the beginning if it's already playing
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.log(`Sound error: ${error.message}`);
        });
    } catch (error) {
        console.error('Error playing sound:', error);
    }
}

/**
 * Toggles sound effects on/off and updates UI elements
 * @returns {boolean} The new sound state
 */
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    
    // Update dev overlay toggle if it exists
    const soundToggleInput = document.getElementById('sound-toggle');
    if (soundToggleInput) {
        soundToggleInput.checked = soundEnabled;
    }
    
    // Update main UI sound button if it exists
    const soundToggleButton = document.getElementById('sound-toggle-button');
    if (soundToggleButton) {
        soundToggleButton.innerHTML = soundEnabled ? '🔊' : '🔇';
        soundToggleButton.title = soundEnabled ? 'Mute Sound' : 'Enable Sound';
    }
    
    return soundEnabled;
}

// Toggle sound when S key is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === 's' || event.key === 'S') {
        const newSoundState = toggleSound();
        alert(`Sound ${newSoundState ? 'enabled' : 'disabled'}`);
    }
});

/**
 * Loads sound preference from localStorage
 */
function loadSoundPreference() {
    const savedSoundPreference = localStorage.getItem('soundEnabled');
    if (savedSoundPreference !== null) {
        soundEnabled = savedSoundPreference === 'true';
    }
    
    // Update dev overlay toggle if it exists
    const soundToggleInput = document.getElementById('sound-toggle');
    if (soundToggleInput) {
        soundToggleInput.checked = soundEnabled;
    }
    
    // Update main UI sound button if it exists
    const soundToggleButton = document.getElementById('sound-toggle-button');
    if (soundToggleButton) {
        soundToggleButton.innerHTML = soundEnabled ? '🔊' : '🔇';
        soundToggleButton.title = soundEnabled ? 'Mute Sound' : 'Enable Sound';
    }
}

// Add sound toggle to the developer overlay
function addSoundToggleToDevOverlay() {
    const devOverlay = document.getElementById('dev-overlay');
    
    if (!document.getElementById('sound-toggle-container')) {
        const soundToggleContainer = document.createElement('div');
        soundToggleContainer.id = 'sound-toggle-container';
        soundToggleContainer.style.marginTop = '15px';
        
        const soundToggleLabel = document.createElement('label');
        soundToggleLabel.for = 'sound-toggle';
        soundToggleLabel.style.color = 'white';
        soundToggleLabel.style.display = 'flex';
        soundToggleLabel.style.alignItems = 'center';
        soundToggleLabel.style.cursor = 'pointer';
        
        const soundToggleInput = document.createElement('input');
        soundToggleInput.type = 'checkbox';
        soundToggleInput.id = 'sound-toggle';
        soundToggleInput.checked = soundEnabled;
        soundToggleInput.style.marginRight = '8px';
        
        soundToggleInput.addEventListener('change', () => {
            soundEnabled = soundToggleInput.checked;
            localStorage.setItem('soundEnabled', soundEnabled.toString());
        });
        
        const soundToggleText = document.createTextNode('Enable Sound Effects');
        
        soundToggleLabel.appendChild(soundToggleInput);
        soundToggleLabel.appendChild(soundToggleText);
        soundToggleContainer.appendChild(soundToggleLabel);
        
        // Add the toggle before the close button at the end
        devOverlay.insertBefore(soundToggleContainer, document.getElementById('close-dev-overlay'));
    }
}

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
    
    // Update artifacts UI
    updateArtifactsUI();
    
    // Show/hide artifacts tab based on whether player has prestiged
    if (gameState.totalPrestiges > 0) {
        artifactsTabButton.style.display = 'block';
    } else {
        artifactsTabButton.style.display = 'none';
    }
}

/**
 * Updates the artifacts UI to show unlocked artifacts
 */
function updateArtifactsUI() {
    // Clear the artifacts container
    artifactsContainer.innerHTML = '';
    
    // Check if player has any unlocked artifacts
    if (gameState.artifacts.unlockedIds.length === 0) {
        // Show placeholder message if no artifacts
        noArtifactsMessage.style.display = 'flex';
    } else {
        // Hide placeholder message
        noArtifactsMessage.style.display = 'none';
        
        // Sort artifacts by rarity (lower to higher)
        const rarityOrder = {
            "common": 1,
            "uncommon": 2,
            "rare": 3,
            "epic": 4,
            "legendary": 5,
            "mythic": 6
        };
        
        const sortedArtifacts = [...gameState.artifacts.unlockedIds]
            .map(id => ARTIFACTS[id])
            .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
        
        // Create elements for each unlocked artifact
        sortedArtifacts.forEach(artifact => {
            const artifactElement = createArtifactElement(artifact);
            artifactsContainer.appendChild(artifactElement);
        });
        
        // Also show locked artifacts that will be unlocked soon
        const nextArtifactsToUnlock = Object.values(ARTIFACTS)
            .filter(artifact => !gameState.artifacts.unlockedIds.includes(artifact.id) && 
                   artifact.unlockCondition.prestiges <= gameState.totalPrestiges + 2)
            .sort((a, b) => a.unlockCondition.prestiges - b.unlockCondition.prestiges)
            .slice(0, 3); // Show only the next 3 artifacts
        
        nextArtifactsToUnlock.forEach(artifact => {
            const artifactElement = createArtifactElement(artifact, true);
            artifactsContainer.appendChild(artifactElement);
        });
    }
}

/**
 * Creates an HTML element for an artifact
 * @param {Object} artifact - The artifact data
 * @param {boolean} locked - Whether the artifact is locked
 * @returns {HTMLElement} - The created element
 */
function createArtifactElement(artifact, locked = false) {
    const artifactElement = document.createElement('div');
    artifactElement.className = `artifact-container ${artifact.rarity} ${locked ? 'locked' : ''}`;
    
    const iconElement = document.createElement('div');
    iconElement.className = 'artifact-icon';
    iconElement.textContent = artifact.icon;
    
    const nameElement = document.createElement('div');
    nameElement.className = 'artifact-name';
    nameElement.textContent = artifact.name;
    
    const effectElement = document.createElement('div');
    effectElement.className = 'artifact-effect';
    
    if (locked) {
        effectElement.textContent = `Unlocks after ${artifact.unlockCondition.prestiges} prestige${artifact.unlockCondition.prestiges > 1 ? 's' : ''}`;
    } else {
        effectElement.textContent = artifact.effect;
    }
    
    const flavorElement = document.createElement('div');
    flavorElement.className = 'artifact-flavor';
    flavorElement.textContent = artifact.description;
    
    artifactElement.appendChild(iconElement);
    artifactElement.appendChild(nameElement);
    artifactElement.appendChild(effectElement);
    artifactElement.appendChild(flavorElement);
    
    return artifactElement;
}

/**
 * Check for new artifacts that should be unlocked
 * @param {number} prestigeCount - The current prestige count
 */
function checkArtifactUnlocks(prestigeCount) {
    let newlyUnlocked = [];
    
    // Check each artifact
    Object.values(ARTIFACTS).forEach(artifact => {
        // If it should be unlocked based on prestige count and isn't already unlocked
        if (artifact.unlockCondition.prestiges <= prestigeCount && 
            !gameState.artifacts.unlockedIds.includes(artifact.id)) {
            // Add to unlocked list
            gameState.artifacts.unlockedIds.push(artifact.id);
            newlyUnlocked.push(artifact);
        }
    });
    
    return newlyUnlocked;
}

/**
 * Apply effects from all unlocked artifacts
 */
function applyArtifactEffects() {
    // Reset artifact effects to base values
    gameState.artifactEffects = {
        goldMultiplier: 1,
        clickMultiplier: 1,
        passiveMultiplier: 1,
        jobCostReduction: 0,
        startingResources: {
            gold: 0,
            miners: 0,
            soldiers: 0,
            wizards: 0
        }
    };
    
    // Apply each unlocked artifact's effect
    gameState.artifacts.unlockedIds.forEach(artifactId => {
        const artifact = ARTIFACTS[artifactId];
        if (artifact && typeof artifact.applyEffect === 'function') {
            gameState = artifact.applyEffect(gameState);
        }
    });
    
    // Now apply the overall effects to the actual game values
    
    // Apply gold multipliers to goldPerClick and goldPerSec
    recalculateGoldRates();
    
    // Apply job cost reductions
    if (gameState.artifactEffects.jobCostReduction > 0) {
        // Job costs are recalculated when needed in buyJob, but we need to update the display
        updateJobCostDisplay();
    }
}

/**
 * Recalculates gold rates based on jobs, upgrades, prestige, and artifacts
 */
function recalculateGoldRates() {
    // Base per click from balance data
    const baseGoldPerClick = balanceData.general.baseGoldPerClick;
    
    // Wizard contribution
    const wizardContribution = gameState.wizardJobGPC * gameState.wizardJobs;
    
    // Calculate with artifact multipliers
    gameState.goldPerClick = (baseGoldPerClick + wizardContribution) * 
                             gameState.prestigeBonusMultiplier * 
                             gameState.artifactEffects.goldMultiplier * 
                             gameState.artifactEffects.clickMultiplier;
    
    // Calculate passive income
    const minerContribution = gameState.minerJobGPS * gameState.minerJobs;
    const soldierContribution = gameState.soldierJobGPS * gameState.soldierJobs;
    
    gameState.goldPerSec = (minerContribution + soldierContribution) * 
                           gameState.prestigeBonusMultiplier * 
                           gameState.artifactEffects.goldMultiplier * 
                           gameState.artifactEffects.passiveMultiplier;
}

/**
 * Updates the job cost display after artifacts are applied
 */
function updateJobCostDisplay() {
    // The actual costs are calculated when buying, but we update the display
    
    // Calculate costs with artifact reduction
    const reduction = gameState.artifactEffects.jobCostReduction;
    
    // Miners
    const minerCostBase = calculateNextCost("miners", gameState.minerJobs);
    const minerCostReduced = Math.floor(minerCostBase * (1 - reduction));
    minerJobCostEl.textContent = minerCostReduced;
    
    // Soldiers
    const soldierCostBase = calculateNextCost("soldiers", gameState.soldierJobs);
    const soldierCostReduced = Math.floor(soldierCostBase * (1 - reduction));
    soldierJobCostEl.textContent = soldierCostReduced;
    
    // Wizards
    const wizardCostBase = calculateNextCost("wizards", gameState.wizardJobs);
    const wizardCostReduced = Math.floor(wizardCostBase * (1 - reduction));
    wizardJobCostEl.textContent = wizardCostReduced;
}

// Click event handler
clickButton.addEventListener('click', (event) => {
    const goldGained = gameState.goldPerClick * gameState.prestigeBonusMultiplier;
    gameState.gold += goldGained;
    gameState.lifetimeGold += goldGained;
    console.log(`Lifetime gold: ${gameState.lifetimeGold}, Threshold: ${balanceData.prestige.unlockThreshold}`);
    clickButton.classList.add('clicked');
    
    // Play gold click sound
    playSound('goldClick');
    
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
    let cost = 0;
    
    if (balanceData.jobs[type]) {
        // It's a job
        const jobData = balanceData.jobs[type];
        cost = Math.floor(jobData.baseCost * (1 + jobData.costIncreaseRate * Math.pow(owned, jobData.costExponent)));
    } else if (balanceData.upgrades[type]) {
        // It's an upgrade
        const upgradeData = balanceData.upgrades[type];
        cost = Math.floor(upgradeData.baseCost * (1 + upgradeData.costIncreaseRate * Math.pow(owned, upgradeData.costExponent)));
    } else {
        console.error(`Invalid type for cost calculation: ${type}`);
        return 0;
    }
    
    // Apply artifact cost reduction for jobs
    if (balanceData.jobs[type] && gameState.artifactEffects.jobCostReduction > 0) {
        cost = Math.floor(cost * (1 - gameState.artifactEffects.jobCostReduction));
    }
    
    return cost;
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
    console.log(`buyJob called with: ${jobType}, ${quantity}`);
    
    const jobData = balanceData.jobs[jobType];
    if (!jobData) {
        console.error(`Invalid job type: ${jobType}`);
        return;
    }

    // Fix the string replacement to handle plurals correctly
    let jobTypeBase = jobType;
    if (jobType === "miners") jobTypeBase = "miner";
    else if (jobType === "soldiers") jobTypeBase = "soldier";
    else if (jobType === "wizards") jobTypeBase = "wizard";
    
    let numToBuy = 0;
    if(quantity === 'max') {
        let maxBuyable = 0;
        let totalCost = 0;
        let currentOwned = gameState[jobTypeBase + 'Jobs'];
        let nextCost = calculateNextCost(jobType, currentOwned);
        while (gameState.gold >= totalCost + nextCost) {
            totalCost += nextCost;
            maxBuyable++;
            currentOwned++;
            nextCost = calculateNextCost(jobType, currentOwned);
        }
        numToBuy = maxBuyable;
    } else {
        numToBuy = quantity;
    }

    const totalCost = calculateBulkCost(jobType, jobData.baseCost, jobData.costIncreaseRate, jobData.costExponent, gameState[jobTypeBase + 'Jobs'], quantity);
    console.log(`Total cost: ${totalCost}, Current gold: ${gameState.gold}`);

    if (gameState.gold >= totalCost && numToBuy > 0) {
        gameState.gold -= totalCost;
        gameState[jobTypeBase + 'Jobs'] += numToBuy; 
        
        if(jobType === "wizards"){
            gameState.goldPerClick += numToBuy * jobData.goldPerClick;
        } else {
            // Get the correct per-unit GPS value
            const gpsPerUnit = jobData.goldPerSecond;
            gameState.goldPerSec += numToBuy * gpsPerUnit;
            
            // Update job-specific GPS properties
            if(jobType === "miners") {
                gameState.minerJobGPS = gpsPerUnit;
            } else if(jobType === "soldiers") {
                gameState.soldierJobGPS = gpsPerUnit;
            }
        }
        
        gameState[jobTypeBase + 'JobCost'] = calculateNextCost(jobType, gameState[jobTypeBase + 'Jobs']);
        console.log(`Successfully bought ${numToBuy} ${jobType}`);
        updateUI();
        saveGame();
    } else {
        console.log(`Not enough gold or nothing to buy`);
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
    const originalClickHandler = button.onclick;
    
    button.addEventListener('click', () => {
        const jobType = button.dataset.job;
        const quantity = parseInt(button.dataset.quantity, 10) || button.dataset.quantity; // Handle "max"
        console.log(`Attempting to buy ${quantity} ${jobType}`);
        
        // Store gold before purchase
        const goldBefore = gameState.gold;
        
        buyJob(jobType, quantity);
        
        // If gold changed, a purchase was made
        if (goldBefore > gameState.gold) {
            playSound('buyJob');
        } else {
            // Not enough gold
            playSound('error');
        }
    });
});

// --- Event Listeners for Upgrades ---
document.querySelectorAll('.upgrade-button').forEach(button => {
    const originalClickHandler = button.onclick;
    
    button.addEventListener('click', () => {
        const upgradeId = button.dataset.upgrade;
        const quantity = parseInt(button.dataset.quantity, 10) || button.dataset.quantity; // Handle "max"
        
        // Store gold before purchase
        const goldBefore = gameState.gold;
        
        buyUpgrade(upgradeId, quantity);
        
        // If gold changed, a purchase was made
        if (goldBefore > gameState.gold) {
            playSound('buyUpgrade');
        } else {
            // Not enough gold
            playSound('error');
        }
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

// Detect if user is on a mobile device
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 800);
};

// Mobile specific adjustments
const applyMobileSpecificBehavior = () => {
    if (isMobileDevice()) {
        // Add active class to buttons when touched for feedback
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.classList.add('active-touch');
            }, { passive: true });
            
            button.addEventListener('touchend', function() {
                this.classList.remove('active-touch');
            }, { passive: true });
        });
        
        // Prevent zooming on double tap for gold button
        clickButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            // The click event will still fire
        }, { passive: false });
    }
};

// Developer Tools (Toggle Overlay)
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey) {
        toggleDevOverlay();
    }
});

// Function to toggle developer overlay
function toggleDevOverlay() {
    devOverlayVisible = !devOverlayVisible;
    devOverlay.style.display = devOverlayVisible ? 'flex' : 'none';
}

// Close button for dev overlay (especially helpful on mobile)
const closeDevOverlayButton = document.getElementById('close-dev-overlay');
if (closeDevOverlayButton) {
    closeDevOverlayButton.addEventListener('click', () => {
        toggleDevOverlay();
    });
}

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
        totalPrestiges: 0,
        artifacts: {
            unlockedIds: [],
        },
        artifactEffects: {
            goldMultiplier: 1,
            clickMultiplier: 1,
            passiveMultiplier: 1,
            jobCostReduction: 0,
            startingResources: {
                gold: 0,
                miners: 0,
                soldiers: 0,
                wizards: 0
            }
        }
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
        
        // Increment total prestiges counter
        gameState.totalPrestiges++;
        
        // Check for new artifact unlocks
        const newArtifacts = checkArtifactUnlocks(gameState.totalPrestiges);
        
        // Reset game state (keep prestige points, multiplier, and artifacts)
        const artifactsBackup = { ...gameState.artifacts };
        const prestigePointsBackup = gameState.prestigePoints;
        const prestigeBonusMultiplierBackup = gameState.prestigeBonusMultiplier;
        const totalPrestigesBackup = gameState.totalPrestiges;
        
        gameState.gold = gameState.artifactEffects.startingResources.gold;
        gameState.minerJobs = gameState.artifactEffects.startingResources.miners;
        gameState.soldierJobs = gameState.artifactEffects.startingResources.soldiers;
        gameState.wizardJobs = gameState.artifactEffects.startingResources.wizards;
        
        gameState.goldPerClick = balanceData.general.baseGoldPerClick;
        gameState.goldPerSec = 0;
        gameState.minerJobCost = balanceData.jobs.miners.baseCost;
        gameState.soldierJobCost = balanceData.jobs.soldiers.baseCost;
        gameState.wizardJobCost = balanceData.jobs.wizards.baseCost;
        gameState.minerJobGPS = balanceData.jobs.miners.goldPerSecond;
        gameState.soldierJobGPS = balanceData.jobs.soldiers.goldPerSecond;
        gameState.wizardJobGPC = balanceData.jobs.wizards.goldPerClick;
        
        gameState.upgrades = {
            "miner-sharp-pickaxe": { level: 0, cost: balanceData.upgrades["miner-sharp-pickaxe"].baseCost },
            "soldier-stronger-swords": { level: 0, cost: balanceData.upgrades["soldier-stronger-swords"].baseCost },
            "wizard-better-focus": { level: 0, cost: balanceData.upgrades["wizard-better-focus"].baseCost },
        };
        
        gameState.lifetimeGold = 0; // Reset lifetime gold for new prestige cycle
        
        // Restore prestige and artifacts data
        gameState.artifacts = artifactsBackup;
        gameState.prestigePoints = prestigePointsBackup;
        gameState.prestigeBonusMultiplier = prestigeBonusMultiplierBackup;
        gameState.totalPrestiges = totalPrestigesBackup;
        
        // Apply artifact effects to the fresh game state
        applyArtifactEffects();
        
        // Calculate gold rates with artifacts and prestige bonuses
        recalculateGoldRates();
        
        // Update the UI
        updateUI();
        saveGame();
        playSound('prestige');
        
        // Show message about prestige and any new artifacts
        let message = `Prestiged! Earned ${pointsToGain} Prestige Points. Gold gain bonus increased to +${formatNumber((gameState.prestigeBonusMultiplier - 1) * 100)}%`;
        
        // Add information about newly unlocked artifacts
        if (newArtifacts.length > 0) {
            message += `\n\nYou've discovered ${newArtifacts.length} new artifact${newArtifacts.length > 1 ? 's' : ''}!\n`;
            newArtifacts.forEach(artifact => {
                message += `\n${artifact.icon} ${artifact.name}: ${artifact.effect}`;
            });
            message += "\n\nCheck the Artifacts tab to view your collection!";
        }
        
        alert(message);

    } else {
        playSound('error');
        alert("Not enough lifetime gold to prestige yet!"); // Inform player if no prestige points are earned
    }
}

// Add sound to stat items
function addSoundToStatItems() {
    document.querySelectorAll('.stat-item').forEach(statItem => {
        statItem.addEventListener('click', () => {
            playSound('statsTap');
        });
    });
}

// --- Game Initialization ---

/**
 * Initializes the music system by discovering available music files
 */
function initMusicSystem() {
    // Reset music files array
    musicFiles = [];
    
    // Check if we have direct access to the one file we know exists
    try {
        // Add the known music file
        musicFiles.push('sounds/music/Angevin.mp3');
        
        // Try to discover other music files by common extensions
        const musicDir = 'sounds/music/';
        const commonMusicFiles = [
            'medieval-tavern.mp3',
            'market-day.mp3',
            'fantasy-adventure.mp3',
            'medieval-village.mp3'
        ];
        
        // Add any other potential music files that might exist
        commonMusicFiles.forEach(filename => {
            const audio = new Audio(musicDir + filename);
            
            // Add event listener to check if file loads successfully
            audio.addEventListener('canplaythrough', () => {
                if (!musicFiles.includes(musicDir + filename)) {
                    musicFiles.push(musicDir + filename);
                    console.log(`Music file discovered: ${filename}`);
                }
            }, { once: true });
            
            // Add error handler to ignore files that don't exist
            audio.addEventListener('error', () => {
                console.log(`Music file not found: ${filename}`);
            }, { once: true });
            
            // Try to load the file
            audio.load();
        });
    } catch (error) {
        console.error("Error setting up music system:", error);
    }
    
    console.log(`Music system initialized with ${musicFiles.length} tracks`);
}

/**
 * Plays a random music track from the available music files
 */
function playRandomMusic() {
    // If no music files or music is disabled, do nothing
    if (musicFiles.length === 0 || !musicEnabled) return;
    
    // If there's only one music file, just play it on repeat
    if (musicFiles.length === 1) {
        playMusic(musicFiles[0]);
        return;
    }
    
    // Choose a random track that is different from the current one
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * musicFiles.length);
    } while (newIndex === currentMusicIndex && musicFiles.length > 1);
    
    currentMusicIndex = newIndex;
    playMusic(musicFiles[currentMusicIndex]);
}

/**
 * Plays the specified music track
 * @param {string} musicPath - Path to the music file
 */
function playMusic(musicPath) {
    try {
        // Stop current music if playing
        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0;
        }
        
        // Create new audio element
        currentMusic = new Audio(musicPath);
        currentMusic.volume = musicVolume;
        
        // Set up event for when track ends to play next track
        currentMusic.addEventListener('ended', playRandomMusic);
        
        // Add error handling
        currentMusic.addEventListener('error', (e) => {
            console.error(`Error playing music file ${musicPath}:`, e);
            // Try another track if available
            if (musicFiles.length > 1) {
                setTimeout(playRandomMusic, 1000);
            }
        });
        
        // Play the track
        currentMusic.play().catch(error => {
            console.error("Failed to play music:", error);
        });
    } catch (error) {
        console.error("Error in playMusic:", error);
    }
}

/**
 * Toggles background music on/off
 * @returns {boolean} New music state
 */
function toggleMusic() {
    musicEnabled = !musicEnabled;
    localStorage.setItem('musicEnabled', musicEnabled.toString());
    
    if (musicEnabled) {
        playRandomMusic();
    } else if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
    }
    
    return musicEnabled;
}

/**
 * Loads music preference from localStorage
 */
function loadMusicPreference() {
    const savedMusicPreference = localStorage.getItem('musicEnabled');
    if (savedMusicPreference !== null) {
        musicEnabled = savedMusicPreference === 'true';
    }
    
    // Start playing background music if enabled
    if (musicEnabled) {
        playRandomMusic();
    }
}

// Toggle music when M key is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === 'm' || event.key === 'M') {
        const newMusicState = toggleMusic();
        alert(`Music ${newMusicState ? 'enabled' : 'disabled'}`);
    }
});

/**
 * Sets the background music volume
 * @param {number} volume - Volume level between 0 and 1
 */
function setMusicVolume(volume) {
    // Ensure volume is between 0 and 1
    musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update current music if playing
    if (currentMusic) {
        currentMusic.volume = musicVolume;
    }
    
    // Save to localStorage
    localStorage.setItem('musicVolume', musicVolume.toString());
}

/**
 * Loads music volume preference from localStorage
 */
function loadMusicVolumePreference() {
    const savedVolumePreference = localStorage.getItem('musicVolume');
    if (savedVolumePreference !== null) {
        musicVolume = parseFloat(savedVolumePreference);
        
        // Update current music if playing
        if (currentMusic) {
            currentMusic.volume = musicVolume;
        }
    }
}

// Add sound toggle button to the main UI
function addSoundToggleToUI() {
    const resourcesContainer = document.querySelector('.resources');
    
    // Check if button already exists
    if (document.getElementById('sound-toggle-button')) return;
    
    // Create sound toggle button
    const soundToggleButton = document.createElement('button');
    soundToggleButton.id = 'sound-toggle-button';
    soundToggleButton.className = 'sound-toggle-button';
    soundToggleButton.innerHTML = soundEnabled ? '🔊' : '🔇';
    soundToggleButton.title = soundEnabled ? 'Mute Sound' : 'Enable Sound';
    
    // Style the button
    soundToggleButton.style.background = 'none';
    soundToggleButton.style.border = 'none';
    soundToggleButton.style.fontSize = '24px';
    soundToggleButton.style.cursor = 'pointer';
    soundToggleButton.style.padding = '0';
    soundToggleButton.style.marginRight = '10px';
    soundToggleButton.style.display = 'flex';
    soundToggleButton.style.alignItems = 'center';
    soundToggleButton.style.justifyContent = 'center';
    
    // Toggle sound on click
    soundToggleButton.addEventListener('click', () => {
        toggleSound();
        soundToggleButton.innerHTML = soundEnabled ? '🔊' : '🔇';
        soundToggleButton.title = soundEnabled ? 'Mute Sound' : 'Enable Sound';
    });
    
    // Add long press event for volume control popup
    let longPressTimer;
    
    soundToggleButton.addEventListener('mousedown', (e) => {
        longPressTimer = setTimeout(() => {
            showVolumeControlPopup();
        }, 500); // 500ms for long press
    });
    
    soundToggleButton.addEventListener('touchstart', (e) => {
        longPressTimer = setTimeout(() => {
            showVolumeControlPopup();
            e.preventDefault(); // Prevent touch events from propagating
        }, 500); // 500ms for long press
    });
    
    // Clear the timer if mouse/touch is released before the time is up
    soundToggleButton.addEventListener('mouseup', () => {
        clearTimeout(longPressTimer);
    });
    
    soundToggleButton.addEventListener('mouseleave', () => {
        clearTimeout(longPressTimer);
    });
    
    soundToggleButton.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });
    
    soundToggleButton.addEventListener('touchcancel', () => {
        clearTimeout(longPressTimer);
    });
    
    // Insert the button at the beginning of the resources container
    resourcesContainer.insertBefore(soundToggleButton, resourcesContainer.firstChild);
}

/**
 * Shows the volume control popup with sliders for music and sound effects
 */
function showVolumeControlPopup() {
    // Remove any existing popup before creating a new one
    const existingPopup = document.getElementById('volume-control-popup');
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }

    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'volume-control-popup';
    popup.style.position = 'fixed';
    
    // Use semi-transparent background with rgba
    popup.style.backgroundColor = 'rgba(58, 49, 34, 0.85)'; // Dark parchment with transparency
    popup.style.border = '2px solid #8b6b3d';
    popup.style.borderRadius = '8px';
    popup.style.padding = '15px';
    popup.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
    popup.style.zIndex = '1000';
    popup.style.color = '#e8d7b0'; // Light parchment text color
    
    // Check if on mobile device
    const isMobile = window.innerWidth <= 768 || isMobileDevice();
    
    if (isMobile) {
        // Center popup on mobile
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.maxWidth = '90%';
        popup.style.width = '300px';
    } else {
        // Position near the sound button on desktop
        const soundButton = document.getElementById('sound-toggle-button');
        if (soundButton) {
            const rect = soundButton.getBoundingClientRect();
            popup.style.top = `${rect.bottom + 10}px`;
            popup.style.left = `${rect.left - 100}px`;
        } else {
            popup.style.top = '60px';
            popup.style.left = '10px';
        }
    }
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Volume Controls';
    title.style.margin = '0 0 15px 0';
    title.style.textAlign = 'center';
    title.style.borderBottom = '1px solid #a88734';
    title.style.paddingBottom = '5px';
    title.style.color = '#e0c088'; // Gold tint for the title
    popup.appendChild(title);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';  // × symbol
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#e0c088';
    closeButton.onclick = () => {
        document.body.removeChild(popup);
    };
    popup.appendChild(closeButton);
    
    // Create music volume control
    const musicVolumeControl = document.createElement('div');
    musicVolumeControl.style.marginBottom = '15px';
    
    const musicLabel = document.createElement('label');
    musicLabel.textContent = 'Music Volume:';
    musicLabel.style.display = 'block';
    musicLabel.style.marginBottom = '5px';
    musicLabel.style.color = '#e0c088'; // Matching gold theme
    musicVolumeControl.appendChild(musicLabel);
    
    const musicSliderContainer = document.createElement('div');
    musicSliderContainer.style.display = 'flex';
    musicSliderContainer.style.alignItems = 'center';
    
    const musicSlider = document.createElement('input');
    musicSlider.type = 'range';
    musicSlider.min = '0';
    musicSlider.max = '100';
    musicSlider.value = Math.round(musicVolume * 100);
    musicSlider.style.flex = '1';
    musicSlider.style.marginRight = '10px';
    musicSlider.style.accentColor = '#a88734'; // Gold accent for sliders
    
    const musicVolumeValue = document.createElement('span');
    musicVolumeValue.textContent = `${Math.round(musicVolume * 100)}%`;
    musicVolumeValue.style.minWidth = '40px';
    
    musicSlider.addEventListener('input', () => {
        const volume = parseFloat(musicSlider.value) / 100;
        setMusicVolume(volume);
        musicVolumeValue.textContent = `${musicSlider.value}%`;
    });
    
    musicSliderContainer.appendChild(musicSlider);
    musicSliderContainer.appendChild(musicVolumeValue);
    musicVolumeControl.appendChild(musicSliderContainer);
    
    // Add music toggle
    const musicToggle = document.createElement('div');
    musicToggle.style.marginTop = '10px';
    musicToggle.style.display = 'flex';
    musicToggle.style.alignItems = 'center';
    
    const musicCheckbox = document.createElement('input');
    musicCheckbox.type = 'checkbox';
    musicCheckbox.id = 'music-toggle-checkbox';
    musicCheckbox.checked = localStorage.getItem('musicEnabled') !== 'false';
    musicCheckbox.style.marginRight = '8px';
    
    const musicToggleLabel = document.createElement('label');
    musicToggleLabel.htmlFor = 'music-toggle-checkbox';
    musicToggleLabel.textContent = 'Enable Music';
    
    musicCheckbox.addEventListener('change', () => {
        if (musicCheckbox.checked) {
            if (!currentMusic) {
                playRandomMusic();
            } else {
                currentMusic.play();
            }
            localStorage.setItem('musicEnabled', 'true');
        } else {
            if (currentMusic) {
                currentMusic.pause();
            }
            localStorage.setItem('musicEnabled', 'false');
        }
    });
    
    musicToggle.appendChild(musicCheckbox);
    musicToggle.appendChild(musicToggleLabel);
    musicVolumeControl.appendChild(musicToggle);
    
    popup.appendChild(musicVolumeControl);
    
    // Create sound volume control
    const soundVolumeControl = document.createElement('div');
    
    const soundLabel = document.createElement('label');
    soundLabel.textContent = 'Sound Effects Volume:';
    soundLabel.style.display = 'block';
    soundLabel.style.marginBottom = '5px';
    soundLabel.style.color = '#e0c088'; // Matching gold theme
    soundVolumeControl.appendChild(soundLabel);
    
    const soundSliderContainer = document.createElement('div');
    soundSliderContainer.style.display = 'flex';
    soundSliderContainer.style.alignItems = 'center';
    
    // Get the current sound volume or set default
    let soundVolume = parseFloat(localStorage.getItem('soundVolume') || '1');
    
    const soundSlider = document.createElement('input');
    soundSlider.type = 'range';
    soundSlider.min = '0';
    soundSlider.max = '100';
    soundSlider.value = Math.round(soundVolume * 100);
    soundSlider.style.flex = '1';
    soundSlider.style.marginRight = '10px';
    soundSlider.style.accentColor = '#a88734'; // Gold accent for sliders
    
    const soundVolumeValue = document.createElement('span');
    soundVolumeValue.textContent = `${Math.round(soundVolume * 100)}%`;
    soundVolumeValue.style.minWidth = '40px';
    
    soundSlider.addEventListener('input', () => {
        const volume = parseFloat(soundSlider.value) / 100;
        // Update sound volume and save to localStorage
        localStorage.setItem('soundVolume', volume.toString());
        soundVolumeValue.textContent = `${soundSlider.value}%`;
    });
    
    soundSliderContainer.appendChild(soundSlider);
    soundSliderContainer.appendChild(soundVolumeValue);
    soundVolumeControl.appendChild(soundSliderContainer);
    
    popup.appendChild(soundVolumeControl);
    
    // Add to document
    document.body.appendChild(popup);

    // Add a delay before enabling close on click outside to prevent immediate closing on desktop
    let closeEnabled = false;
    
    setTimeout(() => {
        closeEnabled = true;
    }, 100);
    
    // Close popup when clicking outside
    const closeOnClickOutside = (e) => {
        if (!closeEnabled) return;
        
        if (!popup.contains(e.target) && e.target.id !== 'sound-toggle-button') {
            document.body.removeChild(popup);
            document.removeEventListener('mousedown', closeOnClickOutside);
            document.removeEventListener('touchstart', closeOnClickOutside);
        }
    };
    
    document.addEventListener('mousedown', closeOnClickOutside);
    document.addEventListener('touchstart', closeOnClickOutside);
}

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
    loadSoundPreference();
    
    // Initialize music system
    initMusicSystem();
    loadMusicPreference(); // Initialize music preferences
    loadMusicVolumePreference(); // Initialize music volume preference
    
    // Apply artifact effects after loading game
    if (gameState.artifacts && gameState.artifacts.unlockedIds && gameState.artifacts.unlockedIds.length > 0) {
        applyArtifactEffects();
    }
    
    // Hide artifacts tab until player has at least one prestige
    if (artifactsTabButton) {
        if (gameState.totalPrestiges > 0) {
            artifactsTabButton.style.display = 'block';
        } else {
            artifactsTabButton.style.display = 'none';
        }
    }
    
    // Set initial active tab and update
    openTab('jobs-content');
    jobsTabButton.classList.add("active");
    numberFormatToggle.checked = gameState.useScientificNotation;
    updateUI();
    
    // Apply mobile-specific behavior
    applyMobileSpecificBehavior();

    // Add sound toggle to dev overlay
    addSoundToggleToDevOverlay();
    
    // Add sound toggle to main UI
    addSoundToggleToUI();
    
    // Add sound to stat items
    addSoundToStatItems();

    if (!localStorage.getItem('hasVisited')) {
        alert("Welcome to Fantasy Idle Adventure!\n\n" +
            "Click the gold coin to earn gold.\n" +
            "Use your gold to hire Miners, Soldiers, and Wizards (Jobs).\n" +
            "Buy upgrades to improve your Jobs.\n\n" +
            "Have fun!");
        localStorage.setItem('hasVisited', 'true');
    }
    
    addManualSaveButton();

    // Add event listeners to tab buttons
    jobsTabButton.addEventListener('click', (event) => openTab('jobs-content', event)); // Pass event object
    upgradesTabButton.addEventListener('click', (event) => openTab('upgrades-content', event)); // Pass event object
    artifactsTabButton.addEventListener('click', (event) => openTab('artifacts-content', event)); // Pass event object
    
    // Add event listener to number format toggle
    numberFormatToggle.addEventListener('change', () => {
        gameState.useScientificNotation = numberFormatToggle.checked; // Update the game state
        updateUI(); // Re-render the UI with the new format
        saveGame(); //save preference
    });
    // Add event listener to prestige button
    prestigeButton.addEventListener('click', prestigeGame);
}

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

// Call the initialization function
initGame();

// Add these functions at the beginning of the click handling code
// Debug functions for mobile troubleshooting
const debugDisplay = document.getElementById('debug-display');
let debugEnabled = false; // Now disabled by default

// Function to show debug message in the dev overlay
function showDebug(message) {
    if (!debugEnabled) return; // Skip if debugging is disabled
    
    console.log(message); // Always log to console
    
    if (debugDisplay) {
        debugDisplay.innerHTML += message + '<br>';
        
        // Only keep last 10 messages
        const lines = debugDisplay.innerHTML.split('<br>');
        if (lines.length > 11) {
            debugDisplay.innerHTML = lines.slice(lines.length - 11).join('<br>');
        }
        
        // Auto-scroll to bottom
        debugDisplay.scrollTop = debugDisplay.scrollHeight;
    }
}

// Function to clear debug messages
function clearDebug() {
    if (debugDisplay) {
        debugDisplay.innerHTML = '';
    }
}

// Function to toggle debug mode
function toggleDebug() {
    debugEnabled = !debugEnabled;
    showDebug(`Debug mode ${debugEnabled ? 'enabled' : 'disabled'}`);
    return debugEnabled;
}

// Add event listeners for debug buttons in dev overlay
document.addEventListener('DOMContentLoaded', function() {
    const clearDebugButton = document.getElementById('clear-debug');
    const toggleDebugButton = document.getElementById('toggle-debug');
    
    if (clearDebugButton) {
        clearDebugButton.addEventListener('click', clearDebug);
    }
    
    if (toggleDebugButton) {
        toggleDebugButton.addEventListener('click', function() {
            const isEnabled = toggleDebug();
            this.textContent = isEnabled ? 'Disable Debug' : 'Enable Debug';
        });
    }
});

// Mobile detection with debug output
document.addEventListener('DOMContentLoaded', function() {
    const isMobile = isMobileDevice();
    showDebug(`Mobile device detected: ${isMobile}`);
    showDebug(`User Agent: ${navigator.userAgent}`);
    
    const clickArea = document.querySelector('.click-area');
    const clickButton = document.getElementById('click-button');
    
    if (clickArea && clickButton) {
        showDebug('Click elements found');
        
        // Add empty handlers for Safari
        ['touchstart', 'touchend', 'touchcancel', 'touchmove'].forEach(event => {
            clickArea.addEventListener(event, function() {
                showDebug(`Empty ${event} fired`);
            });
        });
        
        // Use touchstart for immediate response on mobile
        clickArea.addEventListener('touchstart', function(event) {
            showDebug('touchstart on click-area');
            handleCoinClick(event);
        });
        
        // Keep click for desktop compatibility
        clickArea.addEventListener('click', function(event) {
            showDebug('click on click-area');
            if (event.pointerType === 'touch') {
                showDebug('Ignoring simulated click after touch');
                return;
            }
            handleCoinClick(event);
        });
        
        // Direct button listeners too
        clickButton.addEventListener('touchstart', function(event) {
            showDebug('touchstart on button');
            event.stopPropagation();
            handleCoinClick(event);
        });
        
        clickButton.addEventListener('click', function(event) {
            showDebug('click on button');
            if (event.pointerType === 'touch') {
                showDebug('Ignoring simulated click after touch');
                return;
            }
            event.stopPropagation();
            handleCoinClick(event);
        });
    } else {
        showDebug('ERROR: Click elements not found!');
    }
});

// Function to handle the coin click action
function handleCoinClick(event) {
    showDebug('handleCoinClick called');
    
    // Create a gold particle at the click position
    try {
        createGoldParticle(event);
    } catch (e) {
        showDebug(`Error in particle: ${e.message}`);
    }
    
    // Calculate the gold gained with prestige bonus
    const goldGained = gameState.goldPerClick * gameState.prestigeBonusMultiplier;
    
    // Add gold
    gameState.gold += goldGained;
    gameState.lifetimeGold += goldGained;
    
    // Log for debugging
    showDebug(`Gold added: ${goldGained}`);
    
    // Play sound - use the exact key from SOUNDS object
    try {
        playSound('goldClick');
    } catch (e) {
        showDebug(`Sound error: ${e.message}`);
    }
    
    // Add the visual feedback
    if (clickButton) {
        clickButton.classList.add('clicked');
        setTimeout(() => {
            clickButton.classList.remove('clicked');
        }, 100);
    }
    
    // Update UI and save
    try {
        updateUI();
        saveGame();
        showDebug('UI updated & saved');
    } catch (e) {
        showDebug(`Error in update: ${e.message}`);
    }
}