// ===== AI COMPOSER - SIMPLIFIED & WORKING VERSION =====
// Save as: ai-composer.js
// Strategy: Focus on what WORKS, eliminate what breaks

// ===== CORE FUNCTIONS THAT WORK =====

function bang() {
    post("Bang received - AI Composer ready!");
    showQuickStatus();
}

function test() {
    post("=== AI COMPOSER TEST ===");
    try {
        var liveSet = new LiveAPI("live_set");
        var tempo = liveSet.get("tempo");
        post("✓ Live API working - Current tempo: " + tempo);
        
        // Test track creation
        createDrumTrack({name: "Test Track"});
        post("✓ Track creation working");
        
        outlet(0, "test_passed");
    } catch (e) {
        post("✗ Test failed: " + e.message);
        outlet(0, "test_failed");
    }
}

// ===== RELIABLE TRACK CREATION =====

function createTrackWithName(trackName) {
    try {
        var liveSet = new LiveAPI("live_set");
        
        post("=== CREATING: " + trackName + " ===");
        
        // Get REAL tracks before (ignore phantoms)
        var realTracksBefore = getRealTracks();
        post("Real tracks before: " + realTracksBefore.length);
        
        // Create track
        liveSet.call("create_midi_track", -1);
        post("✓ Track creation command sent");
        
        // Schedule naming - find the NEW real track
        var namingTask = new Task(function() {
            try {
                var realTracksAfter = getRealTracks();
                post("Real tracks after: " + realTracksAfter.length);
                
                if (realTracksAfter.length > realTracksBefore.length) {
                    // Find the new track by comparing before/after
                    var newTrack = null;
                    
                    for (var i = 0; i < realTracksAfter.length; i++) {
                        var track = realTracksAfter[i];
                        var wasExisting = false;
                        
                        // Check if this track existed before
                        for (var j = 0; j < realTracksBefore.length; j++) {
                            if (realTracksBefore[j].id === track.id) {
                                wasExisting = true;
                                break;
                            }
                        }
                        
                        if (!wasExisting) {
                            newTrack = track;
                            break;
                        }
                    }
                    
                    if (newTrack) {
                        try {
                            var trackAPI = new LiveAPI("live_set tracks " + newTrack.index);
                            trackAPI.set("name", trackName);
                            
                            post("✓ SUCCESS: '" + trackName + "' created at index " + newTrack.index);
                            post("  Track ID: " + newTrack.id);
                            outlet(0, "track_created", trackName);
                        } catch (e) {
                            post("✗ Naming failed but track created: " + e.message);
                            outlet(0, "track_created", "unnamed");
                        }
                    } else {
                        post("✓ Track created but couldn't identify new track");
                        outlet(0, "track_created", "unnamed");
                    }
                } else {
                    post("✗ No new real track detected");
                }
            } catch (e) {
                post("✗ Post-creation processing failed: " + e.message);
            }
        });
        
        namingTask.schedule(800); // Wait for track to settle
        
    } catch (e) {
        post("✗ Track creation failed: " + e.message);
    }
}

// NEW: Get only REAL tracks (ignore phantoms)
function getRealTracks() {
    var realTracks = [];
    
    try {
        var liveSet = new LiveAPI("live_set");
        var totalCount = liveSet.get("tracks").length;
        
        for (var i = 0; i < totalCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                
                // Only count tracks with valid IDs (not phantoms)
                if (track.id != 0) {
                    realTracks.push({
                        index: i,
                        id: track.id,
                        name: track.get("name")[0] || "Unknown"
                    });
                }
            } catch (e) {
                // Skip phantom/invalid tracks
                continue;
            }
        }
    } catch (e) {
        post("Error getting real tracks: " + e.message);
    }
    
    return realTracks;
}

// ===== WORKING TRACK SHORTCUTS =====

function createDrums() {
    createTrackWithName("AI Drums");
}

function createBass() {
    createTrackWithName("AI Bass");
}

function createLead() {
    createTrackWithName("AI Lead");
}

function createPad() {
    createTrackWithName("AI Pad");
}

function createDrumTrack(params) {
    var name = (params && params.name) ? params.name : "AI Drums";
    createTrackWithName(name);
}

// ===== WORKING TEMPO CONTROL =====

function setTempo(bpm) {
    if (!bpm || bpm < 60 || bpm > 200) {
        post("✗ Invalid BPM: " + bpm);
        return;
    }
    
    try {
        var liveSet = new LiveAPI("live_set");
        var oldTempo = liveSet.get("tempo");
        
        liveSet.set("tempo", bpm);
        
        var newTempo = liveSet.get("tempo");
        post("✓ Tempo: " + oldTempo + " → " + newTempo + " BPM");
        outlet(0, "tempo_set", newTempo);
        
    } catch (e) {
        post("✗ Tempo failed: " + e.message);
    }
}

function setTempo120() { setTempo(120); }
function setTempo128() { setTempo(128); }
function setTempo140() { setTempo(140); }

// ===== SMART PROJECT ANALYSIS =====

function analyzeProject() {
    post("=== PROJECT ANALYSIS (Real Tracks Only) ===");
    
    try {
        var realTracks = getRealTracks();
        post("Analyzing " + realTracks.length + " real tracks...");
        
        var aiTracks = [];
        var readyTracks = [];
        var emptyTracks = [];
        
        for (var i = 0; i < realTracks.length; i++) {
            try {
                var track = realTracks[i];
                var isAI = track.name.indexOf("AI") !== -1;
                
                var trackAPI = new LiveAPI("live_set tracks " + track.index);
                var hasMidi = trackAPI.get("has_midi_input")[0] === 1;
                
                // Simple device count check
                var deviceCount = 0;
                try {
                    deviceCount = trackAPI.get("devices").length;
                } catch (e) {
                    deviceCount = 0;
                }
                
                var trackInfo = {
                    index: track.index,
                    name: track.name,
                    id: track.id,
                    isAI: isAI,
                    hasMidi: hasMidi,
                    deviceCount: deviceCount,
                    ready: deviceCount > 1 // More than just mixer = has instrument
                };
                
                if (isAI) {
                    aiTracks.push(trackInfo);
                    if (trackInfo.ready) {
                        readyTracks.push(trackInfo);
                    } else {
                        emptyTracks.push(trackInfo);
                    }
                }
                
                post("Track " + (i + 1) + ": '" + track.name + "' " + 
                     (isAI ? "[AI]" : "") + 
                     (trackInfo.ready ? "[READY]" : "[EMPTY]") +
                     " (" + deviceCount + " devices, ID: " + track.id + ")");
                
            } catch (e) {
                post("Error analyzing track " + track.name + ": " + e.message);
            }
        }
        
        post("");
        post("=== SUMMARY ===");
        post("Total real tracks: " + realTracks.length);
        post("AI Tracks: " + aiTracks.length);
        post("Ready for patterns: " + readyTracks.length);
        post("Need instruments: " + emptyTracks.length);
        
        // Output status
        outlet(0, "analysis_complete", readyTracks.length, emptyTracks.length);
        
        // Give recommendations
        if (emptyTracks.length > 0) {
            post("");
            post("=== SETUP NEEDED ===");
            for (var j = 0; j < emptyTracks.length; j++) {
                var track = emptyTracks[j];
                post("→ " + track.name + ": Load instrument manually");
            }
            post("Then come back for pattern creation!");
        }
        
        if (readyTracks.length > 0) {
            post("");
            post("=== READY FOR PATTERNS ===");
            for (var k = 0; k < readyTracks.length; k++) {
                var readyTrack = readyTracks[k];
                post("✓ " + readyTrack.name + ": Ready for AI magic!");
            }
        }
        
        return {
            total: aiTracks.length,
            ready: readyTracks.length,
            empty: emptyTracks.length,
            readyTracks: readyTracks,
            emptyTracks: emptyTracks
        };
        
    } catch (e) {
        post("✗ Analysis failed: " + e.message);
        return null;
    }
}

// ===== WORKING PATTERN CREATION =====

function createPatternOnTrack(trackName, patternType, clipLength) {
    clipLength = clipLength || 4.0;
    
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        post("=== CREATING " + patternType.toUpperCase() + " PATTERN ===");
        post("Looking for track: '" + trackName + "'");
        
        // Find track
        for (var i = 0; i < trackCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                if (track.id != 0) {
                    var name = track.get("name")[0] || "";
                    
                    if (name.toLowerCase().indexOf(trackName.toLowerCase()) !== -1) {
                        post("✓ Found: '" + name + "' at index " + i);
                        
                        // Create clip
                        var clipSlot = new LiveAPI("live_set tracks " + i + " clip_slots 0");
                        clipSlot.call("create_clip", clipLength);
                        
                        // Generate pattern after delay
                        var patternTask = new Task(function() {
                            try {
                                var clip = new LiveAPI("live_set tracks " + i + " clip_slots 0 clip");
                                generateSimplePattern(clip, patternType);
                                clip.set("name", "AI " + patternType);
                                post("✓ Pattern created: " + patternType);
                                outlet(0, "pattern_created", patternType);
                            } catch (e) {
                                post("✗ Pattern generation failed: " + e.message);
                            }
                        });
                        
                        patternTask.schedule(300);
                        return;
                    }
                }
            } catch (e) {
                // Skip invalid tracks
            }
        }
        
        post("✗ Track not found: " + trackName);
        
    } catch (e) {
        post("✗ Pattern creation failed: " + e.message);
    }
}

function generateSimplePattern(clip, patternType) {
    // NEW: Use add_new_notes with proper dictionary format
    switch(patternType.toLowerCase()) {
        case "kick":
            // Simple 4/4 kick using add_new_notes
            var kickNotes = {
                "notes": [
                    {"pitch": 36, "start_time": 0.0, "duration": 0.25, "velocity": 100},
                    {"pitch": 36, "start_time": 1.0, "duration": 0.25, "velocity": 100},
                    {"pitch": 36, "start_time": 2.0, "duration": 0.25, "velocity": 100},
                    {"pitch": 36, "start_time": 3.0, "duration": 0.25, "velocity": 100}
                ]
            };
            addNotesToClip(clip, kickNotes, "kick");
            break;
            
        case "bassline":
            // Simple bass line using add_new_notes
            var bassNotes = {
                "notes": [
                    {"pitch": 36, "start_time": 0.0, "duration": 0.5, "velocity": 90},
                    {"pitch": 39, "start_time": 1.0, "duration": 0.5, "velocity": 90},
                    {"pitch": 43, "start_time": 2.0, "duration": 0.5, "velocity": 90},
                    {"pitch": 41, "start_time": 3.0, "duration": 0.5, "velocity": 90}
                ]
            };
            addNotesToClip(clip, bassNotes, "bassline");
            break;
            
        case "melody":
            // Simple melody using add_new_notes
            var melodyNotes = {
                "notes": [
                    {"pitch": 60, "start_time": 0.0, "duration": 0.5, "velocity": 80},
                    {"pitch": 62, "start_time": 0.5, "duration": 0.5, "velocity": 80},
                    {"pitch": 64, "start_time": 1.0, "duration": 0.5, "velocity": 80},
                    {"pitch": 67, "start_time": 2.0, "duration": 1.0, "velocity": 80}
                ]
            };
            addNotesToClip(clip, melodyNotes, "melody");
            break;
            
        case "pad":
            // Simple chord using add_new_notes
            var padNotes = {
                "notes": [
                    // First chord (C major)
                    {"pitch": 48, "start_time": 0.0, "duration": 2.0, "velocity": 70},
                    {"pitch": 52, "start_time": 0.0, "duration": 2.0, "velocity": 70},
                    {"pitch": 55, "start_time": 0.0, "duration": 2.0, "velocity": 70},
                    // Second chord (A minor)
                    {"pitch": 45, "start_time": 2.0, "duration": 2.0, "velocity": 70},
                    {"pitch": 48, "start_time": 2.0, "duration": 2.0, "velocity": 70},
                    {"pitch": 52, "start_time": 2.0, "duration": 2.0, "velocity": 70}
                ]
            };
            addNotesToClip(clip, padNotes, "pad");
            break;
            
        default:
            // Fallback using add_new_notes
            var defaultNotes = {
                "notes": [
                    {"pitch": 60, "start_time": 0.0, "duration": 0.5, "velocity": 80}
                ]
            };
            addNotesToClip(clip, defaultNotes, "default");
    }
}

// NEW: Proper note addition using add_new_notes
function addNotesToClip(clip, notesDict, patternName) {
    try {
        post("  Adding " + notesDict.notes.length + " notes for " + patternName + "...");
        
        // Use add_new_notes with proper dictionary format
        var result = clip.call("add_new_notes", notesDict);
        
        post("  ✓ SUCCESS: " + notesDict.notes.length + " notes added!");
        post("  Note IDs: " + result);
        
        return result;
    } catch (e) {
        post("  ✗ FAILED to add notes: " + e.message);
        post("  Trying fallback method...");
        
        // Fallback: Try the old sequential method if add_new_notes fails
        try {
            for (var i = 0; i < notesDict.notes.length; i++) {
                var note = notesDict.notes[i];
                clip.call("set_notes", note.start_time, note.pitch, note.duration, note.velocity, 0);
            }
            post("  ✓ Fallback successful");
        } catch (fallbackError) {
            post("  ✗ Fallback also failed: " + fallbackError.message);
        }
    }
}

// ===== PATTERN SHORTCUTS =====

function createKickPattern() {
    createPatternOnTrack("drums", "kick", 4.0);
}

function createBassLine() {
    createPatternOnTrack("bass", "bassline", 4.0);
}

function createMelody() {
    createPatternOnTrack("lead", "melody", 4.0);
}

function createPadChords() {
    createPatternOnTrack("pad", "pad", 4.0);
}

// ===== UTILITY FUNCTIONS =====

function showQuickStatus() {
    post("=== AI COMPOSER STATUS ===");
    try {
        var liveSet = new LiveAPI("live_set");
        var tempo = liveSet.get("tempo")[0];
        var realTracks = getRealTracks();
        var totalCount = liveSet.get("tracks").length;
        
        post("Live Set: " + realTracks.length + " real tracks (" + totalCount + " total), " + tempo + " BPM");
        post("Phantoms: " + (totalCount - realTracks.length) + " (ignored)");
        post("Ready for: Track creation, Tempo control, Pattern generation");
        outlet(0, "status", realTracks.length, tempo);
    } catch (e) {
        post("Status check failed: " + e.message);
    }
}

function quickSetup() {
    post("=== QUICK SETUP ===");
    post("Creating basic AI tracks...");
    
    createDrums();
    
    var bassTask = new Task(function() { createBass(); });
    bassTask.schedule(1000);
    
    var leadTask = new Task(function() { createLead(); });
    leadTask.schedule(2000);
    
    var padTask = new Task(function() { createPad(); });
    padTask.schedule(3000);
    
    var statusTask = new Task(function() {
        post("✓ Quick setup complete!");
        post("→ Now load instruments on AI tracks manually");
        post("→ Then create patterns!");
    });
    statusTask.schedule(4000);
}

// ===== MESSAGE HANDLERS =====

function msg_int(value) {
    if (value === 1) {
        showQuickStatus();
    } else if (value >= 60 && value <= 200) {
        setTempo(value);
    }
}

function status() {
    showQuickStatus();
}

function setup() {
    quickSetup();
}

function analyze() {
    analyzeProject();
}

function listTracks() {
    post("=== CURRENT TRACKS (Real Only) ===");
    try {
        var realTracks = getRealTracks();
        var liveSet = new LiveAPI("live_set");
        var totalCount = liveSet.get("tracks").length;
        
        post("Total count (including phantoms): " + totalCount);
        post("Real tracks: " + realTracks.length);
        post("");
        
        for (var i = 0; i < realTracks.length; i++) {
            var track = realTracks[i];
            var deviceCount = 0;
            
            try {
                var trackAPI = new LiveAPI("live_set tracks " + track.index);
                deviceCount = trackAPI.get("devices").length;
            } catch (e) {
                deviceCount = 0;
            }
            
            post("Real Track " + (i + 1) + ": '" + track.name + "' (Index: " + track.index + ", ID: " + track.id + ", " + deviceCount + " devices)");
        }
        
        post("");
        post("Phantom tracks: " + (totalCount - realTracks.length) + " (ignored)");
        outlet(0, "track_list", realTracks.length);
    } catch (e) {
        post("✗ Track listing failed: " + e.message);
    }
}