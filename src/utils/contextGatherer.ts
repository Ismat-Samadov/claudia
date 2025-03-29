import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ContextGatherer {
  private maxFileSize: number;
  private maxTotalSize: number;
  private ignoredDirectories: string[];
  private fileExtensions: string[];
  
  constructor(private workspacePath: string) {
    const config = vscode.workspace.getConfiguration('claudia');
    this.maxFileSize = config.get('maxFileSize') || 100000; // Default 100KB per file
    this.maxTotalSize = config.get('maxTotalSize') || 1000000; // Default 1MB total
    this.ignoredDirectories = config.get('ignoredDirectories') || ['node_modules', '.git', 'dist', 'build'];
    this.fileExtensions = ['.ts', '.js', '.tsx', '.jsx', '.json', '.html', '.css', '.md', '.py', '.java', '.c', '.cpp', '.cs'];
  }
  
  /**
   * Gathers relevant context files for the current active file
   */
  async gatherContextForActiveFile(maxFiles: number = 10): Promise<string[]> {
    const context: string[] = [];
    let totalSize = 0;
    
    // Get active editor and file
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return context;
    }
    
    const currentFilePath = activeEditor.document.uri.fsPath;
    const currentFileContent = activeEditor.document.getText();
    
    // Add current file first
    const relativeCurrentPath = path.relative(this.workspacePath, currentFilePath);
    context.push(`File: ${relativeCurrentPath}\n\`\`\`\n${currentFileContent}\n\`\`\``);
    totalSize += currentFileContent.length;
    
    // Try to find related files
    const relatedFiles = await this.findRelatedFiles(currentFilePath);
    
    // Add related files up to limits
    for (const filePath of relatedFiles) {
      if (context.length >= maxFiles || totalSize >= this.maxTotalSize) {
        break;
      }
      
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxFileSize) {
          continue; // Skip files that are too large
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(this.workspacePath, filePath);
        
        context.push(`File: ${relPath}\n\`\`\`\n${content}\n\`\`\``);
        totalSize += content.length;
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }
    
    return context;
  }
  
  /**
   * Finds files related to the current file
   */
  private async findRelatedFiles(filePath: string): Promise<string[]> {
    const relatedFiles = new Set<string>();
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Extract imports/requires from the file
      const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
      const requireRegex = /require\(['"](.+?)['"]\)/g;
      
      let match;
      const importPaths = [];
      
      while ((match = importRegex.exec(fileContent)) !== null) {
        importPaths.push(match[1]);
      }
      
      while ((match = requireRegex.exec(fileContent)) !== null) {
        importPaths.push(match[1]);
      }
      
      // Resolve import paths to actual file paths
      for (const importPath of importPaths) {
        const resolved = await this.resolveImportPath(filePath, importPath);
        if (resolved) {
          relatedFiles.add(resolved);
        }
      }
      
      // Also add files in the same directory that might be related
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath, path.extname(filePath));
      
      // Look for related files with similar names
      try {
        const dirFiles = fs.readdirSync(dir);
        for (const file of dirFiles) {
          const fullPath = path.join(dir, file);
          
          // Skip directories and check if file is similar to current file
          if (
            fs.statSync(fullPath).isFile() &&
            this.fileExtensions.includes(path.extname(file)) &&
            file.includes(basename) &&
            fullPath !== filePath
          ) {
            relatedFiles.add(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
      
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
    }
    
    return Array.from(relatedFiles);
  }
  
  /**
   * Resolves an import path to an actual file path
   */
  private async resolveImportPath(sourcePath: string, importPath: string): Promise<string | null> {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const baseDir = path.dirname(sourcePath);
      const absolutePath = path.join(baseDir, importPath);
      
      // Try with different extensions
      for (const ext of this.fileExtensions) {
        const pathWithExt = absolutePath + ext;
        if (fs.existsSync(pathWithExt)) {
          return pathWithExt;
        }
      }
      
      // Try as directory with index file
      for (const ext of this.fileExtensions) {
        const indexPath = path.join(absolutePath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
    
    // Could expand this to handle non-relative imports using project configuration
    
    return null;
  }
}