// Functions related to tempo control and manipulation

// MAIN FUNCTION: Set any tempo
function setTempo(bpm) {
    // Validate parameter
    if (!bpm || bpm < 60 || bpm > 200) {
        post("Invalid BPM: " + bpm + " (must be 60-200)");
        outlet(0, "invalid_tempo");
        return;
    }
    
    try {
        var liveSet = new LiveAPI("live_set");
        
        // Current tempo before change
        var currentTempo = liveSet.get("tempo");
        post("Current tempo: " + currentTempo + " BPM");
        
        // Set new tempo
        liveSet.set("tempo", bpm);
        
        // Verification
        var newTempo = liveSet.get("tempo");
        post("SUCCESS: Tempo changed from " + currentTempo + " to " + newTempo + " BPM");
        
        outlet(0, "tempo_" + Math.round(newTempo));
        
    } catch (e) {
        post("Failed to set tempo: " + e.message);
        outlet(0, "tempo_error");
    }
}

// AI-FRIENDLY WRAPPER: Tempo with String/Number Input
function setTempoAI(input) {
    var bpm;
    
    // Parse input
    if (typeof input === "string") {
        // String like "120", "128 BPM", "set tempo to 140"
        var numbers = input.match(/\d+/);
        if (numbers && numbers.length > 0) {
            bpm = parseInt(numbers[0]);
        }
    } else if (typeof input === "number") {
        bpm = Math.round(input);
    } else {
        post("Cannot parse tempo from: " + input);
        return;
    }
    
    if (bpm) {
        post("AI setting tempo to: " + bpm + " BPM");
        setTempo(bpm);
    } else {
        post("No valid BPM found in: " + input);
    }
}

// CONVENIENCE FUNCTIONS for common tempos
function setTempo120() { setTempo(120); }
function setTempo128() { setTempo(128); }
function setTempo140() { setTempo(140); }

// INTELLIGENT TEMPO FUNCTIONS for AI
function tempoSlow() {
    post("Setting slow tempo (80-100 BPM)");
    var slowTempos = [80, 85, 90, 95, 100];
    var randomSlow = slowTempos[Math.floor(Math.random() * slowTempos.length)];
    setTempo(randomSlow);
}

function tempoMedium() {
    post("Setting medium tempo (110-130 BPM)");
    var mediumTempos = [110, 115, 120, 125, 128, 130];
    var randomMedium = mediumTempos[Math.floor(Math.random() * mediumTempos.length)];
    setTempo(randomMedium);
}

function tempoFast() {
    post("Setting fast tempo (140-170 BPM)");
    var fastTempos = [140, 145, 150, 155, 160, 165, 170];
    var randomFast = fastTempos[Math.floor(Math.random() * fastTempos.length)];
    setTempo(randomFast);
}

// DERIVE TEMPO FROM GENRE
function setTempoFromGenre(genre) {
    var genreTempos = {
        "house": [120, 122, 124, 126, 128],
        "techno": [130, 132, 135, 138, 140],
        "dnb": [170, 172, 174, 175, 176],
        "dubstep": [140, 145, 150],
        "trap": [140, 145, 150],
        "ambient": [60, 70, 80, 90],
        "jazz": [100, 110, 120],
        "pop": [110, 115, 120, 125]
    };
    
    var lowerGenre = genre.toLowerCase();
    
    if (genreTempos[lowerGenre]) {
        var tempos = genreTempos[lowerGenre];
        var randomTempo = tempos[Math.floor(Math.random() * tempos.length)];
        post("Setting " + genre + " tempo: " + randomTempo + " BPM");
        setTempo(randomTempo);
    } else {
        post("Unknown genre: " + genre + " - using medium tempo");
        tempoMedium();
    }
}

// TEMPO RAMPING for AI (smooth changes)
function rampTempo(targetBpm, steps, intervalMs) {
    steps = steps || 10;
    intervalMs = intervalMs || 200;
    
    try {
        var liveSet = new LiveAPI("live_set");
        var currentTempo = liveSet.get("tempo")[0];
        var stepSize = (targetBpm - currentTempo) / steps;
        
        post("Ramping tempo from " + currentTempo + " to " + targetBpm + " in " + steps + " steps");
        
        var step = 0;
        function doRampStep() {
            step++;
            var newTempo = currentTempo + (stepSize * step);
            
            if (step >= steps) {
                newTempo = targetBpm; // Final step
            }
            
            setTempo(Math.round(newTempo));
            
            if (step < steps) {
                var task = new Task(doRampStep);
                task.schedule(intervalMs);
            } else {
                post("Tempo ramp completed at " + targetBpm + " BPM");
            }
        }
        
        var initialTask = new Task(doRampStep);
        initialTask.schedule(intervalMs);
        
    } catch (e) {
        post("Tempo ramp failed: " + e.message);
    }
}
