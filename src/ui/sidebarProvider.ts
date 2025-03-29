import * as vscode from 'vscode';
import { ClaudeService } from '../services/claudeService';

export class ClaudiaSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'claudia.sidebar';
  private _view?: vscode.WebviewView;
  
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _claudeService: ClaudeService
  ) {}
  
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async data => {
      switch (data.type) {
        case 'askQuestion':
          this._handleAskQuestion(data.value);
          break;
        case 'analyzeCode':
          this._analyzeCurrentFile();
          break;
        case 'documentCode':
          this._documentCurrentFile();
          break;
        case 'explainCode':
          this._explainSelectedCode();
          break;
      }
    });
  }
  
  private _getHtmlForWebview(webview: vscode.Webview) {
    // Create URIs for scripts/styles
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css')
    );
    
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.js')
    );
    
    // Use a nonce to allow only specific scripts to be run
    const nonce = this._getNonce();
    
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Claudia Assistant</title>
      </head>
      <body>
        <div class="container">
          <h2>Claudia Assistant</h2>
          
          <div class="input-container">
            <input type="text" id="question-input" placeholder="Ask Claude about your code...">
            <button id="ask-button">Ask</button>
          </div>
          
          <div class="actions">
            <button id="analyze-button">Analyze Current File</button>
            <button id="document-button">Document Code</button>
            <button id="explain-button">Explain Selection</button>
          </div>
          
          <div class="recent-questions">
            <h3>Recent Questions</h3>
            <ul id="questions-list">
              <!-- Will be populated dynamically -->
            </ul>
          </div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
  
  private _getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  
  private async _handleAskQuestion(question: string) {
    if (!question) {
      return;
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
        
        // Create context gatherer
        const contextGatherer = new (await import('../utils/contextGatherer')).ContextGatherer(workspacePath);
        
        // Gather context
        progress.report({ message: "Gathering context..." });
        const context = await contextGatherer.gatherContextForActiveFile();
        
        progress.report({ message: "Getting response from Claude..." });
        const response = await this._claudeService.queryWithContext(question, context);
        
        // Create a new document to show the response
        const document = await vscode.workspace.openTextDocument({
          content: `# Claude's Response to: ${question}\n\n${response}`,
          language: 'markdown'
        });
        
        await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });
        
        // Update the list of recent questions in the webview
        this._updateRecentQuestions(question);
      } catch (error) {
        vscode.window.showErrorMessage(`Claude API error: ${error}`);
      }
    });
  }
  
  private _updateRecentQuestions(question: string) {
    if (this._view) {
      this._view.webview.postMessage({ 
        type: 'addRecentQuestion', 
        value: question 
      });
    }
  }
  
  private async _analyzeCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No file open to analyze');
      return;
    }
    
    const fileContent = editor.document.getText();
    const fileName = editor.document.fileName.split('/').pop();
    
    const prompt = `Please analyze this code file "${fileName}" and provide insights on its structure, quality, and potential improvements:\n\n\`\`\`\n${fileContent}\n\`\`\``;
    
    this._handleAskQuestion(prompt);
  }
  
  private async _documentCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No file open to document');
      return;
    }
    
    const fileContent = editor.document.getText();
    const fileName = editor.document.fileName.split('/').pop();
    
    const prompt = `Please generate comprehensive documentation for this code file "${fileName}":\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nInclude function descriptions, parameters, return values, and examples where appropriate.`;
    
    this._handleAskQuestion(prompt);
  }
  
  private async _explainSelectedCode() {
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
    const fileName = editor.document.fileName.split('/').pop();
    const fileExtension = fileName?.split('.').pop();
    
    const prompt = `Please explain this code snippet from a ${fileExtension} file and how it works:\n\n\`\`\`\n${text}\n\`\`\``;
    
    this._handleAskQuestion(prompt);
  }
}