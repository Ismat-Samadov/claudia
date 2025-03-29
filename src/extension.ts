import * as vscode from 'vscode';
import { ClaudeService } from './services/claudeService';
import { ContextGatherer } from './utils/contextGatherer';
import { ClaudiaSidebarProvider } from './ui/sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Claudia extension is now active!');
  
  // Initialize the Claude service
  const claudeService = new ClaudeService();
  
  // Register the sidebar view provider
  const sidebarProvider = new ClaudiaSidebarProvider(context.extensionUri, claudeService);
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'claudia.sidebar',
      sidebarProvider
    )
  );
  
  // Register a simple command to test Claude API
  const testClaudeCommand = vscode.commands.registerCommand('claudia.testClaudeAPI', async () => {
    const apiKey = vscode.workspace.getConfiguration('claudia').get('apiKey');
    
    if (!apiKey) {
      const setKey = 'Configure API Key';
      const response = await vscode.window.showErrorMessage(
        'Claude API key not found. Please configure it in settings.',
        setKey
      );
      
      if (response === setKey) {
        vscode.commands.executeCommand('workbench.action.openSettings', 'claudia.apiKey');
      }
      return;
    }
    
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Testing Claude API connection...",
      cancellable: false
    }, async (progress) => {
      try {
        const response = await claudeService.queryWithContext("Hello! Please respond with a short confirmation that you're connected to VS Code.");
        vscode.window.showInformationMessage(`Claude API test successful: ${response.substring(0, 100)}...`);
      } catch (error) {
        vscode.window.showErrorMessage(`Claude API test failed: ${error}`);
      }
    });
  });
  
  // Register a command to ask Claude a question about the current file
  const askClaudeCommand = vscode.commands.registerCommand('claudia.askClaude', async () => {
    const question = await vscode.window.showInputBox({
      prompt: 'What would you like to ask Claude about your code?'
    });
    
    if (!question) {
      return; // User cancelled the input
    }
    
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Claude is thinking...",
      cancellable: false
    }, async (progress) => {
      try {
        // Get workspace path
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          throw new Error('No workspace is open');
        }
        
        const workspacePath = workspaceFolders[0].uri.fsPath;
        
        // Gather context
        progress.report({ message: "Gathering context..." });
        const contextGatherer = new ContextGatherer(workspacePath);
        const context = await contextGatherer.gatherContextForActiveFile();
        
        progress.report({ message: "Getting response from Claude..." });
        const response = await claudeService.queryWithContext(question, context);
        
        // Create a new document to show the response
        const document = await vscode.workspace.openTextDocument({
          content: `# Claude's Response\n\n${response}`,
          language: 'markdown'
        });
        
        await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });
      } catch (error) {
        vscode.window.showErrorMessage(`Claude API error: ${error}`);
      }
    });
  });
  
  // Register a command to explain the selected code
  const explainSelectionCommand = vscode.commands.registerCommand('claudia.explainSelection', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No editor is active');
      return;
    }
    
    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('No code selected');
      return;
    }
    
    const text = editor.document.getText(selection);
    const fileName = editor.document.fileName;
    const fileExtension = fileName.split('.').pop();
    
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Claude is analyzing your code...",
      cancellable: false
    }, async (progress) => {
      try {
        const prompt = `Please explain this code snippet from a ${fileExtension} file and how it works:\n\n\`\`\`\n${text}\n\`\`\``;
        
        const response = await claudeService.queryWithContext(prompt);
        
        // Create a new document to show the response
        const document = await vscode.workspace.openTextDocument({
          content: `# Code Explanation\n\n${response}`,
          language: 'markdown'
        });
        
        await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });
      } catch (error) {
        vscode.window.showErrorMessage(`Claude API error: ${error}`);
      }
    });
  });
  
  // Add all commands to subscription
  context.subscriptions.push(
    testClaudeCommand, 
    askClaudeCommand,
    explainSelectionCommand
  );
  
  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get('claudia.hasShownWelcome');
  if (!hasShownWelcome) {
    vscode.window.showInformationMessage(
      'Claudia is now active! Configure your Claude API key in settings to get started.',
      'Open Settings',
      'View Documentation'
    ).then(selection => {
      if (selection === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'claudia.apiKey');
      } else if (selection === 'View Documentation') {
        // Change this URL to your repository's documentation
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/yourusername/claudia/blob/main/README.md'));
      }
    });
    
    context.globalState.update('claudia.hasShownWelcome', true);
  }
}

export function deactivate() {}