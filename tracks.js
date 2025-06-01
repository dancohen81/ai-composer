// Functions related to track creation and management

// Consolidated and robust track creation
function createTrackWithName(trackName) {
    try {
        var liveSet = new LiveAPI("live_set");
        
        // STEP 1: Collect all valid track IDs BEFORE creation
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
        
        // STEP 2: Create Track
        post("=== CREATING TRACK ===");
        liveSet.call("create_midi_track", -1);
        
        // STEP 3: Find and name new track after creation
        var attempts = 0;
        var maxAttempts = 5;
        
        function findAndNameNewTrack() {
            attempts++;
            post("=== ATTEMPT " + attempts + " ===");
            
            try {
                var afterCount = liveSet.get("tracks").length;
                post("Track count after: " + afterCount + " (was: " + beforeCount + ")");
                
                // Iterate through all tracks and find the new one
                for (var i = 0; i < afterCount; i++) {
                    try {
                        var track = new LiveAPI("live_set tracks " + i);
                        
                        if (track.id != 0) {
                            // Check if this track existed before
                            var wasExistingTrack = false;
                            for (var j = 0; j < validTracksBefore.length; j++) {
                                if (validTracksBefore[j].id == track.id) {
                                    wasExistingTrack = true;
                                    break;
                                }
                            }
                            
                            if (!wasExistingTrack) {
                                // This is the new track!
                                post("FOUND NEW TRACK at index " + i + " with id " + track.id);
                                
                                try {
                                    var currentName = track.get("name");
                                    post("Current name: '" + currentName + "'");
                                    
                                    track.set("name", trackName);
                                    
                                    var newName = track.get("name");
                                    post("SUCCESS: Track renamed to '" + newName + "'");
                                    
                                    projectState.tracksCreated.push(trackName);
                                    outlet(0, trackName);
                                    return; // Success!
                                    
                                } catch (nameError) {
                                    post("Failed to set name: " + nameError.message);
                                }
                            }
                        }
                    } catch (trackError) {
                        post("Error accessing track " + i + ": " + trackError.message);
                    }
                }
                
                // No new track found - retry
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
        
        // First attempt after 300ms
        var initialTask = new Task(findAndNameNewTrack);
        initialTask.schedule(300);
        
    } catch (e) {
        post("Create track failed: " + e.message);
    }
}

// Convenience functions for track creation
function createDrumTrack(params) {
    var trackName = (params && params.name) ? params.name : "AI Drums";
    post("Creating AI Drums track: " + trackName);
    createTrackWithName(trackName);
}

function createDrums() {
    createDrumTrack({name: "AI Drums"});
}

function createBass() {
    post("Creating AI Bass track");
    createTrackWithName("AI Bass");
}

function createLead() {
    post("Creating AI Lead track");
    createTrackWithName("AI Lead");
}

function createPad() {
    post("Creating AI Pad track");
    createTrackWithName("AI Pad");
}

// BONUS: Function to analyze all tracks
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
