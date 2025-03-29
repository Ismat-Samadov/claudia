# Claudia - Claude 3.7 Sonnet AI Assistant for VS Code

Claudia brings the power of Claude 3.7 Sonnet directly into your VS Code environment, providing intelligent code assistance without leaving your editor.

![Claudia Extension](media/claudia-icon.png)

## Features

- **Intelligent Code Understanding**: Claudia analyzes your code and its context to provide more relevant assistance
- **Quick Questions**: Ask Claude questions about your codebase directly from VS Code
- **Code Analysis**: Get insights on code quality, structure, and potential improvements
- **Documentation Generation**: Generate comprehensive documentation for your code
- **Code Explanation**: Select any code snippet and have Claude explain what it does

## Installation

You can install Claudia from the Visual Studio Code Marketplace:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Claudia"
4. Click "Install"

Alternatively, download the VSIX file from the [releases page](https://github.com/ismat-samadov/claudia/releases) and install it manually:

```bash
code --install-extension claudia-0.0.1.vsix
```

## Setup

Before using Claudia, you need to configure your Claude API key:

1. Get an API key from [Anthropic](https://console.anthropic.com/)
2. Open VS Code settings (Ctrl+, or Cmd+,)
3. Search for "claudia.apiKey"
4. Enter your API key

## Usage

### Using the Sidebar

Claudia adds a sidebar to VS Code that you can access by clicking the Claudia icon in the activity bar.

From the sidebar, you can:
- Ask questions about your code
- Analyze the current file
- Generate documentation for the current file
- View your recent questions

### Using Commands

Claudia provides several commands that you can access through the command palette (Ctrl+Shift+P or Cmd+Shift+P):

- **Claudia: Test Claude API Connection** - Verify your Claude API connection
- **Claudia: Ask Claude About Your Code** - Ask a question about your code
- **Claudia: Explain Selected Code** - Get an explanation of selected code

### Context Menu

When you select code in the editor, you can right-click and select "Claudia: Explain Selected Code" to get an explanation.

## Configuration

Claudia can be configured through VS Code settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `claudia.apiKey` | Your Claude API key | `""` |
| `claudia.maxFilesToInclude` | Maximum number of files to include in context | `10` |
| `claudia.ignoredDirectories` | Directories to ignore when gathering context | `["node_modules", ".git", "dist", "build"]` |
| `claudia.maxFileSize` | Maximum size of files to include in context (bytes) | `100000` |
| `claudia.maxTotalSize` | Maximum total size of context to send to Claude (bytes) | `1000000` |

## Examples

### Asking Questions

Type your question in the sidebar input field and press "Ask" or Enter. For example:
- "How can I improve the error handling in this file?"
- "What design patterns are being used here?"
- "How can I refactor this function to be more efficient?"

### Analyzing Code

Click the "Analyze Current File" button in the sidebar to get insights on your current file's structure, quality, and potential improvements.

### Getting Code Explanations

Select a piece of code, right-click, and choose "Claudia: Explain Selected Code" to get a detailed explanation of what the code does.

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/ismat-samadov/claudia.git
cd claudia

# Install dependencies
npm install

# Build the extension
npm run compile

# Package the extension
npm run package
```

### Running Tests

```bash
npm run test
```

## Privacy & Security

Claudia sends code snippets and context to the Claude API to generate responses. This may include:

- The content of the active file
- Related files in your workspace for context
- Your specific queries and questions

Your API key is stored in VS Code's secure storage and is only used to authenticate with the Claude API.

## Limitations

- Large files may be truncated due to API context limits
- Code understanding is dependent on Claude's capabilities
- Currently supports TypeScript, JavaScript, Python, and other common languages

## License

[MIT License](LICENSE)

## Feedback and Contributions

Feedback and contributions are welcome! Please submit issues and pull requests on the [GitHub repository](https://github.com/ismat-samadov/claudia).

## Credits

- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- Powered by [Claude 3.7 Sonnet](https://www.anthropic.com/claude)