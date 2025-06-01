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

// KORREKTE SEQUENZIELLE NOTE-SETZUNG
function setNotesCorrectly(clip, noteList) {
    if (!noteList || noteList.length === 0) {
        post("No notes to set");
        return;
    }
    
    post("Setting " + noteList.length + " notes using correct Live API syntax...");
    
    var messageIndex = 0;
    var messages = [];
    
    // SCHRITT 1: Nachrichten-Sequenz vorbereiten
    messages.push("set_notes");                    // Start der Operation
    messages.push("notes " + noteList.length);    // Anzahl der Notes
    
    // SCHRITT 2: Alle Notes zur Sequenz hinzufügen
    for (var i = 0; i < noteList.length; i++) {
        var note = noteList[i];
        // Format: note [pitch] [time] [duration] [velocity] [is_muted]
        messages.push("note " + note.pitch + " " + note.time + " " + note.length + " " + note.velocity + " 0");
    }
    
    messages.push("done");  // Ende der Operation
    
    post("Prepared " + messages.length + " messages for Live API");
    
    // SCHRITT 3: Nachrichten sequenziell senden
    function sendNextMessage() {
        if (messageIndex < messages.length) {
            var message = messages[messageIndex];
            post("Sending message " + (messageIndex + 1) + "/" + messages.length + ": call " + message);
            
            try {
                clip.call(message);
                messageIndex++;
                
                // Nächste Nachricht nach Delay
                if (messageIndex < messages.length) {
                    var task = new Task(sendNextMessage);
                    task.schedule(50); // 50ms zwischen Nachrichten
                } else {
                    post("SUCCESS: All " + noteList.length + " notes set!");
                }
                
            } catch (e) {
                post("ERROR sending message '" + message + "': " + e.message);
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
