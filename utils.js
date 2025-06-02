// General utility functions

// Helper function to set notes sequentially with a delay
// This is crucial for preventing "jsliveapi: an operation is already in progress" errors
function setNotesSequentially(clip, noteList, delayMs) {
    delayMs = delayMs || 50; // Default delay of 50ms per note
    var notesToSet = noteList.slice(); // Create a copy to modify

    function setNextNote() {
        if (notesToSet.length > 0) {
            var note = notesToSet.shift(); // Get the first note and remove it
            try {
                // The set_notes method expects: time, pitch, length, velocity, mute
                clip.call("set_notes", note.time, note.pitch, note.length, note.velocity, 0);
                // post("Set note: time=" + note.time + ", pitch=" + note.pitch); // Uncomment for detailed debugging
            } catch (e) {
                post("Error setting note: " + e.message);
            }

            // Schedule the next note
            var nextNoteTask = new Task(setNextNote);
            nextNoteTask.schedule(delayMs);
        } else {
            post("All notes set for clip.");
        }
    }

    // Start setting notes
    if (noteList.length > 0) {
        setNextNote();
    } else {
        post("No notes to set.");
    }
}

// ===== UTILS.JS - KORRIGIERTE SET_NOTES FUNKTION =====

// KORREKTE SEQUENZIELLE NOTE-SETZUNG
function setNotesCorrectly(clip, noteList) {
    if (!noteList || noteList.length === 0) {
        post("No notes to set");
        return;
    }
    
    post("Setting " + noteList.length + " notes using correct Live API syntax...");
    
    var messageIndex = 0;
    var messages = [];
    
    // SCHRITT 1: Nachrichten-Sequenz vorbereiten (KORRIGIERT!)
    messages.push({type: "simple", message: "set_notes"});                    // Start der Operation
    messages.push({type: "params", message: "notes", params: [noteList.length]});  // Anzahl der Notes
    
    // SCHRITT 2: Alle Notes zur Sequenz hinzufügen
    for (var i = 0; i < noteList.length; i++) {
        var note = noteList[i];
        // Format: note [pitch] [time] [duration] [velocity] [is_muted]
        messages.push({
            type: "params", 
            message: "note", 
            params: [note.pitch, note.time, note.length, note.velocity, 0]
        });
    }
    
    messages.push({type: "simple", message: "done"});  // Ende der Operation
    
    post("Prepared " + messages.length + " messages for Live API");
    
    // SCHRITT 3: Nachrichten sequenziell senden
    function sendNextMessage() {
        if (messageIndex < messages.length) {
            var msg = messages[messageIndex];
            
            try {
                if (msg.type === "simple") {
                    post("Sending message " + (messageIndex + 1) + "/" + messages.length + ": call " + msg.message);
                    clip.call(msg.message);
                } else if (msg.type === "params") {
                    post("Sending message " + (messageIndex + 1) + "/" + messages.length + ": call " + msg.message + " with " + msg.params.length + " params");
                    // Parameter separat übergeben (WICHTIG!)
                    clip.call.apply(clip, [msg.message].concat(msg.params));
                }
                
                messageIndex++;
                
                // Nächste Nachricht nach Delay
                if (messageIndex < messages.length) {
                    var task = new Task(sendNextMessage);
                    task.schedule(50); // 50ms zwischen Nachrichten
                } else {
                    post("SUCCESS: All " + noteList.length + " notes set!");
                }
                
            } catch (e) {
                post("ERROR sending message " + (messageIndex + 1) + ": " + e.message);
                messageIndex++;
                
                // Trotzdem weitermachen
                if (messageIndex < messages.length) {
                    var task = new Task(sendNextMessage);
                    task.schedule(50);
                }
            }
        }
    }
    
    // Ersten Message nach kurzem Delay senden
    var initialTask = new Task(sendNextMessage);
    initialTask.schedule(100);
}

// ===== KORREKTE LIVE API SYNTAX - STRING PARAMETER =====
// Für utils.js - ersetze setNotesCorrectlySimple()

function setNotesCorrectlyString(clip, noteList) {
    if (!noteList || noteList.length === 0) {
        post("No notes to set");
        return;
    }
    
    post("Using legacy string API for " + noteList.length + " notes...");
    
    var messageIndex = 0;
    var totalMessages = 3 + noteList.length;
    
    function sendNextMessage() {
        try {
            if (messageIndex === 0) {
                post("Legacy API: call set_notes");
                clip.call("set_notes");
                
            } else if (messageIndex === 1) {
                var notesCommand = "notes " + noteList.length;
                post("Legacy API: call '" + notesCommand + "'");
                clip.call(notesCommand);
                
            } else if (messageIndex >= 2 && messageIndex < 2 + noteList.length) {
                var noteIdx = messageIndex - 2;
                var note = noteList[noteIdx];
                var noteCommand = "note " + note.pitch + " " + note.time + " " + note.length + " " + note.velocity + " 0";
                post("Legacy API: call '" + noteCommand + "'");
                clip.call(noteCommand);
                
            } else if (messageIndex === 2 + noteList.length) {
                post("Legacy API: call done");
                clip.call("done");
                post("SUCCESS: All notes set with legacy API!");
                return;
            }
            
            messageIndex++;
            
            var task = new Task(sendNextMessage);
            task.schedule(50);
            
        } catch (e) {
            post("Legacy API error at message " + (messageIndex + 1) + ": " + e.message);
            messageIndex++;
            if (messageIndex < totalMessages) {
                var task = new Task(sendNextMessage);
                task.schedule(50);
            }
        }
    }
    
    var initialTask = new Task(sendNextMessage);
    initialTask.schedule(100);
}

// BONUS: Clip-Handling für bestehende Clips
function createOrUpdateClip(trackIndex, clipLength, patternType) {
    try {
        var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0");
        var hasClip = clipSlot.get("has_clip");
        
        var clip;
        
        if (hasClip && hasClip[0] === 1) {
            // Bestehenden Clip verwenden
            post("Using existing clip");
            clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0 clip");
            
            // Notes löschen (falls möglich)
            try {
                clip.call("select_all_notes");
                clip.call("remove_notes");
                post("Cleared existing notes");
            } catch (clearError) {
                post("Could not clear notes: " + clearError.message);
            }
            
        } else {
            // Neuen Clip erstellen
            post("Creating new clip");
            clipSlot.call("create_clip", clipLength);
            clip = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0 clip");
        }
        
        return clip;
        
    } catch (e) {
        post("Error creating/updating clip: " + e.message);
        return null;
    }
}

// ALTERNATIVE: Einfachere Variante ohne apply()


// ===== VOLLSTÄNDIGE LIVE 12 NOTES API =====
// Für utils.js - komplett moderne Implementierung

function setNotesLive12(clip, noteList) {
    if (!noteList || noteList.length === 0) {
        post("No notes to set");
        return;
    }
    
    post("=== LIVE 12 MODERN API ===");
    post("Setting " + noteList.length + " notes using Live 12 native API...");
    
    try {
        // SCHRITT 1: Bestehende Notes löschen (Live 12 Syntax)
        try {
            // Moderne Methode: remove_notes_extended
            post("Clearing existing notes with Live 12 API...");
            var allNotes = clip.call("get_notes_extended", 0, 0, 0, 128); // Alle Notes holen
            if (allNotes && allNotes.notes && allNotes.notes.length > 0) {
                clip.call("remove_notes_extended", {notes: allNotes.notes});
                post("Cleared " + allNotes.notes.length + " existing notes");
            } else {
                post("No existing notes to clear");
            }
        } catch (clearError) {
            post("Modern clear failed, trying legacy: " + clearError.message);
            try {
                clip.call("select_all_notes");
                clip.call("remove_notes");
            } catch (legacyClearError) {
                post("Legacy clear also failed: " + legacyClearError.message);
            }
        }
        
        // SCHRITT 2: Notes im Live 12 Format vorbereiten
        var notesData = {
            notes: []
        };
        
        for (var i = 0; i < noteList.length; i++) {
            var note = noteList[i];
            notesData.notes.push({
                pitch: note.pitch,
                time: note.time,
                duration: note.length,
                velocity: note.velocity,
                mute: false
            });
        }
        
        post("Prepared " + notesData.notes.length + " notes in Live 12 format");
        
        // SCHRITT 3: Notes mit moderner API setzen
        try {
            post("Adding notes with add_new_notes...");
            clip.call("add_new_notes", notesData);
            post("SUCCESS: Notes added with Live 12 add_new_notes API!");
            
        } catch (addError) {
            post("add_new_notes failed: " + addError.message);
            post("Trying apply_note_modifications...");
            
            try {
                clip.call("apply_note_modifications", notesData);
                post("SUCCESS: Notes added with apply_note_modifications API!");
                
            } catch (applyError) {
                post("apply_note_modifications failed: " + applyError.message);
                post("Falling back to legacy set_notes...");
                setNotesLegacy(clip, noteList);
            }
        }
        
    } catch (e) {
        post("Live 12 API completely failed: " + e.message);
        post("Using legacy fallback...");
        setNotesLegacy(clip, noteList);
    }
}

// LEGACY FALLBACK (nur wenn Live 12 API nicht funktioniert)
function setNotesLegacy(clip, noteList) {
    post("Using legacy API for compatibility...");
    
    var messageIndex = 0;
    var totalMessages = 3 + noteList.length;
    
    function sendNextMessage() {
        try {
            if (messageIndex === 0) {
                clip.call("set_notes");
            } else if (messageIndex === 1) {
                clip.call("notes " + noteList.length);
            } else if (messageIndex >= 2 && messageIndex < 2 + noteList.length) {
                var noteIdx = messageIndex - 2;
                var note = noteList[noteIdx];
                clip.call("note " + note.pitch + " " + note.time + " " + note.length + " " + note.velocity + " 0");
            } else if (messageIndex === 2 + noteList.length) {
                clip.call("done");
                post("SUCCESS: Legacy API completed");
                return;
            }
            
            messageIndex++;
            var task = new Task(sendNextMessage);
            task.schedule(30);
            
        } catch (e) {
            post("Legacy error: " + e.message);
            messageIndex++;
            if (messageIndex < totalMessages) {
                var task = new Task(sendNextMessage);
                task.schedule(30);
            }
        }
    }
    
    var initialTask = new Task(sendNextMessage);
    initialTask.schedule(50);
}

// BONUS: Erweiterte Live 12 Features
function setNotesWithVelocityCurve(clip, noteList, velocityCurve) {
    // Velocity Curve: "linear", "exponential", "logarithmic"
    velocityCurve = velocityCurve || "linear";
    
    post("Setting notes with " + velocityCurve + " velocity curve...");
    
    var processedNotes = [];
    
    for (var i = 0; i < noteList.length; i++) {
        var note = noteList[i];
        var processedVelocity = note.velocity;
        
        // Velocity curve processing
        if (velocityCurve === "exponential") {
            processedVelocity = Math.round(Math.pow(note.velocity / 127, 0.5) * 127);
        } else if (velocityCurve === "logarithmic") {
            processedVelocity = Math.round(Math.pow(note.velocity / 127, 2) * 127);
        }
        
        processedNotes.push({
            pitch: note.pitch,
            time: note.time,
            duration: note.length,
            velocity: processedVelocity,
            mute: false
        });
    }
    
    setNotesLive12(clip, processedNotes);
}

// AI-READY: Intelligente Note-Humanisierung
function setNotesHumanized(clip, noteList, humanization) {
    humanization = humanization || 0.1; // 10% Humanisierung
    
    post("Setting humanized notes (factor: " + humanization + ")...");
    
    var humanizedNotes = [];
    
    for (var i = 0; i < noteList.length; i++) {
        var note = noteList[i];
        
        // Timing humanization
        var timeOffset = (Math.random() - 0.5) * humanization * 0.1; // ±0.01 beats max
        var humanizedTime = Math.max(0, note.time + timeOffset);
        
        // Velocity humanization  
        var velocityOffset = (Math.random() - 0.5) * humanization * 20; // ±10 velocity max
        var humanizedVelocity = Math.max(1, Math.min(127, note.velocity + velocityOffset));
        
        humanizedNotes.push({
            pitch: note.pitch,
            time: humanizedTime,
            duration: note.length,
            velocity: Math.round(humanizedVelocity),
            mute: false
        });
    }
    
    setNotesLive12(clip, humanizedNotes);
}

// MAIN FUNCTION: Ersetze setNotesCorrectlySimple() mit dieser
function setNotesCorrectlySimple(clip, noteList) {
    setNotesLive12(clip, noteList);
}