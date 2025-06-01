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
    
    post("Setting " + noteList.length + " notes using STRING Live API syntax...");
    
    var messageIndex = 0;
    var totalMessages = 3 + noteList.length; // set_notes + notes + N*note + done
    
    function sendNextMessage() {
        try {
            if (messageIndex === 0) {
                // 1. Start Operation
                post("Message 1/" + totalMessages + ": call set_notes");
                clip.call("set_notes");
                
            } else if (messageIndex === 1) {
                // 2. Note Count - ALS STRING!
                var notesCommand = "notes " + noteList.length;
                post("Message 2/" + totalMessages + ": call '" + notesCommand + "'");
                clip.call(notesCommand);
                
            } else if (messageIndex >= 2 && messageIndex < 2 + noteList.length) {
                // 3. Individual Notes - ALS STRING!
                var noteIdx = messageIndex - 2;
                var note = noteList[noteIdx];
                var noteCommand = "note " + note.pitch + " " + note.time + " " + note.length + " " + note.velocity + " 0";
                post("Message " + (messageIndex + 1) + "/" + totalMessages + ": call '" + noteCommand + "'");
                clip.call(noteCommand);
                
            } else if (messageIndex === 2 + noteList.length) {
                // 4. End Operation
                post("Message " + (messageIndex + 1) + "/" + totalMessages + ": call done");
                clip.call("done");
                post("SUCCESS: All " + noteList.length + " notes set!");
                return; // Fertig!
            }
            
            messageIndex++;
            
            // Nächste Nachricht nach Delay
            var task = new Task(sendNextMessage);
            task.schedule(50);
            
        } catch (e) {
            post("ERROR at message " + (messageIndex + 1) + ": " + e.message);
            messageIndex++;
            
            if (messageIndex < totalMessages) {
                var task = new Task(sendNextMessage);
                task.schedule(50);
            }
        }
    }
    
    // Ersten Message nach kurzem Delay senden
    var initialTask = new Task(sendNextMessage);
    initialTask.schedule(100);
}

// ALTERNATIVE: Direkter Ansatz mit String-Formatierung
function setNotesDirectString(clip, noteList) {
    if (!noteList || noteList.length === 0) {
        post("No notes to set");
        return;
    }
    
    post("Setting " + noteList.length + " notes using direct string approach...");
    
    try {
        // 1. Start Operation
        post("Step 1: Starting set_notes operation");
        clip.call("set_notes");
        
        // Kurze Pause
        var step2Task = new Task(function() {
            try {
                // 2. Note Count
                var notesCmd = "notes " + noteList.length;
                post("Step 2: " + notesCmd);
                clip.call(notesCmd);
                
                // 3. Send Notes sequenziell
                var noteIndex = 0;
                function sendNote() {
                    if (noteIndex < noteList.length) {
                        var note = noteList[noteIndex];
                        var noteCmd = "note " + note.pitch + " " + note.time + " " + note.length + " " + note.velocity + " 0";
                        post("Step " + (3 + noteIndex) + ": " + noteCmd);
                        
                        try {
                            clip.call(noteCmd);
                            noteIndex++;
                            
                            if (noteIndex < noteList.length) {
                                var nextNoteTask = new Task(sendNote);
                                nextNoteTask.schedule(30);
                            } else {
                                // 4. End Operation
                                var doneTask = new Task(function() {
                                    post("Final step: done");
                                    clip.call("done");
                                    post("SUCCESS: All notes set with string syntax!");
                                });
                                doneTask.schedule(30);
                            }
                        } catch (noteError) {
                            post("Error sending note: " + noteError.message);
                            noteIndex++;
                            if (noteIndex < noteList.length) {
                                var retryTask = new Task(sendNote);
                                retryTask.schedule(30);
                            }
                        }
                    }
                }
                
                // Start sending notes
                var firstNoteTask = new Task(sendNote);
                firstNoteTask.schedule(50);
                
            } catch (notesError) {
                post("Error in notes command: " + notesError.message);
            }
        });
        step2Task.schedule(50);
        
    } catch (e) {
        post("Error starting set_notes: " + e.message);
    }
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
function setNotesCorrectlySimple(clip, noteList) {
    if (!noteList || noteList.length === 0) {
        post("No notes to set");
        return;
    }
    
    post("Setting " + noteList.length + " notes using STRING Live API syntax...");
    
    var messageIndex = 0;
    var totalMessages = 3 + noteList.length; // set_notes + notes + N*note + done
    
    function sendNextMessage() {
        try {
            if (messageIndex === 0) {
                // 1. Start Operation
                post("Message 1/" + totalMessages + ": call set_notes");
                clip.call("set_notes");
                
            } else if (messageIndex === 1) {
                // 2. Note Count - ALS STRING!
                var notesCommand = "notes " + noteList.length;
                post("Message 2/" + totalMessages + ": call '" + notesCommand + "'");
                clip.call(notesCommand);
                
            } else if (messageIndex >= 2 && messageIndex < 2 + noteList.length) {
                // 3. Individual Notes - ALS STRING!
                var noteIdx = messageIndex - 2;
                var note = noteList[noteIdx];
                var noteCommand = "note " + note.pitch + " " + note.time + " " + note.length + " " + note.velocity + " 0";
                post("Message " + (messageIndex + 1) + "/" + totalMessages + ": call '" + noteCommand + "'");
                clip.call(noteCommand);
                
            } else if (messageIndex === 2 + noteList.length) {
                // 4. End Operation
                post("Message " + (messageIndex + 1) + "/" + totalMessages + ": call done");
                clip.call("done");
                post("SUCCESS: All " + noteList.length + " notes set!");
                return; // Fertig!
            }
            
            messageIndex++;
            
            // Nächste Nachricht nach Delay
            var task = new Task(sendNextMessage);
            task.schedule(50);
            
        } catch (e) {
            post("ERROR at message " + (messageIndex + 1) + ": " + e.message);
            messageIndex++;
            
            if (messageIndex < totalMessages) {
                var task = new Task(sendNextMessage);
                task.schedule(50);
            }
        }
    }
    
    // Ersten Message nach kurzem Delay senden
    var initialTask = new Task(sendNextMessage);
    initialTask.schedule(100);
}
