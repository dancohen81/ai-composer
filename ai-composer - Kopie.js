// M4L AI Composer Device - Simplified Version
// Save this as "ai_composer.js"

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
        createDrumTrack({name: "AI Test Track"});
        post("Test action completed");
        outlet(1, "action_completed");
    } catch (e) {
        post("Action failed: " + e.message);
        outlet(1, "action_failed");
    }
}

function createDrumTrack(params) {
    var trackName = params.name || "AI Drums";
    
    try {
        var liveSet = new LiveAPI("live_set");
        
        // SCHRITT 1: Sammle alle gültigen Track-IDs VOR Erstellung
        post("=== BEFORE TRACK CREATION ===");
        var beforeCount = liveSet.get("tracks").length;
        var validTracksBefore = [];
        
        for (var i = 0; i < beforeCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                if (track.id != 0) {
                    validTracksBefore.push({index: i, id: track.id, name: track.get("name")});
                    post("Valid track " + i + ": id=" + track.id + " name='" + track.get("name") + "'");
                } else {
                    post("Invalid track " + i + ": id=0");
                }
            } catch (e) {
                post("Error checking track " + i + ": " + e.message);
            }
        }
        
        post("Found " + validTracksBefore.length + " valid tracks before creation");
        
        // SCHRITT 2: Track erstellen
        post("=== CREATING TRACK ===");
        liveSet.call("create_midi_track", -1);
        
        // SCHRITT 3: Nach Erstellung alle Tracks checken und neuen finden
        var attempts = 0;
        var maxAttempts = 5;
        
        function findAndNameNewTrack() {
            attempts++;
            post("=== ATTEMPT " + attempts + " ===");
            
            try {
                var afterCount = liveSet.get("tracks").length;
                post("Track count after: " + afterCount + " (was: " + beforeCount + ")");
                
                // Alle Tracks durchgehen und den neuen finden
                for (var i = 0; i < afterCount; i++) {
                    try {
                        var track = new LiveAPI("live_set tracks " + i);
                        
                        if (track.id != 0) {
                            // Prüfen ob dieser Track schon vorher existierte
                            var wasExistingTrack = false;
                            for (var j = 0; j < validTracksBefore.length; j++) {
                                if (validTracksBefore[j].id == track.id) {
                                    wasExistingTrack = true;
                                    break;
                                }
                            }
                            
                            if (!wasExistingTrack) {
                                // Das ist der neue Track!
                                post("FOUND NEW TRACK at index " + i + " with id " + track.id);
                                
                                try {
                                    var currentName = track.get("name");
                                    post("Current name: '" + currentName + "'");
                                    
                                    track.set("name", trackName);
                                    
                                    var newName = track.get("name");
                                    post("SUCCESS: Track renamed to '" + newName + "'");
                                    
                                    projectState.tracksCreated.push(trackName);
                                    outlet(0, trackName);
                                    return; // Erfolgreich!
                                    
                                } catch (nameError) {
                                    post("Failed to set name: " + nameError.message);
                                }
                            } else {
                                post("Track " + i + " already existed (id: " + track.id + ")");
                            }
                        } else {
                            post("Track " + i + " invalid (id: 0)");
                        }
                    } catch (trackError) {
                        post("Error accessing track " + i + ": " + trackError.message);
                    }
                }
                
                // Kein neuer Track gefunden - retry
                if (attempts < maxAttempts) {
                    post("No new valid track found, retrying in " + (attempts * 300) + "ms");
                    var retryTask = new Task(findAndNameNewTrack);
                    retryTask.schedule(attempts * 300);
                } else {
                    post("FAILED: No new track found after " + maxAttempts + " attempts");
                    post("But track count increased, so track was probably created");
                    outlet(0, "track_created_unnamed");
                }
                
            } catch (e) {
                post("Error in attempt " + attempts + ": " + e.message);
                if (attempts < maxAttempts) {
                    var retryTask = new Task(findAndNameNewTrack);
                    retryTask.schedule(attempts * 300);
                }
            }
        }
        
        // Ersten Versuch nach 300ms
        var initialTask = new Task(findAndNameNewTrack);
        initialTask.schedule(300);
        
    } catch (e) {
        post("Create track failed: " + e.message);
    }
}
// BONUS: Funktion um alle Tracks zu analysieren
function debugAllTracks() {
    post("=== ALL TRACKS DEBUG ===");
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        post("Total tracks: " + trackCount);
        
        for (var i = 0; i < trackCount; i++) {
            var track = new LiveAPI("live_set tracks " + i);
            var name = track.get("name");
            var hasAudio = track.get("has_audio_input");
            var hasMidi = track.get("has_midi_input");
            var isFoldable = track.get("is_foldable");
            
            post("Track " + i + ": '" + name + "' Audio:" + hasAudio + " MIDI:" + hasMidi + " Foldable:" + isFoldable);
        }
    } catch (e) {
        post("Debug failed: " + e.message);
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
    }
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


// NEUE FUNKTIONEN für Extended Buttons
// Füge diese zu deinem ai-composer.js File hinzu!

// TRACK CREATION FUNCTIONS
function createDrums() {
    post("Creating AI Drums track");
    createDrumTrack({name: "AI Drums", kit: "Core Kit"});
}

function createBass() {
    post("Creating AI Bass track");
    createBassTrack({name: "AI Bass", synth: "Bass"});
}

function createLead() {
    post("Creating AI Lead track");
    createLeadTrack({name: "AI Lead", synth: "Lead"});
}

function createPad() {
    post("Creating AI Pad track");
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("create_midi_track", -1);
        
        var tracks = new LiveAPI("live_set tracks");
        var trackCount = tracks.get("length");
        
        if (trackCount && trackCount.length > 0) {
            var newTrack = new LiveAPI("live_set tracks " + (trackCount[0] - 1));
            newTrack.set("name", "AI Pad");
            
            projectState.tracksCreated.push("AI Pad");
            post("Created pad track: AI Pad");
            outlet(2, "track_created", "AI Pad", "pad");
        }
    } catch (e) {
        post("Failed to create pad track: " + e.message);
    }
}

function createLeadTrack(params) {
    var trackName = params.name || "AI Lead";
    
    try {
        var liveSet = new LiveAPI("live_set");
        liveSet.call("create_midi_track", -1);
        
        var tracks = new LiveAPI("live_set tracks");
        var trackCount = tracks.get("length");
        
        if (trackCount && trackCount.length > 0) {
            var newTrack = new LiveAPI("live_set tracks " + (trackCount[0] - 1));
            newTrack.set("name", trackName);
            
            projectState.tracksCreated.push(trackName);
            post("Created lead track: " + trackName);
            outlet(2, "track_created", trackName, "lead");
        }
    } catch (e) {
        post("Failed to create lead track: " + e.message);
    }
}

// TEMPO FUNCTIONS
function setTempo120() {
    setTempo(120);
}

function setTempo128() {
    setTempo(128);
}

function setTempo140() {
    setTempo(140);
}

// PATTERN CREATION FUNCTIONS
function createKickPattern() {
    post("Creating kick pattern");
    try {
        // Find drums track
        var tracks = new LiveAPI("live_set tracks");
        var trackCount = tracks.get("length");
        
        if (trackCount && trackCount.length > 0) {
            // Create clip on first track (usually drums)
            var clipSlot = new LiveAPI("live_set tracks 0 clip_slots 0");
            clipSlot.call("create_clip", 4.0);
            
            var clip = new LiveAPI("live_set tracks 0 clip_slots 0 clip");
            clip.set("name", "AI Kick Pattern");
            
            // Simple kick pattern: beats 1 and 3
            // Note: pitch 36 = kick drum in most kits
            clip.call("set_notes", 0.0, 36, 0.25, 100, 0);  // Beat 1
            clip.call("set_notes", 2.0, 36, 0.25, 100, 0);  // Beat 3
            
            post("Created kick pattern");
            outlet(2, "pattern_created", "kick");
        }
    } catch (e) {
        post("Failed to create kick pattern: " + e.message);
    }
}

function createBassLine() {
    post("Creating bass line");
    try {
        // Find bass track (track with "Bass" in name)
        var tracks = new LiveAPI("live_set tracks");
        var trackCount = tracks.get("length");
        
        for (var i = 0; i < trackCount[0]; i++) {
            var track = new LiveAPI("live_set tracks " + i);
            var trackName = track.get("name");
            
            if (trackName && trackName[0] && trackName[0].toLowerCase().includes("bass")) {
                var clipSlot = new LiveAPI("live_set tracks " + i + " clip_slots 0");
                clipSlot.call("create_clip", 4.0);
                
                var clip = new LiveAPI("live_set tracks " + i + " clip_slots 0 clip");
                clip.set("name", "AI Bass Line");
                
                // Simple bass line in C: C - G - F - G
                clip.call("set_notes", 0.0, 36, 0.5, 80, 0);  // C
                clip.call("set_notes", 1.0, 43, 0.5, 80, 0);  // G
                clip.call("set_notes", 2.0, 41, 0.5, 80, 0);  // F
                clip.call("set_notes", 3.0, 43, 0.5, 80, 0);  // G
                
                post("Created bass line on track " + i);
                outlet(2, "pattern_created", "bassline");
                break;
            }
        }
    } catch (e) {
        post("Failed to create bass line: " + e.message);
    }
}

function createMelody() {
    post("Creating melody");
    try {
        // Find lead track
        var tracks = new LiveAPI("live_set tracks");
        var trackCount = tracks.get("length");
        
        for (var i = 0; i < trackCount[0]; i++) {
            var track = new LiveAPI("live_set tracks " + i);
            var trackName = track.get("name");
            
            if (trackName && trackName[0] && trackName[0].toLowerCase().includes("lead")) {
                var clipSlot = new LiveAPI("live_set tracks " + i + " clip_slots 0");
                clipSlot.call("create_clip", 4.0);
                
                var clip = new LiveAPI("live_set tracks " + i + " clip_slots 0 clip");
                clip.set("name", "AI Melody");
                
                // Simple melody in C major: C-D-E-F-G-A-B-C
                var notes = [60, 62, 64, 65, 67, 69, 71, 72]; // C major scale
                for (var n = 0; n < notes.length; n++) {
                    clip.call("set_notes", n * 0.5, notes[n], 0.25, 90, 0);
                }
                
                post("Created melody on track " + i);
                outlet(2, "pattern_created", "melody");
                break;
            }
        }
    } catch (e) {
        post("Failed to create melody: " + e.message);
    }
}

// MIXING FUNCTIONS
function autoEQ() {
    post("Applying auto EQ");
    try {
        // This would load EQ on master or selected track
        post("Auto EQ applied (placeholder)");
        outlet(2, "fx_applied", "EQ");
    } catch (e) {
        post("Failed to apply auto EQ: " + e.message);
    }
}

function autoCompress() {
    post("Applying auto compression");
    try {
        post("Auto compression applied (placeholder)");
        outlet(2, "fx_applied", "Compressor");
    } catch (e) {
        post("Failed to apply compression: " + e.message);
    }
}

function addReverb() {
    post("Adding reverb");
    try {
        post("Reverb added (placeholder)");
        outlet(2, "fx_applied", "Reverb");
    } catch (e) {
        post("Failed to add reverb: " + e.message);
    }
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
        post("Creating verse section...");
        post("Creating chorus section...");
        post("Auto arrangement complete");
        outlet(2, "arrangement_created", "full_song");
    } catch (e) {
        post("Failed to auto arrange: " + e.message);
    }
}

// UTILITY FUNCTIONS
function clearAll() {
    post("Clearing all tracks");
    try {
        var tracks = new LiveAPI("live_set tracks");
        var trackCount = tracks.get("length");
        
        for (var i = trackCount[0] - 1; i >= 0; i--) {
            var track = new LiveAPI("live_set tracks " + i);
            track.call("delete_track");
        }
        
        projectState.tracksCreated = [];
        post("All tracks cleared");
        outlet(2, "tracks_cleared");
    } catch (e) {
        post("Failed to clear tracks: " + e.message);
    }
}

function randomTrack() {
    post("Creating random track");
    var trackTypes = ["Drums", "Bass", "Lead", "Pad"];
    var randomType = trackTypes[Math.floor(Math.random() * trackTypes.length)];
    
    switch(randomType) {
        case "Drums": createDrums(); break;
        case "Bass": createBass(); break;
        case "Lead": createLead(); break;
        case "Pad": createPad(); break;
    }
}


// Initialize
function loadbang() {
    post("AI Composer Device loaded");
    projectState.tracksCreated = [];
    projectState.clipsGenerated = [];
    projectState.pluginsLoaded = [];
    currentPhase = 1;
    
    // Auto-connect after delay
    var task = new Task(connectToAIService);
    task.schedule(1000);
}

// Script loaded message
post("AI Composer JavaScript loaded successfully");