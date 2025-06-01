// ai-composer-service.js - Node.js Service for AI Composer
// This is the file that was missing!

const WebSocket = require('ws');
const axios = require('axios');

class AIComposerService {
  constructor(openRouterApiKey) {
    this.apiKey = openRouterApiKey || 'your-openrouter-api-key-here';
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    // WebSocket Server for M4L Communication
    this.wsServer = new WebSocket.Server({ port: 8080 });
    
    // Project State Management
    this.projectState = {
      currentPhase: 1,
      tracksCreated: [],
      pluginsLoaded: [],
      clipsGenerated: [],
      lastAction: "initialized",
      nextGoal: "setup_project_structure",
      bpm: 120,
      key: "C",
      timeSignature: "4/4"
    };
    
    this.setupWebSocket();
  }
  
  setupWebSocket() {
    this.wsServer.on('connection', (ws) => {
      console.log('M4L Device connected!');
      
      ws.on('message', async (message) => {
        const data = JSON.parse(message);
        await this.handleM4LMessage(data, ws);
      });
      
      ws.on('close', () => {
        console.log('M4L Device disconnected');
      });
    });
    
    console.log('AI Composer Service running on ws://localhost:8080');
  }
  
  async handleM4LMessage(data, ws) {
    console.log('Received from M4L:', data);
    
    switch(data.type) {
      case 'project_status':
        await this.updateProjectState(data.state);
        break;
        
      case 'request_next_action':
        const nextAction = await this.planNextAction();
        ws.send(JSON.stringify(nextAction));
        break;
        
      case 'action_completed':
        await this.onActionCompleted(data.action, data.result);
        break;
        
      case 'phase_complete':
        await this.advancePhase();
        const newPhaseInfo = this.getCurrentPhaseInfo();
        ws.send(JSON.stringify({
          type: 'phase_changed',
          phase: this.projectState.currentPhase,
          info: newPhaseInfo
        }));
        break;
    }
  }
  
  async planNextAction() {
    // Simplified version - no actual AI calls yet
    const actions = [
      "create_drum_track",
      "create_bass_track", 
      "create_lead_track",
      "set_tempo_120",
      "create_basic_pattern"
    ];
    
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    return {
      type: 'execute_action',
      supervisor_plan: `Execute ${randomAction}`,
      worker_instruction: JSON.stringify({
        action: randomAction,
        parameters: {
          name: `AI Track ${Date.now()}`,
          bpm: 120
        },
        expectedResult: "Track created successfully"
      }),
      phase: this.projectState.currentPhase,
      timestamp: Date.now()
    };
  }
  
  async onActionCompleted(action, result) {
    this.projectState.lastAction = action;
    
    if (action.includes('create_track')) {
      this.projectState.tracksCreated.push(result.trackName || 'Unknown Track');
    }
    
    console.log(`Action completed: ${action}`);
    console.log('Project State:', this.projectState);
  }
  
  async advancePhase() {
    const currentPhase = this.projectState.currentPhase;
    const nextPhase = Math.min(currentPhase + 1, 6);
    
    console.log(`Advancing from Phase ${currentPhase} to ${nextPhase}`);
    
    this.projectState.currentPhase = nextPhase;
    this.projectState.lastAction = `advanced_to_phase_${nextPhase}`;
  }
  
  getCurrentPhaseInfo() {
    return {
      phase: this.projectState.currentPhase,
      description: `Phase ${this.projectState.currentPhase} - Music Production`
    };
  }
  
  async updateProjectState(newState) {
    this.projectState = { ...this.projectState, ...newState };
    console.log('Project state updated:', this.projectState);
  }
}

// Start the service
const service = new AIComposerService();

console.log('AI Composer Service started!');
console.log('Connect your M4L Device to ws://localhost:8080');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down AI Composer Service...');
  process.exit(0);
});