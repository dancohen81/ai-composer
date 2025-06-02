// ===== INTELLIGENTES TRACK & PATTERN MANAGEMENT =====
// Für patterns.js - löst Multi-Track und Clip-Detection Probleme

// GLOBAL: Track-Memory für AI System
var trackMemory = {
    lastCreatedTracks: {},  // {drums: trackIndex, bass: trackIndex, ...}
    trackCreationOrder: [], // [trackIndex1, trackIndex2, ...]
    tracksByType: {}        // {drums: [index1, index2], bass: [index3], ...}
};

// HAUPTFUNKTION: Intelligente Track-Auswahl für Patterns
function createPatternOnTrackSmart(trackName, patternType, clipLength) {
    clipLength = clipLength || 4.0;
    
    try {
        post("=== SMART " + patternType.toUpperCase() + " PATTERN CREATION ===");
        
        // SCHRITT 1: Alle passenden Tracks finden
        var matchingTracks = findMatchingTracks(trackName);
        
        if (matchingTracks.length === 0) {
            post("ERROR: No tracks found containing '" + trackName + "'");
            listAllTracks(); // Debug helper
            outlet(0, "pattern_error_no_track");
            return;
        }
        
        // SCHRITT 2: Besten Track intelligent auswählen
        var selectedTrack = selectBestTrack(matchingTracks, trackName, patternType);
        
        if (!selectedTrack) {
            post("ERROR: Could not select appropriate track");
            return;
        }
        
        post("SELECTED: Track " + selectedTrack.index + " ('" + selectedTrack.name + "') - Reason: " + selectedTrack.reason);
        
        // SCHRITT 3: Clip intelligent behandeln
        var clip = handleClipIntelligent(selectedTrack.index, clipLength, patternType);
        
        if (!clip) {
            post("ERROR: Could not create/access clip");
            return;
        }
        
        // SCHRITT 4: Pattern generieren
        generatePattern(clip, patternType, clipLength);
        
        try {
            clip.set("name", "AI " + patternType + " v" + getPatternVersion(selectedTrack.index));
        } catch (nameError) {
            post("Could not set clip name: " + nameError.message);
        }
        
        post("SUCCESS: Created " + patternType + " pattern on track '" + selectedTrack.name + "'");
        outlet(0, "pattern_" + patternType + "_created");
        
    } catch (e) {
        post("Smart pattern creation failed: " + e.message);
        outlet(0, "pattern_error");
    }
}

// HILFSFUNKTION: Alle passenden Tracks finden
function findMatchingTracks(trackName) {
    var liveSet = new LiveAPI("live_set");
    var trackCount = liveSet.get("tracks").length;
    var matchingTracks = [];
    
    post("Searching for tracks containing: '" + trackName + "'");
    
    for (var i = 0; i < trackCount; i++) {
        try {
            var track = new LiveAPI("live_set tracks " + i);
            if (track.id != 0) {
                var name = track.get("name");
                if (name && name.toString().toLowerCase().indexOf(trackName.toLowerCase()) !== -1) {
                    
                    // Track-Info sammeln
                    var trackInfo = {
                        index: i,
                        name: name.toString(),
                        id: track.id,
                        creationTime: getTrackCreationTime(i),
                        hasClips: countClipsInTrack(i),
                        isEmpty: isTrackEmpty(i)
                    };
                    
                    matchingTracks.push(trackInfo);
                    post("Found match: Track " + i + " ('" + name + "') - Clips: " + trackInfo.hasClips + ", Empty: " + trackInfo.isEmpty);
                }
            }
        } catch (trackError) {
            post("Error checking track " + i + ": " + trackError.message);
        }
    }
    
    post("Found " + matchingTracks.length + " matching tracks");
    return matchingTracks;
}

// INTELLIGENTE TRACK-AUSWAHL
function selectBestTrack(matchingTracks, trackName, patternType) {
    if (matchingTracks.length === 1) {
        matchingTracks[0].reason = "Only track available";
        return matchingTracks[0];
    }
    
    // PRIORITÄTS-SYSTEM für Track-Auswahl
    
    // 1. HÖCHSTE PRIORITÄT: Zuletzt erstellter Track dieses Typs
    var trackType = trackName.toLowerCase();
    if (trackMemory.lastCreatedTracks[trackType] !== undefined) {
        var lastCreatedIndex = trackMemory.lastCreatedTracks[trackType];
        for (var i = 0; i < matchingTracks.length; i++) {
            if (matchingTracks[i].index === lastCreatedIndex) {
                matchingTracks[i].reason = "Last created " + trackType + " track";
                post("PRIORITY 1: Using last created " + trackType + " track");
                return matchingTracks[i];
            }
        }
    }
    
    // 2. HOHE PRIORITÄT: Leere Tracks (keine Clips)
    var emptyTracks = matchingTracks.filter(function(t) { return t.isEmpty; });
    if (emptyTracks.length > 0) {
        // Neuesten leeren Track nehmen
        var newestEmpty = emptyTracks.reduce(function(prev, current) {
            return (current.creationTime > prev.creationTime) ? current : prev;
        });
        newestEmpty.reason = "Newest empty track";
        post("PRIORITY 2: Using newest empty track");
        return newestEmpty;
    }
    
    // 3. MITTLERE PRIORITÄT: Track mit wenigsten Clips
    var trackWithFewestClips = matchingTracks.reduce(function(prev, current) {
        return (current.hasClips < prev.hasClips) ? current : prev;
    });
    
    // 4. NIEDRIGE PRIORITÄT: Neuester Track (höchster Index)
    var newestTrack = matchingTracks.reduce(function(prev, current) {
        return (current.index > prev.index) ? current : prev;
    });
    
    if (trackWithFewestClips.hasClips < 3) {
        trackWithFewestClips.reason = "Fewest clips (" + trackWithFewestClips.hasClips + ")";
        post("PRIORITY 3: Using track with fewest clips");
        return trackWithFewestClips;
    } else {
        newestTrack.reason = "Newest track (highest index)";
        post("PRIORITY 4: Using newest track");
        return newestTrack;
    }
}

// INTELLIGENTE CLIP-BEHANDLUNG
function handleClipIntelligent(trackIndex, clipLength, patternType) {
    try {
        var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0");
        var hasClip = clipSlot.get("has_clip");
        
        if (hasClip && hasClip[0] === 1) {
            post("Clip exists in slot 0 - checking for alternative or updating...");
            
            // OPTION 1: Leeren Slot finden (Slots 0-7 checken)
            var emptySlot = findEmptyClipSlot(trackIndex);
            if (emptySlot !== -1 && emptySlot <= 3) { // Nur erste 4 Slots verwenden
                post("Using empty slot " + emptySlot + " instead");
                var newClipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + emptySlot);
                newClipSlot.call("create_clip", clipLength);
                return new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + emptySlot + " clip");
            }
            
            // OPTION 2: Bestehenden Clip updaten
            post("No empty slots found - updating existing clip in slot 0");
            var existingClip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0 clip");
            
            // Notes intelligent löschen
            clearClipNotes(existingClip);
            
            return existingClip;
            
        } else {
            // OPTION 3: Neuen Clip erstellen
            post("Creating new clip in empty slot 0");
            clipSlot.call("create_clip", clipLength);
            return new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0 clip");
        }
        
    } catch (e) {
        post("Error handling clip: " + e.message);
        return null;
    }
}

// HILFSFUNKTIONEN

function countClipsInTrack(trackIndex) {
    var clipCount = 0;
    try {
        for (var i = 0; i < 8; i++) { // Check first 8 clip slots
            var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + i);
            var hasClip = clipSlot.get("has_clip");
            if (hasClip && hasClip[0] === 1) {
                clipCount++;
            }
        }
    } catch (e) {
        // Ignore errors
    }
    return clipCount;
}

function isTrackEmpty(trackIndex) {
    return countClipsInTrack(trackIndex) === 0;
}

function findEmptyClipSlot(trackIndex) {
    try {
        for (var i = 0; i < 8; i++) {
            var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots " + i);
            var hasClip = clipSlot.get("has_clip");
            if (!hasClip || hasClip[0] === 0) {
                return i;
            }
        }
    } catch (e) {
        post("Error finding empty clip slot: " + e.message);
    }
    return -1;
}

function getTrackCreationTime(trackIndex) {
    // Approximation: Track-Index als Creation-Time verwenden
    return trackIndex;
}

function getPatternVersion(trackIndex) {
    // Einfache Versionierung basierend auf Clip-Anzahl
    return countClipsInTrack(trackIndex) + 1;
}

function clearClipNotes(clip) {
    try {
        post("Clearing notes from existing clip...");
        
        // Live 12 moderne Methode
        try {
            var allNotes = clip.call("get_notes_extended", 0, 0, 0, 128);
            if (allNotes && allNotes.notes && allNotes.notes.length > 0) {
                clip.call("remove_notes_extended", {notes: allNotes.notes});
                post("Cleared " + allNotes.notes.length + " notes (Live 12 API)");
            }
        } catch (modernError) {
            // Fallback zu Legacy
            clip.call("select_all_notes");
            clip.call("remove_notes");
            post("Cleared notes (Legacy API)");
        }
        
    } catch (e) {
        post("Could not clear clip notes: " + e.message);
    }
}

function listAllTracks() {
    post("=== ALL TRACKS DEBUG ===");
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        for (var i = 0; i < trackCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                if (track.id != 0) {
                    var name = track.get("name");
                    var clipCount = countClipsInTrack(i);
                    post("Track " + i + ": '" + name + "' (Clips: " + clipCount + ")");
                }
            } catch (e) {
                post("Track " + i + ": [error]");
            }
        }
    } catch (e) {
        post("Could not list tracks: " + e.message);
    }
}

// TRACK MEMORY MANAGEMENT
function updateTrackMemory(trackType, trackIndex) {
    trackMemory.lastCreatedTracks[trackType] = trackIndex;
    
    if (trackMemory.tracksByType[trackType]) {
        trackMemory.tracksByType[trackType].push(trackIndex);
    } else {
        trackMemory.tracksByType[trackType] = [trackIndex];
    }
    
    trackMemory.trackCreationOrder.push(trackIndex);
    
    post("Updated track memory: " + trackType + " -> Track " + trackIndex);
}

// ERSETZE BESTEHENDE FUNKTION
function createPatternOnTrack(trackName, patternType, clipLength) {
    createPatternOnTrackSmart(trackName, patternType, clipLength);
}
// ALTERNATIVE: Clip explizit ersetzen
function createPatternOnTrackReplace(trackName, patternType, clipLength) {
    clipLength = clipLength || 4.0;
    
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        var foundTrack = false;
        
        post("=== REPLACING " + patternType.toUpperCase() + " PATTERN ===");
        
        for (var i = 0; i < trackCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                if (track.id != 0) {
                    var name = track.get("name");
                    if (name && name.toString().toLowerCase().indexOf(trackName.toLowerCase()) !== -1) {
                        post("FOUND target track: '" + name + "' at index " + i);
                        
                        var clipSlot = new LiveAPI("live_set tracks " + i + " clip_slots 0");
                        
                        // SCHRITT 1: Bestehenden Clip löschen (falls vorhanden)
                        try {
                            var hasClip = clipSlot.get("has_clip");
                            if (hasClip && hasClip[0] === 1) {
                                post("Deleting existing clip");
                                clipSlot.call("delete_clip");
                            }
                        } catch (deleteError) {
                            post("Could not delete existing clip: " + deleteError.message);
                        }
                        
                        // SCHRITT 2: Neuen Clip erstellen
                        post("Creating new clip");
                        clipSlot.call("create_clip", clipLength);
                        var clip = new LiveAPI("live_set tracks " + i + " clip_slots 0 clip");
                        
                        // Pattern generieren
                        generatePattern(clip, patternType, clipLength);
                        clip.set("name", "AI " + patternType + " Pattern");
                        
                        post("SUCCESS: Replaced " + patternType + " pattern on track '" + name + "'");
                        outlet(0, "pattern_" + patternType + "_replaced");
                        foundTrack = true;
                        break;
                    }
                }
            } catch (trackError) {
                post("Error processing track " + i + ": " + trackError.message);
            }
        }
        
        if (!foundTrack) {
            post("ERROR: No track found containing '" + trackName + "'");
        }
        
    } catch (e) {
        post("Failed to replace pattern: " + e.message);
    }
}

// USER-FREUNDLICHE VERSION: Fragt den User
function createPatternOnTrackSmart(trackName, patternType, clipLength) {
    clipLength = clipLength || 4.0;
    
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        for (var i = 0; i < trackCount; i++) {
            var track = new LiveAPI("live_set tracks " + i);
            if (track.id != 0) {
                var name = track.get("name");
                if (name && name.toString().toLowerCase().indexOf(trackName.toLowerCase()) !== -1) {
                    
                    var clipSlot = new LiveAPI("live_set tracks " + i + " clip_slots 0");
                    var hasClip = clipSlot.get("has_clip");
                    
                    if (hasClip && hasClip[0] === 1) {
                        // Clip existiert bereits - verschiedene Optionen
                        post("Clip already exists on track '" + name + "'");
                        post("Options: 1) Overwrite notes, 2) Replace clip, 3) Use slot 1");
                        
                        // STANDARD: Notes überschreiben (einfachste Option)
                        post("Using option 1: Overwriting notes in existing clip");
                        var clip = new LiveAPI("live_set tracks " + i + " clip_slots 0 clip");
                        
                        // Alle Notes löschen
                        try {
                            clip.call("select_all_notes");
                            clip.call("remove_notes");
                            post("Cleared existing notes");
                        } catch (e) {
                            post("Could not clear notes: " + e.message);
                        }
                        
                        // Neue Notes setzen
                        generatePattern(clip, patternType, clipLength);
                        clip.set("name", "AI " + patternType + " Pattern v2");
                        
                        post("SUCCESS: Updated existing clip with new " + patternType + " pattern");
                        outlet(0, "pattern_" + patternType + "_updated");
                        
                    } else {
                        // Kein Clip - normal erstellen
                        clipSlot.call("create_clip", clipLength);
                        var clip = new LiveAPI("live_set tracks " + i + " clip_slots 0 clip");
                        generatePattern(clip, patternType, clipLength);
                        clip.set("name", "AI " + patternType + " Pattern");
                        
                        post("SUCCESS: Created new " + patternType + " pattern");
                        outlet(0, "pattern_" + patternType + "_created");
                    }
                    
                    return; // Fertig
                }
            }
        }
        
        post("ERROR: No track found containing '" + trackName + "'");
        
    } catch (e) {
        post("Failed to create/update pattern: " + e.message);
    }
}

// PATTERN GENERATOR: Different pattern types
function generatePattern(clip, patternType, clipLength) {
    try {
        switch(patternType.toLowerCase()) {
            case "kick":
                generateKickPattern(clip, clipLength);
                break;
            case "bassline":
                generateBassLinePattern(clip, clipLength);
                break;
            case "melody":
                generateMelodyPattern(clip, clipLength);
                break;
            case "pad":
                generatePadPattern(clip, clipLength);
                break;
            case "hihat":
                generateHiHatPattern(clip, clipLength);
                break;
            default:
                post("Unknown pattern type: " + patternType);
                generateBasicPattern(clip, clipLength);
        }
    } catch (e) {
        post("Pattern generation failed: " + e.message);
    }
}

// KORRIGIERTE KICK PATTERN
function generateKickPattern(clip, clipLength) {
    post("Generating kick pattern...");
    
    var kickNote = 36; // C1 = Standard Kick
    var velocity = 100;
    var noteLength = 0.25;
    
    // Note-Liste vorbereiten
    var noteList = [
        {time: 0.0, pitch: kickNote, length: noteLength, velocity: velocity},      // Beat 1
        {time: 2.0, pitch: kickNote, length: noteLength, velocity: velocity},      // Beat 3
        {time: 1.75, pitch: kickNote, length: noteLength, velocity: velocity - 20}, // Synkope
        {time: 3.5, pitch: kickNote, length: noteLength, velocity: velocity - 10}   // Lead-in
    ];
    
    setNotesCorrectly(clip, noteList);
    post("Kick pattern generated: 4/4 groove with syncopation - FIX ATTEMPT 3");
}

// KORRIGIERTE BASSLINE PATTERN
function generateBassLinePattern(clip, clipLength) {
    post("Generating bassline pattern...");
    
    // Bass Notes in C minor pentatonic (C-Eb-F-G-Bb)
    var bassNotes = [36, 39, 41, 43, 46]; // C1-Eb1-F1-G1-Bb1
    var velocity = 85;
    var noteLength = 0.5;
    
    // Note-Liste vorbereiten
    var noteList = [
        {time: 0.0, pitch: bassNotes[0], length: noteLength, velocity: velocity},        // C
        {time: 0.75, pitch: bassNotes[2], length: 0.25, velocity: velocity - 10},       // F (short)
        {time: 1.5, pitch: bassNotes[3], length: noteLength, velocity: velocity - 5},   // G
        {time: 2.5, pitch: bassNotes[1], length: noteLength, velocity: velocity},       // Eb
        {time: 3.25, pitch: bassNotes[3], length: 0.25, velocity: velocity - 15}        // G (short)
    ];
    
    setNotesCorrectly(clip, noteList);
    post("Bassline pattern generated: C minor pentatonic groove");
}

// KORRIGIERTE MELODY PATTERN
function generateMelodyPattern(clip, clipLength) {
    post("Generating melody pattern...");
    
    var velocity = 90;
    
    // Note-Liste vorbereiten
    var noteList = [
        {time: 0.0, pitch: 67, length: 0.5, velocity: velocity},      // G4
        {time: 0.5, pitch: 69, length: 0.25, velocity: velocity - 10}, // A4
        {time: 1.0, pitch: 72, length: 0.75, velocity: velocity + 10}, // C5 (emphasis)
        {time: 2.0, pitch: 69, length: 0.5, velocity: velocity},       // A4
        {time: 2.75, pitch: 67, length: 0.25, velocity: velocity - 5}, // G4
        {time: 3.25, pitch: 65, length: 0.75, velocity: velocity}      // F4
    ];
    
    setNotesCorrectly(clip, noteList);
    post("Melody pattern generated: Catchy C major lead");
}

// KORRIGIERTE PAD PATTERN
function generatePadPattern(clip, clipLength) {
    post("Generating pad pattern...");
    
    var velocity = 70; // Leiser für Pad
    var noteLength = 1.0; // Lange Notes
    
    // Chord progression: Cm - Ab - Bb - Gm
    var noteList = [
        // Cm chord (C-Eb-G)
        {time: 0.0, pitch: 48, length: noteLength, velocity: velocity}, // C
        {time: 0.0, pitch: 51, length: noteLength, velocity: velocity}, // Eb
        {time: 0.0, pitch: 55, length: noteLength, velocity: velocity}, // G
        
        // Ab chord (Ab-C-Eb)
        {time: 1.0, pitch: 44, length: noteLength, velocity: velocity}, // Ab
        {time: 1.0, pitch: 48, length: noteLength, velocity: velocity}, // C
        {time: 1.0, pitch: 51, length: noteLength, velocity: velocity}, // Eb
        
        // Bb chord (Bb-D-F)
        {time: 2.0, pitch: 46, length: noteLength, velocity: velocity}, // Bb
        {time: 2.0, pitch: 50, length: noteLength, velocity: velocity}, // D
        {time: 2.0, pitch: 53, length: noteLength, velocity: velocity}, // F
        
        // Gm chord (G-Bb-D)
        {time: 3.0, pitch: 43, length: noteLength, velocity: velocity}, // G
        {time: 3.0, pitch: 46, length: noteLength, velocity: velocity}, // Bb
        {time: 3.0, pitch: 50, length: noteLength, velocity: velocity}  // D
    ];
    
    setNotesCorrectly(clip, noteList);
    post("Pad pattern generated: Cm-Ab-Bb-Gm progression");
}

// KORRIGIERTE HIHAT PATTERN
function generateHiHatPattern(clip, clipLength) {
    post("Generating hi-hat pattern...");
    
    var hihatNote = 42; // Closed hi-hat
    var openHihatNote = 46; // Open hi-hat
    var baseVelocity = 60;
    var noteLength = 0.125; // 16th notes
    
    var noteList = [];
    
    // 16th note pattern mit Accents vorbereiten
    for (var beat = 0; beat < clipLength * 4; beat++) { // 16th notes
        var time = beat * 0.25;
        var velocity = baseVelocity;
        var note = hihatNote;
        
        // Accent pattern
        if (beat % 4 === 0) velocity += 20;    // Downbeat accent
        if (beat % 8 === 6) {                  // Open hi-hat on off-beat
            note = openHihatNote;
            velocity += 10;
        }
        
        noteList.push({
            time: time,
            pitch: note,
            length: noteLength,
            velocity: velocity
        });
    }
    
    setNotesCorrectly(clip, noteList);
    post("Hi-hat pattern generated: 16th note groove with accents (" + noteList.length + " notes)");
}
// FALLBACK: Basic Pattern
function generateBasicPattern(clip, clipLength) {
    post("Generating basic pattern...");
    
    var note = 60; // Middle C
    var velocity = 80;
    var noteLength = 0.5;
    
    for (var i = 0; i < clipLength; i++) {
        clip.call("set_notes", i, note + (i % 4), noteLength, velocity, 0);
    }
    
    post("Basic pattern generated");
}

// CONVENIENCE FUNCTIONS for M4L Buttons
function createKickPattern() {
    post("Creating kick pattern on drums track...");
    createPatternOnTrack("drums", "kick", 4.0);
}

function createBassLine() {
    post("Creating bassline on bass track...");
    createPatternOnTrack("bass", "bassline", 4.0);
}

function createMelody() {
    post("Creating melody on lead track...");
    createPatternOnTrack("lead", "melody", 4.0);
}

function createPadChords() {
    post("Creating pad chords on pad track...");
    createPatternOnTrack("pad", "pad", 4.0);
}

function createHiHats() {
    post("Creating hi-hats on drums track...");
    createPatternOnTrack("drums", "hihat", 4.0);
}

// AI-FRIENDLY: Flexible Pattern Creation
function createPatternAI(trackType, patternType, length) {
    length = length || 4.0;
    post("AI creating " + patternType + " pattern on " + trackType + " track (" + length + " bars)");
    createPatternOnTrack(trackType, patternType, length);
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
        // ... (rest of your auto-arrange logic)
    } catch (e) {
        post("Auto-arrange failed: " + e.message);
    }
}<environment_details>
# VSCode Visible Files
ai-composer.js

# VSCode Open Tabs
patterns.js
utils.js
mixing.js
tracks.js
tempo.js
ai-composer.js

# Current Time
6/1/2025, 9:15:19 PM (Europe/Zurich, UTC+2:00)

# Context Window Usage
117,498 / 1,048.576K tokens used (11%)

# Current Mode
ACT MODE
</environment_details>
