// M4L AI Composer Device - Simplified Version
// Save this as "ai_composer.js"

// Include external modules
include("tracks.js");
include("tempo.js");
include("patterns.js");
include("utils.js");
include("mixing.js");

// Define bang function FIRST to avoid errors
function bang() {
    post("Bang received - executing action");
    requestNextAction();
}

// Global Variables
var connected = false;
var currentPhase = 1;
var projectState = {
    tracksCreated: [],
    clipsGenerated: [],
    pluginsLoaded: []
};

// Main functions
function connectToAIService() {
    connected = true;
    post("Connected to AI Composer Service");
    outlet(0, "connected");
    sendProjectStatus();
}

function requestNextAction() {
    if (!connected) {
        post("Not connected - connecting now");
        connectToAIService();
        return;
    }
    
    post("Executing next action - creating test track");
    executeTestAction();
}

function executeTestAction() {
    try {
        // Ensure createDrumTrack calls the robust createTrackWithName
        createDrumTrack({name: "AI Test Track"});
        post("Test action completed");
        outlet(1, "action_completed");
    } catch (e) {
        post("Action failed: " + e.message);
        outlet(1, "action_failed");
    }
}






function sendProjectStatus() {
    post("Project Status: " + projectState.tracksCreated.length + " tracks created");
    outlet(1, "project_status", currentPhase, projectState.tracksCreated.length);
}

function advancePhase() {
    currentPhase = currentPhase + 1;
    if (currentPhase > 6) {
        currentPhase = 6;
        post("Project completed");
    } else {
        post("Advanced to phase: " + currentPhase);
    }
    outlet(1, "phase_changed", currentPhase);
}

// Message handlers
function msg_int(value) {
    if (value === 1) {
        post("Integer message received: " + value);
        requestNextAction();
    } else if (value >= 60 && value <= 200) { // Handle tempo input via int
        post("Number input received: " + value + " BPM");
        setTempo(value);
    } else {
        post("BPM out of range or unhandled integer message: " + value);
    }
}

function msg_float(value) {
    msg_int(Math.round(value));
}

function connect() {
    post("Connect command received");
    connectToAIService();
}

function next_phase() {
    post("Advancing to next phase");
    advancePhase();
}

function test() {
    post("Running test function");
    try {
        var liveSet = new LiveAPI("live_set");
        var tempo = liveSet.get("tempo");
        post("Live API working - Current tempo: " + tempo);
        createDrumTrack({name: "Test Track"});
    } catch (e) {
        post("Test failed: " + e.message);
    }
}

function status() {
    post("AI Composer Status:");
    post("  Connected: " + connected);
    post("  Current Phase: " + currentPhase);
    post("  Tracks Created: " + projectState.tracksCreated.length);
}










// AI CONTROL FUNCTIONS
function nextPhase() {
    post("Advancing to next phase");
    advancePhase();
}

function autoArrange() {
    post("Auto-arranging song");
    try {
        // Create different sections
        post("Creating intro section...");
        // ... (rest of your auto-arrange logic)
    } catch (e) {
        post("Auto-arrange failed: " + e.message);
    }
}
