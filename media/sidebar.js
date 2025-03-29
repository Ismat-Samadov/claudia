// media/sidebar.js
(function() {
    // Get access to the VS Code API
    const vscode = acquireVsCodeApi();
    
    // Store state of recent questions
    let recentQuestions = [];
    
    // Cache DOM elements
    const questionInput = document.getElementById('question-input');
    const askButton = document.getElementById('ask-button');
    const analyzeButton = document.getElementById('analyze-button');
    const documentButton = document.getElementById('document-button');
    const explainButton = document.getElementById('explain-button');
    const questionsList = document.getElementById('questions-list');
    
    // Set up event listeners
    askButton.addEventListener('click', askQuestion);
    questionInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        askQuestion();
      }
    });
    
    analyzeButton.addEventListener('click', function() {
      vscode.postMessage({
        type: 'analyzeCode'
      });
    });
    
    documentButton.addEventListener('click', function() {
      vscode.postMessage({
        type: 'documentCode'
      });
    });
    
    explainButton.addEventListener('click', function() {
      vscode.postMessage({
        type: 'explainCode'
      });
    });
    
    // Handle messages from the extension
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.type) {
        case 'addRecentQuestion':
          addRecentQuestion(message.value);
          break;
      }
    });
    
    // Functions
    function askQuestion() {
      const question = questionInput.value.trim();
      if (question) {
        vscode.postMessage({
          type: 'askQuestion',
          value: question
        });
        
        questionInput.value = '';
      }
    }
    
    function addRecentQuestion(question) {
      // Add to the beginning of the array
      recentQuestions.unshift(question);
      
      // Keep only last 10 questions
      if (recentQuestions.length > 10) {
        recentQuestions.pop();
      }
      
      // Update the UI
      updateRecentQuestionsList();
    }
    
    function updateRecentQuestionsList() {
      // Clear current list
      questionsList.innerHTML = '';
      
      // Add recent questions to the list
      recentQuestions.forEach(question => {
        const li = document.createElement('li');
        li.textContent = question;
        li.title = question; // Show full question on hover
        
        // Add click handler to reuse this question
        li.addEventListener('click', function() {
          questionInput.value = question;
          questionInput.focus();
        });
        
        questionsList.appendChild(li);
      });
    }
    
    // Try to restore state if available
    try {
      const state = vscode.getState();
      if (state && state.recentQuestions) {
        recentQuestions = state.recentQuestions;
        updateRecentQuestionsList();
      }
    } catch (error) {
      console.error('Error restoring state:', error);
    }
  })();