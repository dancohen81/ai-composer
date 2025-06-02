// ===== ORIGINAL FUNKTIONIERENDE TRACK CREATION =====
// Für tracks.js - EXAKT wie vorher, nur Memory separat hinzugefügt

// GLOBALES TRACK MEMORY (neu)
var trackMemory = {
    lastCreated: {
        drums: -1,
        bass: -1,
        lead: -1,
        pad: -1
    }
};

// ORIGINAL FUNKTIONIERENDE FUNKTIONEN (unverändert!)
function createDrums() {
    post("Creating AI Drums track");
    createTrackWithName("AI Drums");  // Original Aufruf!
}

function createBass() {
    post("Creating AI Bass track");
    createTrackWithName("AI Bass");   // Original Aufruf!
}

function createLead() {
    post("Creating AI Lead track");
    createTrackWithName("AI Lead");   // Original Aufruf!
}

function createPad() {
    post("Creating AI Pad track");
    createTrackWithName("AI Pad");    // Original Aufruf!
}

// ORIGINAL FUNKTIONIERENDE createTrackWithName (UNVERÄNDERT!)
function createTrackWithName(trackName) {
    try {
        var liveSet = new LiveAPI("live_set");
        
        // SCHRITT 1: Sammle alle gültigen Track-IDs VOR Erstellung
        post("=== BEFORE CREATING '" + trackName + "' ===");
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
        
        // SCHRITT 3: Nach Erstellung neuen Track finden und benennen
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
                                    
                                    // NEUER TEIL: Memory-Update basierend auf Track-Name
                                    updateTrackMemoryByName(trackName, i);
                                    
                                    projectState.tracksCreated.push(trackName);
                                    outlet(0, trackName);
                                    return; // Erfolgreich!
                                    
                                } catch (nameError) {
                                    post("Failed to set name: " + nameError.message);
                                }
                            }
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

// NEUE HILFSFUNKTION: Memory-Update basierend auf Track-Name
function updateTrackMemoryByName(trackName, trackIndex) {
    var trackType = null;
    
    // Track-Typ aus Name ableiten
    if (trackName.toLowerCase().indexOf("drums") !== -1) trackType = "drums";
    else if (trackName.toLowerCase().indexOf("bass") !== -1) trackType = "bass";
    else if (trackName.toLowerCase().indexOf("lead") !== -1) trackType = "lead";
    else if (trackName.toLowerCase().indexOf("pad") !== -1) trackType = "pad";
    
    if (trackType) {
        trackMemory.lastCreated[trackType] = trackIndex;
        post("MEMORY UPDATED: " + trackType + " -> Track " + trackIndex);
    } else {
        post("Could not determine track type from name: " + trackName);
    }
}

// ORIGINAL createDrumTrack Funktion (für Kompatibilität)
function createDrumTrack(params) {
    var trackName = (params && params.name) ? params.name : "AI Drums";
    createTrackWithName(trackName);
}

// DEBUG FUNKTION
function showTrackMemory() {
    post("=== TRACK MEMORY STATUS ===");
    post("Drums: Track " + trackMemory.lastCreated.drums);
    post("Bass: Track " + trackMemory.lastCreated.bass);  
    post("Lead: Track " + trackMemory.lastCreated.lead);
    post("Pad: Track " + trackMemory.lastCreated.pad);
}

// PATTERNS.JS - MEMORY-AWARE PATTERN CREATION
function createPatternOnTrack(trackName, patternType, clipLength) {
    clipLength = clipLength || 4.0;
    
    try {
        post("=== CREATING " + patternType.toUpperCase() + " PATTERN ===");
        
        // SCHRITT 1: Memory-Track versuchen
        var trackType = null;
        if (trackName.toLowerCase().indexOf("drums") !== -1) trackType = "drums";
        else if (trackName.toLowerCase().indexOf("bass") !== -1) trackType = "bass";
        else if (trackName.toLowerCase().indexOf("lead") !== -1) trackType = "lead";
        else if (trackName.toLowerCase().indexOf("pad") !== -1) trackType = "pad";
        
        if (trackType && trackMemory.lastCreated[trackType] !== -1) {
            var memoryTrackIndex = trackMemory.lastCreated[trackType];
            
            post("Trying MEMORY track for " + trackType + ": Track " + memoryTrackIndex);
            
            try {
                var memoryTrack = new LiveAPI("live_set tracks " + memoryTrackIndex);
                if (memoryTrack.id != 0) {
                    var memoryTrackName = memoryTrack.get("name");
                    post("Memory track confirmed: '" + memoryTrackName + "'");
                    
                    // Pattern auf Memory-Track erstellen
                    createPatternOnSpecificTrack(memoryTrackIndex, patternType, clipLength);
                    return;
                }
            } catch (memoryError) {
                post("Memory track invalid: " + memoryError.message);
            }
        }
        
        // SCHRITT 2: Fallback - normale Suche
        post("Looking for track containing: '" + trackName + "'");
        
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        var foundTrack = false;
        
        for (var i = 0; i < trackCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                if (track.id != 0) {
                    var name = track.get("name");
                    if (name && name.toString().toLowerCase().indexOf(trackName.toLowerCase()) !== -1) {
                        post("FOUND target track: '" + name + "' at index " + i);
                        
                        createPatternOnSpecificTrack(i, patternType, clipLength);
                        foundTrack = true;
                        break;
                    }
                }
            } catch (trackError) {
                post("Error checking track " + i + ": " + trackError.message);
            }
        }
        
        if (!foundTrack) {
            post("ERROR: No track found containing '" + trackName + "'");
            outlet(0, "pattern_error_no_track");
        }
        
    } catch (e) {
        post("Failed to create pattern: " + e.message);
        outlet(0, "pattern_error");
    }
}

// HILFSFUNKTION: Pattern auf spezifischem Track erstellen
function createPatternOnSpecificTrack(trackIndex, patternType, clipLength) {
    try {
        var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0");
        var hasClip = clipSlot.get("has_clip");
        
        var clip;
        
        if (hasClip && hasClip[0] === 1) {
            post("Using existing clip");
            clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0 clip");
            
            // Notes löschen
            try {
                clip.call("select_all_notes");
                clip.call("remove_notes");
                post("Cleared existing notes");
            } catch (clearError) {
                post("Could not clear notes: " + clearError.message);
            }
            
        } else {
            post("Creating new clip");
            clipSlot.call("create_clip", clipLength);
            clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0 clip");
        }
        
        // Pattern generieren
        generatePattern(clip, patternType, clipLength);
        clip.set("name", "AI " + patternType + " Pattern");
        
        post("SUCCESS: Created " + patternType + " pattern");
        outlet(0, "pattern_" + patternType + "_created");
        
    } catch (e) {
        post("Error creating pattern on track " + trackIndex + ": " + e.message);
    }
}