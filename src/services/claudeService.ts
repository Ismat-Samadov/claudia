import * as vscode from 'vscode';
import axios from 'axios';

export class ClaudeService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-3-7-sonnet-20250219';
  
  constructor() {
    const config = vscode.workspace.getConfiguration('claudia');
    this.apiKey = config.get('apiKey') || '';
    
    if (!this.apiKey) {
      vscode.window.showWarningMessage('Claude API key not found. Please configure it in settings.');
    }
  }
  
  async queryWithContext(prompt: string, context: string[] = []): Promise<string> {
    try {
      // Format context files into a coherent system message
      const systemMessage = this.formatContextAsSystemMessage(context);
      
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          system: systemMessage,
          max_tokens: 4000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      return response.data.content[0].text;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw new Error('Failed to get response from Claude');
    }
  }
  
  private formatContextAsSystemMessage(context: string[]): string {
    if (context.length === 0) {
      return 'You are a coding assistant helping with VS Code development.';
    }
    
    // Create a system message with file contents
    let systemMessage = 'You are a coding assistant with access to the following project files:\n\n';
    
    // Add each file with a reasonable format
    context.forEach((fileContext, index) => {
      systemMessage += `FILE ${index + 1}:\n${fileContext}\n\n`;
    });
    
    systemMessage += 'Provide advice, explanations, and code suggestions based on these files. Reference specific files by their names when relevant.';
    
    return systemMessage;
  }
}
