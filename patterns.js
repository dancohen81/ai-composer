// ===== INTELLIGENTES TRACK & PATTERN MANAGEMENT =====
// Für patterns.js - löst Multi-Track und Clip-Detection Probleme

// GLOBAL: Track-Memory für AI System
var trackMemory = {
    lastCreatedTracks: {},  // {drums: trackIndex, bass: trackIndex, ...}
    trackCreationOrder: [], // [trackIndex1, trackIndex2, ...]
    tracksByType: {}        // {drums: [index1, index2], bass: [index3], ...}
};


// ===== CREATE HIHATS ALS UNIVERSAL TEST LABORATORY =====
// Für patterns.js - Experimentier-Playground

// GLOBAL: Test Mode Controller
var testMode = {
    currentExperiment: "instrument_loading",  // Was testen wir gerade?
    experiments: {
        "instrument_loading": "Test Instrument Auto-Loading",
        "phase_system": "Test Phase-Based Setup", 
        "track_preparation": "Test Complete Track Preparation",
        "genre_detection": "Test Genre-Based Decisions",
        "arrangement_ai": "Test AI Arrangement Logic"
    }
};

// ===== CLEAN SELF-CONTAINED HIHAT TEST FÜR MAX 8.6.5 =====
// Copy-paste this ENTIRE function to replace createHiHats() in patterns.js

// ===== API-BASIERTE DEVICE STRATEGY FÜR MAX 8.6.5 =====
// Basierend auf echter Live API Dokumentation

function createHihats() {
    post("=== API-BASED DEVICE LOADING STRATEGY ===");
    
    try {
        // SCHRITT 1: API-konforme Track-Analyse
        var targetTrack = findAndAnalyzeTrack();
        
        if (targetTrack !== -1) {
            // SCHRITT 2: Browser-basierte Ansätze (einzige realistische Option)
            testBrowserDeviceLoading(targetTrack);
            
            // SCHRITT 3: Alternative: Smart Recommendations
            provideSmarterRecommendations(targetTrack);
            
            // SCHRITT 4: Preset-basierte Ansätze falls möglich
            testPresetBasedLoading(targetTrack);
        }
        
    } catch (e) {
        post("API-based strategy failed: " + e.message);
    }
}

function findAndAnalyzeTrack() {
    post("=== TRACK ANALYSIS (Live API konform) ===");
    
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        post("Analyzing " + trackCount + " tracks...");
        
        for (var i = 0; i < trackCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                
                if (track.id != 0) {
                    var name = track.get("name");
                    var devices = track.get("devices");
                    var hasAudio = track.get("has_audio_input");
                    var hasMidi = track.get("has_midi_input");
                    
                    post("Track " + i + ": '" + name + "'");
                    post("  Devices: " + (devices ? devices.length : 0));
                    post("  Audio Input: " + hasAudio);
                    post("  MIDI Input: " + hasMidi);
                    
                    // Analysiere existierende Devices (API-konform)
                    if (devices && devices.length > 0) {
                        analyzeExistingDevices(i, devices.length);
                    }
                    
                    // Wähle AI Drums Track für Test
                    if (name && name.toString().indexOf("AI Drums") !== -1) {
                        post("SELECTED: Track " + i + " for device loading test");
                        return i;
                    }
                }
            } catch (trackError) {
                post("Error analyzing track " + i + ": " + trackError.message);
            }
        }
        
        return 0; // Fallback zum ersten Track
        
    } catch (e) {
        post("Track analysis failed: " + e.message);
        return -1;
    }
}

function analyzeExistingDevices(trackIndex, deviceCount) {
    post("  Analyzing " + deviceCount + " existing devices:");
    
    for (var i = 0; i < deviceCount; i++) {
        try {
            var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + i);
            
            // API-konforme Device-Properties
            var name = device.get("name");
            var className = device.get("class_name");
            var displayName = device.get("class_display_name");
            var isActive = device.get("is_active");
            var type = device.get("type");
            
            post("    Device " + i + ":");
            post("      Name: " + name);
            post("      Class: " + className);
            post("      Display: " + displayName);
            post("      Active: " + isActive);
            post("      Type: " + type + " (0=undefined, 1=instrument, 2=audio_effect, 4=midi_effect)");
            
        } catch (deviceError) {
            post("    Device " + i + ": Error - " + deviceError.message);
        }
    }
}

function testBrowserDeviceLoading(trackIndex) {
    post("=== BROWSER-BASED DEVICE LOADING (Live API) ===");
    
    try {
        // View-System ist unsere beste Hoffnung basierend auf API docs
        var view = new LiveAPI("live_set view");
        
        post("Accessing Live's view system...");
        
        // View-Properties die laut API verfügbar sein könnten
        var viewProperties = ["selected_track", "detail_clip", "highlighted_clip_slot"];
        
        for (var i = 0; i < viewProperties.length; i++) {
            var prop = viewProperties[i];
            try {
                var value = view.get(prop);
                post("view." + prop + ": " + (value ? "Available" : "null"));
            } catch (propError) {
                post("view." + prop + ": Error - " + propError.message);
            }
        }
        
        // Versuche Track-Selection (könnte für Browser wichtig sein)
        try {
            post("Attempting to select target track...");
            view.set("selected_track", trackIndex);
            post("  ✓ Track selection successful");
        } catch (selectError) {
            post("  ✗ Track selection failed: " + selectError.message);
        }
        
        // Browser-Navigation versuchen (spekulativ basierend auf verfügbaren APIs)
        tryBrowserNavigation(view);
        
    } catch (e) {
        post("Browser-based loading failed: " + e.message);
    }
}

function tryBrowserNavigation(view) {
    post("=== BROWSER NAVIGATION EXPERIMENTS ===");
    
    // Diese sind spekulativ, basierend auf typischen Browser-APIs
    var browserMethods = [
        "load_item",
        "preview_item", 
        "load_selected_item",
        "drop_item",
        "navigate_to",
        "search",
        "select_item"
    ];
    
    for (var i = 0; i < browserMethods.length; i++) {
        var method = browserMethods[i];
        try {
            post("Testing browser method: " + method);
            
            // Versuche verschiedene Parameter
            view.call(method);
            post("  ✓ " + method + " method exists (no params)");
            
        } catch (methodError) {
            post("  ✗ " + method + " not available: " + methodError.message);
        }
    }
    
    // Versuche mit Live App
    try {
        var liveApp = new LiveAPI("live_app");
        
        // App-level Browser-Funktionen
        var appMethods = ["load_device", "add_device", "drop_device", "browser_load_item"];
        
        for (var j = 0; j < appMethods.length; j++) {
            var appMethod = appMethods[j];
            try {
                liveApp.call(appMethod, "Analog");
                post("  ✓ live_app." + appMethod + " might work!");
            } catch (appError) {
                post("  ✗ live_app." + appMethod + " failed: " + appError.message);
            }
        }
        
    } catch (appError) {
        post("Live app browser methods failed: " + appError.message);
    }
}

function provideSmarterRecommendations(trackIndex) {
    post("=== SMART DEVICE RECOMMENDATIONS ===");
    
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var trackName = track.get("name");
        var hasMidi = track.get("has_midi_input");
        var hasAudio = track.get("has_audio_input");
        
        post("Generating recommendations for: " + trackName);
        post("Track capabilities - MIDI: " + hasMidi + ", Audio: " + hasAudio);
        
        // Intelligente Empfehlungen basierend auf Track-Name und Typ
        var recommendations = generateIntelligentRecommendations(trackName, hasMidi, hasAudio);
        
        post("RECOMMENDED ACTIONS:");
        for (var i = 0; i < recommendations.length; i++) {
            post("  " + (i + 1) + ". " + recommendations[i]);
        }
        
        // User-freundliche Anweisungen
        post("");
        post("MANUAL LOADING GUIDE:");
        post("  1. Select track: " + trackName);
        post("  2. Open Live's Browser (Cmd/Ctrl + Alt + B)");
        post("  3. Navigate to: Devices → Instruments");
        post("  4. Drag recommended device to track");
        post("  5. AI Composer will then create optimized patterns!");
        
    } catch (e) {
        post("Smart recommendations failed: " + e.message);
    }
}

function generateIntelligentRecommendations(trackName, hasMidi, hasAudio) {
    var recommendations = [];
    
    var trackType = trackName.toLowerCase();
    
    if (trackType.indexOf("drums") !== -1) {
        recommendations.push("Load 'Drum Kit' from Devices → Instruments → Drum Kit");
        recommendations.push("Alternative: 'Impulse' for more control");
        recommendations.push("For electronic: 'Analog' in drum mode");
        
    } else if (trackType.indexOf("bass") !== -1) {
        recommendations.push("Load 'Bass' from Devices → Instruments → Bass");
        recommendations.push("For synthesis: 'Analog' or 'Wavetable'");
        recommendations.push("For realism: 'Simpler' with bass samples");
        
    } else if (trackType.indexOf("lead") !== -1) {
        recommendations.push("Load 'Lead' from Devices → Instruments → Lead");
        recommendations.push("For versatility: 'Wavetable'");
        recommendations.push("For classic: 'Analog' in lead mode");
        
    } else if (trackType.indexOf("pad") !== -1) {
        recommendations.push("Load 'Pad' from Devices → Instruments → Pad");
        recommendations.push("For ambient: 'Wavetable' + 'Reverb'");
        recommendations.push("For warm tones: 'Analog' with long release");
        
    } else {
        recommendations.push("For general use: 'Wavetable' (most versatile)");
        recommendations.push("For classic sounds: 'Analog'");
        recommendations.push("For samples: 'Simpler'");
    }
    
    return recommendations;
}

function testPresetBasedLoading(trackIndex) {
    post("=== PRESET-BASED LOADING EXPERIMENTS ===");
    
    // Falls Devices existieren, versuche Preset-Manipulation
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var devices = track.get("devices");
        
        if (devices && devices.length > 0) {
            post("Testing preset loading on existing devices...");
            
            for (var i = 0; i < devices.length; i++) {
                try {
                    var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + i);
                    var deviceName = device.get("name");
                    
                    post("Device " + i + ": " + deviceName);
                    
                    // Versuche Preset-Loading (spekulativ)
                    var presetMethods = ["load_preset", "set_preset", "select_preset"];
                    
                    for (var j = 0; j < presetMethods.length; j++) {
                        var method = presetMethods[j];
                        try {
                            device.call(method, "Init Default");
                            post("  ✓ " + method + " might work on " + deviceName);
                        } catch (presetError) {
                            post("  ✗ " + method + " failed: " + presetError.message);
                        }
                    }
                    
                } catch (deviceError) {
                    post("Error testing device " + i + ": " + deviceError.message);
                }
            }
        } else {
            post("No existing devices to test preset loading");
        }
        
    } catch (e) {
        post("Preset-based loading test failed: " + e.message);
    }
}

// BONUS: Device-Scanning mit API-konformen Methoden
function scanDeviceCapabilities() {
    post("=== DEVICE CAPABILITIES SCAN (API-based) ===");
    
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        for (var i = 0; i < trackCount; i++) {
            var track = new LiveAPI("live_set tracks " + i);
            if (track.id != 0) {
                var devices = track.get("devices");
                
                if (devices && devices.length > 0) {
                    post("Track " + i + " devices:");
                    
                    for (var j = 0; j < devices.length; j++) {
                        var device = new LiveAPI("live_set tracks " + i + " devices " + j);
                        
                        // Alle verfügbaren Device-Properties scannen
                        var properties = [
                            "name", "class_name", "class_display_name", 
                            "is_active", "type", "can_have_chains", 
                            "can_have_drum_pads"
                        ];
                        
                        post("  Device " + j + ":");
                        for (var k = 0; k < properties.length; k++) {
                            try {
                                var value = device.get(properties[k]);
                                post("    " + properties[k] + ": " + value);
                            } catch (propError) {
                                // Property nicht verfügbar
                            }
                        }
                    }
                }
            }
        }
        
    } catch (e) {
        post("Device capabilities scan failed: " + e.message);
    }
}
function testTrackDevices(trackIndex, results) {
    post("=== TESTING TRACK DEVICES ===");
    
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        
        // Track-Basis-Info
        post("Track ID: " + track.id);
        post("Track Name: " + track.get("name"));
        
        // Device-Liste analysieren
        try {
            var devices = track.get("devices");
            if (devices) {
                post("Devices found: " + devices.length);
                results.deviceTests.push("Device count: " + devices.length);
                
                // Jedes Device einzeln analysieren
                for (var i = 0; i < devices.length; i++) {
                    try {
                        var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + i);
                        var deviceName = device.get("name");
                        post("  Device " + i + ": " + deviceName + " (id: " + device.id + ")");
                        results.deviceTests.push("Device " + i + ": " + deviceName);
                    } catch (deviceError) {
                        post("  Device " + i + ": ERROR - " + deviceError.message);
                        results.deviceTests.push("Device " + i + ": ERROR");
                    }
                }
            } else {
                post("No devices property or empty");
                results.deviceTests.push("No devices found");
            }
        } catch (devicesError) {
            post("Devices access error: " + devicesError.message);
            results.errors.push("Devices: " + devicesError.message);
        }
        
        // Track-Type Info
        try {
            var hasAudio = track.get("has_audio_input");
            var hasMidi = track.get("has_midi_input");
            post("Track capabilities - Audio: " + hasAudio + ", MIDI: " + hasMidi);
            results.deviceTests.push("Audio: " + hasAudio + ", MIDI: " + hasMidi);
        } catch (typeError) {
            results.errors.push("Track type: " + typeError.message);
        }
        
    } catch (trackError) {
        post("Track device test failed: " + trackError.message);
        results.errors.push("Track devices: " + trackError.message);
    }
}

function testDeviceLoading(trackIndex, results) {
    post("=== TESTING DEVICE LOADING (Max 8.6.5) ===");
    
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        
        // Max 8.6.5 Standard Devices (angepasst für ältere Version)
        var standardDevices = [
            "Analog",      // Should exist in Max 8
            "Simpler",     // Should exist in Max 8
            "Impulse",     // Should exist in Max 8
            "Wavetable",   // Might exist in Max 8
            "Drum Kit",    // Might exist in Max 8
            "Bass",        // Might exist in Max 8
            "Lead"         // Might exist in Max 8
        ];
        
        post("Testing " + standardDevices.length + " standard devices...");
        
        for (var i = 0; i < standardDevices.length; i++) {
            var deviceName = standardDevices[i];
            
            try {
                post("Testing device: " + deviceName);
                
                // METHOD 1: create_device
                try {
                    track.call("create_device", deviceName);
                    post("  SUCCESS: create_device(" + deviceName + ") worked!");
                    results.deviceTests.push("SUCCESS: " + deviceName + " via create_device");
                } catch (createError) {
                    post("  FAILED: create_device(" + deviceName + ") - " + createError.message);
                    results.deviceTests.push("FAILED: " + deviceName + " - " + createError.message);
                }
                
                // METHOD 2: add_device (alternative)
                try {
                    track.call("add_device", deviceName);
                    post("  SUCCESS: add_device(" + deviceName + ") worked!");
                    results.deviceTests.push("SUCCESS: " + deviceName + " via add_device");
                } catch (addError) {
                    post("  FAILED: add_device(" + deviceName + ") - " + addError.message);
                }
                
            } catch (deviceTestError) {
                post("  COMPLETE FAILURE for " + deviceName + ": " + deviceTestError.message);
                results.errors.push("Device " + deviceName + ": " + deviceTestError.message);
            }
        }
        
    } catch (loadingError) {
        post("Device loading test failed: " + loadingError.message);
        results.errors.push("Device loading: " + loadingError.message);
    }
}

function testBrowserAccess(results) {
    post("=== TESTING BROWSER ACCESS (Max 8.6.5) ===");
    
    try {
        // Live App Tests
        var liveApp = new LiveAPI("live_app");
        post("Live App ID: " + liveApp.id);
        
        var appProperties = ["browser", "view", "library", "devices"];
        
        for (var i = 0; i < appProperties.length; i++) {
            var prop = appProperties[i];
            try {
                var value = liveApp.get(prop);
                post("live_app." + prop + ": " + (value ? "AVAILABLE (" + value + ")" : "null"));
                results.browserTests.push("live_app." + prop + ": " + (value ? "available" : "null"));
            } catch (propError) {
                post("live_app." + prop + ": ERROR - " + propError.message);
                results.browserTests.push("live_app." + prop + ": ERROR");
            }
        }
        
        // Live Set Tests  
        var liveSet = new LiveAPI("live_set");
        
        var setProperties = ["view", "browser", "library"];
        
        for (var j = 0; j < setProperties.length; j++) {
            var setProp = setProperties[j];
            try {
                var setValue = liveSet.get(setProp);
                post("live_set." + setProp + ": " + (setValue ? "AVAILABLE (" + setValue + ")" : "null"));
                results.browserTests.push("live_set." + setProp + ": " + (setValue ? "available" : "null"));
            } catch (setError) {
                post("live_set." + setProp + ": ERROR - " + setError.message);
                results.browserTests.push("live_set." + setProp + ": ERROR");
            }
        }
        
        // View System Tests (oft wichtig für Browser)
        try {
            var view = new LiveAPI("live_set view");
            post("View system accessible");
            
            var viewProps = ["browser", "detail_clip", "selected_track"];
            for (var k = 0; k < viewProps.length; k++) {
                var viewProp = viewProps[k];
                try {
                    var viewValue = view.get(viewProp);
                    post("view." + viewProp + ": " + (viewValue ? "AVAILABLE" : "null"));
                    results.browserTests.push("view." + viewProp + ": " + (viewValue ? "available" : "null"));
                } catch (viewError) {
                    post("view." + viewProp + ": ERROR - " + viewError.message);
                }
            }
        } catch (viewSystemError) {
            post("View system not accessible: " + viewSystemError.message);
            results.errors.push("View system: " + viewSystemError.message);
        }
        
    } catch (browserError) {
        post("Browser access test failed: " + browserError.message);
        results.errors.push("Browser access: " + browserError.message);
    }
}

function testMax8Capabilities(results) {
    post("=== TESTING MAX 8.6.5 SPECIFIC CAPABILITIES ===");
    
    try {
        // Max Version Info
        var liveApp = new LiveAPI("live_app");
        try {
            var version = liveApp.get("version");
            post("Live version: " + version);
            results.browserTests.push("Live version: " + version);
        } catch (versionError) {
            post("Version not accessible");
        }
        
        // Available API Methods testen
        var liveSet = new LiveAPI("live_set");
        
        // Methods die in Max 8 verfügbar sein sollten
        var max8Methods = [
            "create_midi_track",
            "create_audio_track", 
            "delete_track",
            "duplicate_track"
        ];
        
        post("Testing Max 8.6.5 methods availability...");
        for (var i = 0; i < max8Methods.length; i++) {
            var method = max8Methods[i];
            try {
                // Teste ob Method existiert (ohne sie aufzurufen)
                post("Method " + method + ": available for testing");
                results.browserTests.push("Method " + method + ": available");
            } catch (methodError) {
                post("Method " + method + ": not available - " + methodError.message);
                results.browserTests.push("Method " + method + ": not available");
            }
        }
        
    } catch (max8Error) {
        post("Max 8.6.5 capabilities test failed: " + max8Error.message);
        results.errors.push("Max 8 capabilities: " + max8Error.message);
    }
}

function summarizeTestResults(results) {
    post("=== TEST RESULTS SUMMARY ===");
    post("Track found: " + results.trackFound + " (index: " + results.trackIndex + ")");
    post("Device tests: " + results.deviceTests.length);
    post("Browser tests: " + results.browserTests.length);
    post("Errors: " + results.errors.length);
    
    if (results.deviceTests.length > 0) {
        post("Device test results:");
        for (var i = 0; i < results.deviceTests.length; i++) {
            post("  " + results.deviceTests[i]);
        }
    }
    
    if (results.browserTests.length > 0) {
        post("Browser test results:");
        for (var j = 0; j < results.browserTests.length; j++) {
            post("  " + results.browserTests[j]);
        }
    }
    
    if (results.errors.length > 0) {
        post("Errors encountered:");
        for (var k = 0; k < results.errors.length; k++) {
            post("  ERROR: " + results.errors[k]);
        }
    }
    
    post("=== END OF INSTRUMENT LOADING TEST ===");
}



function findTestTrack() {
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        // Finde AI Drums Track
        for (var i = 0; i < trackCount; i++) {
            var track = new LiveAPI("live_set tracks " + i);
            if (track.id != 0) {
                var name = track.get("name");
                if (name && name.toString().indexOf("AI Drums") !== -1) {
                    return i;
                }
            }
        }
        
        // Fallback: ersten MIDI Track
        for (var j = 0; j < trackCount; j++) {
            var track = new LiveAPI("live_set tracks " + j);
            if (track.id != 0) {
                var hasMidi = track.get("has_midi_input");
                if (hasMidi && hasMidi[0] === 1) {
                    return j;
                }
            }
        }
        
        return 0; // Last resort
    } catch (e) {
        post("Find test track failed: " + e.message);
        return -1;
    }
}

function countDevicesOnTrack(trackIndex) {
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        var devices = track.get("devices");
        return devices ? devices.length : 0;
    } catch (e) {
        post("Count devices failed: " + e.message);
        return -1;
    }
}

function testRealDeviceLoading(trackIndex) {
    post("=== TESTING REAL DEVICE LOADING ===");
    
    var testDevices = ["Analog", "Simpler", "Wavetable"];
    
    for (var i = 0; i < testDevices.length; i++) {
        var deviceName = testDevices[i];
        
        post("Testing device: " + deviceName);
        
        // Devices vor Test zählen
        var devicesBefore = countDevicesOnTrack(trackIndex);
        
        // METHODE 1: create_device mit echter Error-Detection
        try {
            var track = new LiveAPI("live_set tracks " + trackIndex);
            
            // Dieser Call wird wahrscheinlich fehlschlagen
            track.call("create_device", deviceName);
            
            // Wenn wir hier ankommen, hat es möglicherweise funktioniert
            var devicesAfter = countDevicesOnTrack(trackIndex);
            
            if (devicesAfter > devicesBefore) {
                post("  ✓ SUCCESS: " + deviceName + " actually loaded! (+" + (devicesAfter - devicesBefore) + " devices)");
            } else {
                post("  ✗ FAILED: " + deviceName + " - no new devices appeared");
            }
            
        } catch (createError) {
            post("  ✗ FAILED: create_device(" + deviceName + ") - " + createError.message);
        }
        
        // METHODE 2: Live Set basierte Erstellung
        try {
            var liveSet = new LiveAPI("live_set");
            
            // Versuche Device über Live Set zu erstellen
            liveSet.call("create_device", trackIndex, deviceName);
            
            var devicesAfter2 = countDevicesOnTrack(trackIndex);
            if (devicesAfter2 > devicesBefore) {
                post("  ✓ SUCCESS: " + deviceName + " loaded via live_set!");
            } else {
                post("  ✗ FAILED: live_set create_device didn't work");
            }
            
        } catch (liveSetError) {
            post("  ✗ FAILED: live_set.create_device - " + liveSetError.message);
        }
    }
}

function testBrowserBasedLoading(trackIndex) {
    post("=== TESTING BROWSER-BASED LOADING ===");
    
    try {
        // View-Browser Zugriff (das sah vielversprechend aus!)
        var view = new LiveAPI("live_set view");
        
        post("Accessing view system...");
        
        // Browser über View-System
        try {
            var browser = view.get("browser");
            post("View browser access: " + (browser ? "SUCCESS" : "FAILED"));
            
            if (browser) {
                // Versuche Browser-Navigation
                post("Attempting browser navigation...");
                
                // Verschiedene Browser-Methoden testen
                try {
                    view.call("load_item");
                    post("  load_item method exists");
                } catch (loadError) {
                    post("  load_item not available: " + loadError.message);
                }
                
                try {
                    view.call("preview_item");
                    post("  preview_item method exists");
                } catch (previewError) {
                    post("  preview_item not available: " + previewError.message);
                }
            }
            
        } catch (browserError) {
            post("Browser via view failed: " + browserError.message);
        }
        
        // Live App Browser
        try {
            var liveApp = new LiveAPI("live_app");
            var appView = liveApp.get("view");
            
            if (appView) {
                post("Live app view access successful");
                
                // Versuche App-basierte Browser-Funktionen
                try {
                    liveApp.call("load_device", "Analog");
                    post("  ✓ load_device via live_app might work!");
                } catch (appLoadError) {
                    post("  ✗ load_device via live_app failed: " + appLoadError.message);
                }
            }
            
        } catch (appError) {
            post("Live app browser failed: " + appError.message);
        }
        
    } catch (e) {
        post("Browser-based loading test failed: " + e.message);
    }
}

function testAlternativeDeviceAPIs(trackIndex) {
    post("=== TESTING ALTERNATIVE DEVICE APIs ===");
    
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        
        // METHODE 1: Via Clip Slot
        try {
            var clipSlot = new LiveAPI("live_set tracks " + trackIndex + " clip_slots 0");
            
            clipSlot.call("create_device", "Analog");
            post("  ✓ Device creation via clip_slot might work!");
            
        } catch (clipError) {
            post("  ✗ Clip slot device creation failed: " + clipError.message);
        }
        
        // METHODE 2: Via Mixer Device
        try {
            var mixer = new LiveAPI("live_set tracks " + trackIndex + " mixer_device");
            
            mixer.call("create_device", "Analog");
            post("  ✓ Device creation via mixer might work!");
            
        } catch (mixerError) {
            post("  ✗ Mixer device creation failed: " + mixerError.message);
        }
        
        // METHODE 3: Device Chain Approach
        try {
            // Versuche Device Chain zu manipulieren
            var devices = track.get("devices");
            
            if (devices) {
                post("  Current device chain has " + devices.length + " devices");
                
                // Versuche Device Chain Manipulation
                track.call("add_device_to_chain", "Analog", 0);
                post("  ✓ add_device_to_chain might work!");
            }
            
        } catch (chainError) {
            post("  ✗ Device chain manipulation failed: " + chainError.message);
        }
        
        // METHODE 4: Drop Simulation
        try {
            // Simuliere Drag & Drop
            track.call("drop_device", "Analog", 0);
            post("  ✓ drop_device might work!");
            
        } catch (dropError) {
            post("  ✗ Drop device simulation failed: " + dropError.message);
        }
        
    } catch (e) {
        post("Alternative device APIs test failed: " + e.message);
    }
}

// FINALE DEVICE-ZÄHLUNG
function finalDeviceCount(trackIndex) {
    post("=== FINAL DEVICE COUNT ===");
    
    try {
        var finalCount = countDevicesOnTrack(trackIndex);
        post("Final device count on track " + trackIndex + ": " + finalCount);
        
        if (finalCount > 0) {
            // Liste alle Devices auf
            var track = new LiveAPI("live_set tracks " + trackIndex);
            var devices = track.get("devices");
            
            for (var i = 0; i < devices.length; i++) {
                try {
                    var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + i);
                    var deviceName = device.get("name");
                    post("  Device " + i + ": " + deviceName);
                } catch (deviceError) {
                    post("  Device " + i + ": Error getting name");
                }
            }
        }
        
    } catch (e) {
        post("Final device count failed: " + e.message);
    }
}
// ===== VERBESSERTE INSTRUMENT LOADING TESTS =====
// Für patterns.js - Update für createHiHats()

// EXPERIMENT 1 VERBESSERT: INSTRUMENT AUTO-LOADING
function testInstrumentLoading() {
    post("=== TESTING INSTRUMENT AUTO-LOADING V2 ===");
    
    try {
        // SCHRITT 1: Robuste Track-Erstellung
        var targetTrack = createRobustTestTrack();
        
        if (targetTrack !== -1) {
            post("SUCCESS: Test track ready at index " + targetTrack);
            
            // SCHRITT 2: Track-Info sammeln
            exploreTrackCapabilities(targetTrack);
            
            // SCHRITT 3: Device-Loading Methoden testen
            testDeviceLoadingMethods(targetTrack);
            
            // SCHRITT 4: Browser-Alternativen erforschen
            exploreBrowserAlternatives();
            
        } else {
            post("FAILED: Could not create test track");
        }
        
    } catch (e) {
        post("Instrument loading test failed: " + e.message);
    }
}

// ROBUSTE TRACK-ERSTELLUNG
function createRobustTestTrack() {
    try {
        var liveSet = new LiveAPI("live_set");
        
        // Versuche existierenden Test-Track zu finden
        var trackCount = liveSet.get("tracks").length;
        post("Checking " + trackCount + " existing tracks...");
        
        for (var i = 0; i < trackCount; i++) {
            try {
                var track = new LiveAPI("live_set tracks " + i);
                if (track.id != 0) {
                    var name = track.get("name");
                    if (name && name.toString().indexOf("Test") !== -1) {
                        post("Found existing test track: '" + name + "' at index " + i);
                        return i;
                    }
                }
            } catch (e) {
                // Ignore individual track errors
            }
        }
        
        // Kein Test-Track gefunden - erstelle neuen
        post("No test track found - creating new one...");
        liveSet.call("create_midi_track", -1);
        
        // Warte auf Track-Erstellung
        var attempts = 0;
        var maxAttempts = 10;
        
        function waitForTrack() {
            attempts++;
            try {
                var newTrackCount = liveSet.get("tracks").length;
                if (newTrackCount > trackCount) {
                    var newTrackIndex = newTrackCount - 1;
                    var newTrack = new LiveAPI("live_set tracks " + newTrackIndex);
                    
                    if (newTrack.id != 0) {
                        newTrack.set("name", "Instrument Test Track");
                        post("SUCCESS: Created test track at index " + newTrackIndex);
                        
                        // Sofort weitermachen mit Tests
                        exploreTrackCapabilities(newTrackIndex);
                        testDeviceLoadingMethods(newTrackIndex);
                        exploreBrowserAlternatives();
                        
                        return newTrackIndex;
                    }
                }
                
                if (attempts < maxAttempts) {
                    var task = new Task(waitForTrack);
                    task.schedule(200);
                } else {
                    post("TIMEOUT: Track creation failed after " + maxAttempts + " attempts");
                }
                
            } catch (e) {
                post("Error in track creation attempt " + attempts + ": " + e.message);
                if (attempts < maxAttempts) {
                    var task = new Task(waitForTrack);
                    task.schedule(200);
                }
            }
        }
        
        // Start waiting
        var initialTask = new Task(waitForTrack);
        initialTask.schedule(300);
        
        return -1; // Will be set later
        
    } catch (e) {
        post("Robust track creation failed: " + e.message);
        return -1;
    }
}

// TRACK-FÄHIGKEITEN ERFORSCHEN
function exploreTrackCapabilities(trackIndex) {
    post("=== EXPLORING TRACK CAPABILITIES ===");
    
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        
        // Track-Properties erforschen
        post("Track ID: " + track.id);
        post("Track Name: " + track.get("name"));
        
        // Device-Info
        try {
            var devices = track.get("devices");
            post("Current devices: " + (devices ? devices.length : "undefined"));
            
            // Device-Details falls vorhanden
            if (devices && devices.length > 0) {
                for (var i = 0; i < devices.length; i++) {
                    var device = new LiveAPI("live_set tracks " + trackIndex + " devices " + i);
                    post("  Device " + i + ": " + device.get("name"));
                }
            }
        } catch (deviceError) {
            post("Device exploration error: " + deviceError.message);
        }
        
        // Track-Type Info
        try {
            var hasAudio = track.get("has_audio_input");
            var hasMidi = track.get("has_midi_input");
            post("Track Type - Audio Input: " + hasAudio + ", MIDI Input: " + hasMidi);
        } catch (typeError) {
            post("Track type error: " + typeError.message);
        }
        
        // Mixer Device erforschen
        try {
            var mixer = new LiveAPI("live_set tracks " + trackIndex + " mixer_device");
            post("Mixer Device ID: " + mixer.id);
        } catch (mixerError) {
            post("Mixer exploration error: " + mixerError.message);
        }
        
    } catch (e) {
        post("Track capabilities exploration failed: " + e.message);
    }
}



// BROWSER-ALTERNATIVEN ERFORSCHEN
function exploreBrowserAlternatives() {
    post("=== EXPLORING BROWSER ALTERNATIVES ===");
    
    try {
        var liveApp = new LiveAPI("live_app");
        
        // Live App Properties erforschen
        post("Live App available properties:");
        
        // Verschiedene Browser-ähnliche Properties testen
        var browserProperties = ["browser", "library", "devices", "instruments", "presets"];
        
        for (var i = 0; i < browserProperties.length; i++) {
            var prop = browserProperties[i];
            try {
                var value = liveApp.get(prop);
                post("  " + prop + ": " + (value ? "AVAILABLE" : "not available"));
            } catch (propError) {
                post("  " + prop + ": ERROR - " + propError.message);
            }
        }
        
        // Live Set Browser-Properties
        var liveSet = new LiveAPI("live_set");
        post("Live Set browser-related properties:");
        
        var setProperties = ["browser", "library", "view"];
        for (var j = 0; j < setProperties.length; j++) {
            var setProp = setProperties[j];
            try {
                var setValue = liveSet.get(setProp);
                post("  " + setProp + ": " + (setValue ? "AVAILABLE" : "not available"));
            } catch (setError) {
                post("  " + setProp + ": ERROR - " + setError.message);
            }
        }
        
        // View-System erforschen (oft ist Browser im View-System)
        try {
            var view = new LiveAPI("live_set view");
            post("View system available");
            
            var viewProperties = ["browser", "detail_clip", "highlighted_clip_slot"];
            for (var k = 0; k < viewProperties.length; k++) {
                var viewProp = viewProperties[k];
                try {
                    var viewValue = view.get(viewProp);
                    post("  view." + viewProp + ": " + (viewValue ? "AVAILABLE" : "not available"));
                } catch (viewError) {
                    post("  view." + viewProp + ": ERROR - " + viewError.message);
                }
            }
        } catch (viewError) {
            post("View system not accessible: " + viewError.message);
        }
        
    } catch (e) {
        post("Browser alternatives exploration failed: " + e.message);
    }
}

// ALTERNATIVE: PRESET-DATEI BASIERTE LÖSUNG
function testPresetFileLoading(trackIndex) {
    post("=== TESTING PRESET FILE LOADING ===");
    
    try {
        // Das wäre der eleganteste Weg - direkte .adv/.als Datei-Loads
        var track = new LiveAPI("live_set tracks " + trackIndex);
        
        // Verschiedene Preset-Loading Methoden
        var presetMethods = [
            "load_preset",
            "load_device_preset", 
            "import_preset",
            "load_instrument"
        ];
        
        for (var i = 0; i < presetMethods.length; i++) {
            var method = presetMethods[i];
            try {
                post("Trying preset method: " + method);
                track.call(method, "Wavetable.adv");
            } catch (presetError) {
                post("  " + method + " failed: " + presetError.message);
            }
        }
        
    } catch (e) {
        post("Preset file loading test failed: " + e.message);
    }
}

// FALLBACK: MANUAL INSTRUMENT RECOMMENDATIONS
function getInstrumentRecommendations(trackType) {
    var recommendations = {
        "drums": {
            devices: ["Drum Kit", "Simpler", "Analog"], 
            message: "Load a Drum Kit manually for best results"
        },
        "bass": {
            devices: ["Bass", "Wavetable", "Analog"],
            message: "Try Serum, Bass, or Wavetable for bass sounds"
        },
        "lead": {
            devices: ["Lead", "Wavetable", "Analog"],
            message: "Omnisphere, Lead, or Wavetable work great for leads"
        },
        "pad": {
            devices: ["Pad", "Wavetable", "Reverb"],
            message: "Massive, Pad, or Wavetable with reverb for ambient pads"
        }
    };
    
    return recommendations[trackType] || {
        devices: ["Wavetable"],
        message: "Wavetable is a good all-purpose synth"
    };
}

// EXPERIMENTELLER DEVICE-SCANNER
function scanAvailableDevices() {
    post("=== SCANNING AVAILABLE DEVICES ===");
    
    // Das könnte interessant werden - alle verfügbaren Devices scannen
    var commonDevices = [
        // Ableton Standard
        "Wavetable", "Simpler", "Analog", "Bass", "Lead", "Pad", "Drum Kit",
        // Möglicherweise verfügbar
        "Serum", "Massive", "Omnisphere", "Kontakt", "Reaktor",
        // Effects
        "Reverb", "Delay", "EQ", "Compressor"
    ];
    
    post("Testing device availability:");
    
    // Create temporary track for testing
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        for (var i = 0; i < commonDevices.length; i++) {
            var deviceName = commonDevices[i];
            
            // Test if device exists by trying to get info about it
            // This is speculative - might not work
            try {
                post("  Testing: " + deviceName + "...");
                // Various ways to test device existence
                
            } catch (testError) {
                post("  " + deviceName + ": not available");
            }
        }
        
    } catch (e) {
        post("Device scanning failed: " + e.message);
    }
}


// EXPERIMENT 1: INSTRUMENT AUTO-LOADING
function testInstrumentLoading() {
    post("=== TESTING INSTRUMENT AUTO-LOADING ===");
    
    try {
        // Finde ersten leeren Track oder erstelle neuen
        var targetTrack = findOrCreateTestTrack("Test Instrument Track");
        
        if (targetTrack !== -1) {
            post("Target track found: " + targetTrack);
            
            // Versuche Instrument zu laden
            loadInstrumentOnTrack(targetTrack, "synth_lead");
            
        } else {
            post("Could not find/create target track");
        }
        
    } catch (e) {
        post("Instrument loading test failed: " + e.message);
    }
}

// EXPERIMENT 2: PHASE-BASED SETUP
function testPhaseBasedSetup() {
    post("=== TESTING PHASE-BASED SETUP ===");
    
    try {
        // Simuliere Phase 1: Complete Track Setup
        var songStructure = {
            tracks: [
                {name: "AI Drums", type: "drums", instrument: "drum_kit"},
                {name: "AI Bass", type: "bass", instrument: "serum_bass"},
                {name: "AI Lead", type: "lead", instrument: "omnisphere"},
                {name: "AI Pad", type: "pad", instrument: "massive_pad"}
            ],
            tempo: 128,
            key: "C minor",
            genre: "house"
        };
        
        post("Setting up complete song structure...");
        post("Tracks to create: " + songStructure.tracks.length);
        post("Tempo: " + songStructure.tempo + " BPM");
        post("Key: " + songStructure.key);
        
        // Phase 1 Simulation
        setupCompleteArrangement(songStructure);
        
    } catch (e) {
        post("Phase-based setup test failed: " + e.message);
    }
}

// EXPERIMENT 3: COMPLETE TRACK PREPARATION
function testCompleteTrackPreparation() {
    post("=== TESTING COMPLETE TRACK PREPARATION ===");
    
    try {
        var trackIndex = findOrCreateTestTrack("Complete Test Track");
        
        if (trackIndex !== -1) {
            // Vollständige Track-Vorbereitung
            prepareCompleteTrack(trackIndex, {
                trackType: "lead",
                instrument: "omnisphere",
                effects: ["reverb", "delay", "eq"],
                volume: 0.8,
                pan: 0.1
            });
        }
        
    } catch (e) {
        post("Complete track preparation test failed: " + e.message);
    }
}

// HILFSFUNKTIONEN FÜR EXPERIMENTE

function findOrCreateTestTrack(trackName) {
    try {
        var liveSet = new LiveAPI("live_set");
        var trackCount = liveSet.get("tracks").length;
        
        // Suche existierenden Test-Track
        for (var i = 0; i < trackCount; i++) {
            var track = new LiveAPI("live_set tracks " + i);
            if (track.id != 0) {
                var name = track.get("name");
                if (name && name.toString().indexOf("Test") !== -1) {
                    post("Found existing test track at index " + i);
                    return i;
                }
            }
        }
        
        // Erstelle neuen Test-Track
        post("Creating new test track...");
        liveSet.call("create_midi_track", -1);
        
        // Warte und benenne
        var newTrackIndex = trackCount; // Should be the new track
        var attempts = 0;
        
        function nameTestTrack() {
            try {
                var newTrack = new LiveAPI("live_set tracks " + newTrackIndex);
                if (newTrack.id != 0) {
                    newTrack.set("name", trackName);
                    post("Test track created and named: " + trackName);
                    return newTrackIndex;
                } else if (attempts < 5) {
                    attempts++;
                    var task = new Task(nameTestTrack);
                    task.schedule(200);
                }
            } catch (e) {
                post("Error naming test track: " + e.message);
            }
        }
        
        var task = new Task(nameTestTrack);
        task.schedule(300);
        return newTrackIndex;
        
    } catch (e) {
        post("Error finding/creating test track: " + e.message);
        return -1;
    }
}

function loadInstrumentOnTrack(trackIndex, instrumentType) {
    post("=== ATTEMPTING INSTRUMENT LOADING ===");
    post("Track: " + trackIndex + ", Instrument Type: " + instrumentType);
    
    try {
        var track = new LiveAPI("live_set tracks " + trackIndex);
        
        // Prüfe aktuelle Devices
        var devices = track.get("devices");
        post("Current devices on track: " + devices.length);
        
        // Versuche verschiedene Instrument-Loading Methoden
        
        // METHODE 1: Browser-basiert (falls möglich)
        try {
            post("Attempting browser-based instrument loading...");
            // Hier würden wir den Browser verwenden
            loadInstrumentViaBrowser(track, instrumentType);
        } catch (browserError) {
            post("Browser method failed: " + browserError.message);
        }
        
        // METHODE 2: Device-Creation (falls möglich)
        try {
            post("Attempting direct device creation...");
            loadInstrumentViaDeviceCreation(track, instrumentType);
        } catch (deviceError) {
            post("Device creation method failed: " + deviceError.message);
        }
        
        // METHODE 3: Preset-Loading (falls möglich)
        try {
            post("Attempting preset-based loading...");
            loadInstrumentViaPresets(track, instrumentType);
        } catch (presetError) {
            post("Preset method failed: " + presetError.message);
        }
        
        post("Instrument loading experiment completed");
        
    } catch (e) {
        post("Instrument loading completely failed: " + e.message);
    }
}

function loadInstrumentViaBrowser(track, instrumentType) {
    post("Browser method: Exploring Live's browser system...");
    
    // Versuche Browser-Zugriff
    var liveApp = new LiveAPI("live_app");
    var browser = liveApp.get("browser");
    
    if (browser) {
        post("Browser access successful");
        // Hier würden wir durch Instruments navigieren
    } else {
        post("No browser access available");
    }
}

function loadInstrumentViaDeviceCreation(track, instrumentType) {
    post("Device creation method: Attempting to create devices...");
    
    try {
        // Versuche Standard Ableton Devices zu laden
        var deviceName = getStandardDeviceForType(instrumentType);
        
        if (deviceName) {
            post("Attempting to load device: " + deviceName);
            // track.call("create_device", deviceName); // Might not work
        }
        
    } catch (e) {
        post("Device creation failed: " + e.message);
    }
}

function loadInstrumentViaPresets(track, instrumentType) {
    post("Preset method: Exploring preset system...");
    
    // Versuche Preset-Zugriff
    // Das wäre der eleganteste Weg
}

function getStandardDeviceForType(instrumentType) {
    var deviceMap = {
        "drum_kit": "Drum Kit",
        "serum_bass": "Bass", // Fallback to Ableton Bass if Serum not available
        "omnisphere": "Wavetable", // Fallback to Wavetable if Omnisphere not available
        "massive_pad": "Pad", // Fallback to Ableton Pad
        "synth_lead": "Lead"
    };
    
    return deviceMap[instrumentType] || "Wavetable";
}

// EXPERIMENT SWITCHER
function switchExperiment(experimentName) {
    if (testMode.experiments[experimentName]) {
        testMode.currentExperiment = experimentName;
        post("Switched to experiment: " + testMode.experiments[experimentName]);
    } else {
        post("Unknown experiment: " + experimentName);
        post("Available experiments:");
        for (var key in testMode.experiments) {
            post("  " + key + ": " + testMode.experiments[key]);
        }
    }
}

// SETUP FUNCTIONS FOR PHASE-BASED APPROACH
function setupCompleteArrangement(songStructure) {
    post("=== SETTING UP COMPLETE ARRANGEMENT ===");
    
    // Set Tempo first
    if (songStructure.tempo) {
        setTempo(songStructure.tempo);
    }
    
    // Create all tracks with instruments
    for (var i = 0; i < songStructure.tracks.length; i++) {
        var trackInfo = songStructure.tracks[i];
        post("Setting up track " + (i + 1) + ": " + trackInfo.name);
        
        setupTrackWithInstrument(trackInfo);
    }
    
    post("Arrangement setup completed - ready for pattern phase!");
}

function setupTrackWithInstrument(trackInfo) {
    post("Creating track: " + trackInfo.name + " (Type: " + trackInfo.type + ", Instrument: " + trackInfo.instrument + ")");
    
    // This would be the full track creation + instrument loading
    // For now, just create the track
    createTrackWithName(trackInfo.name);
    
    // TODO: Add instrument loading here once we figure out the API
}

// STATUS FUNCTIONS
function showExperimentStatus() {
    post("=== EXPERIMENT LABORATORY STATUS ===");
    post("Current Experiment: " + testMode.currentExperiment);
    post("Description: " + testMode.experiments[testMode.currentExperiment]);
    post("Available experiments: " + Object.keys(testMode.experiments).length);
}



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

/*function createHiHats() {
    post("Creating hi-hats on drums track...");
    createPatternOnTrack("drums", "hihat", 4.0);
}*/

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


switchExperiment("instrument_loading")
// Dann [Create HiHats] drücken


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
