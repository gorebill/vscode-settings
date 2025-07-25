/*
 * Copyright (c) 2025 gorebill. All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface ConfigFileItem {
    label: string;
    description: string;
    fileName: string;
    exists: boolean;
}

interface ProjectType {
    name: string;
    detected: boolean;
    files: string[];
    patterns: string[];
    confidence: number;
}

interface ConfigTemplate {
    name: string;
    description: string;
    content: any;
    applicableTypes: string[];
}

// Configuration documentation database
const configDocs = {
    'editor.tabSize': {
        description: 'The number of spaces a tab is equal to. This setting is overridden based on the file contents when editor.detectIndentation is true.',
        type: 'number',
        default: '4'
    },
    'editor.insertSpaces': {
        description: 'Insert spaces when pressing Tab. This setting is overridden based on the file contents when editor.detectIndentation is true.',
        type: 'boolean',
        default: 'true'
    },
    'editor.fontSize': {
        description: 'Controls the font size in pixels.',
        type: 'number',
        default: '14'
    },
    'editor.fontFamily': {
        description: 'Controls the font family.',
        type: 'string',
        default: 'Consolas, "Courier New", monospace'
    },
    'editor.fontWeight': {
        description: 'Controls the font weight. Accepts normal and bold keywords or numbers between 1 and 1000.',
        type: 'string|number',
        default: 'normal',
        enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        enumDescriptions: {
            'normal': 'Normal font weight (equivalent to 400)',
            'bold': 'Bold font weight (equivalent to 700)',
            '100': 'Thin',
            '200': 'Extra Light',
            '300': 'Light',
            '400': 'Normal',
            '500': 'Medium',
            '600': 'Semi Bold',
            '700': 'Bold',
            '800': 'Extra Bold',
            '900': 'Black'
        }
    },
    'editor.wordWrap': {
        description: 'Controls how lines should wrap.',
        type: 'string',
        default: 'off',
        enum: ['off', 'on', 'wordWrapColumn', 'bounded'],
        enumDescriptions: {
            'off': 'Lines will never wrap',
            'on': 'Lines will wrap at the viewport width',
            'wordWrapColumn': 'Lines will wrap at editor.wordWrapColumn',
            'bounded': 'Lines will wrap at min(viewport, editor.wordWrapColumn)'
        }
    },
    'editor.lineNumbers': {
        description: 'Controls the display of line numbers.',
        type: 'string',
        default: 'on',
        enum: ['off', 'on', 'relative', 'interval'],
        enumDescriptions: {
            'off': 'Line numbers are not rendered',
            'on': 'Line numbers are rendered as absolute number',
            'relative': 'Line numbers are rendered as distance to cursor line',
            'interval': 'Line numbers are rendered every 10 lines'
        }
    },
    'editor.minimap.enabled': {
        description: 'Controls whether the minimap is shown.',
        type: 'boolean',
        default: 'true'
    },
    'editor.formatOnSave': {
        description: 'Format a file on save. A formatter must be available.',
        type: 'boolean',
        default: 'false'
    },
    'editor.formatOnPaste': {
        description: 'Format the line after typing. Requires a formatter to be available.',
        type: 'boolean',
        default: 'false'
    },
    'editor.bracketPairColorization.enabled': {
        description: 'Controls whether bracket pair colorization is enabled or not.',
        type: 'boolean',
        default: 'true'
    },
    'files.autoSave': {
        description: 'Controls auto save of dirty editors.',
        type: 'string',
        default: 'off',
        enum: ['off', 'afterDelay', 'onFocusChange', 'onWindowChange'],
        enumDescriptions: {
            'off': 'An editor with changes is never automatically saved',
            'afterDelay': 'An editor with changes is automatically saved after the configured files.autoSaveDelay',
            'onFocusChange': 'An editor with changes is automatically saved when the editor loses focus',
            'onWindowChange': 'An editor with changes is automatically saved when the window loses focus'
        }
    },
    'files.autoSaveDelay': {
        description: 'Controls the delay in ms after which a dirty editor is saved automatically.',
        type: 'number',
        default: '1000'
    },
    'files.exclude': {
        description: 'Configure glob patterns for excluding files and folders.',
        type: 'object',
        default: '{}'
    },
    'files.trimTrailingWhitespace': {
        description: 'When enabled, will trim trailing whitespace when saving a file.',
        type: 'boolean',
        default: 'false'
    },
    'workbench.colorTheme': {
        description: 'Specifies the color theme used in the workbench.',
        type: 'string',
        default: 'Default Dark+'
    },
    'workbench.iconTheme': {
        description: 'Specifies the icon theme used in the workbench.',
        type: 'string',
        default: 'vs-seti'
    },
    'workbench.startupEditor': {
        description: 'Controls which editor is shown at startup.',
        type: 'string',
        default: 'welcomePage',
        enum: ['none', 'welcomePage', 'readme', 'newUntitledFile', 'welcomePageInEmptyWorkbench'],
        enumDescriptions: {
            'none': 'Start without an editor',
            'welcomePage': 'Open the Welcome page',
            'readme': 'Open the README when opening a folder that contains one',
            'newUntitledFile': 'Open a new untitled file',
            'welcomePageInEmptyWorkbench': 'Open the Welcome page when opening an empty workbench'
        }
    },
    'workbench.editor.enablePreview': {
        description: 'Controls whether opened editors show as preview editors.',
        type: 'boolean',
        default: 'true'
    },
    'workbench.activityBar.visible': {
        description: 'Controls the visibility of the activity bar in the workbench.',
        type: 'boolean',
        default: 'true'
    },
    'terminal.integrated.fontSize': {
        description: 'Controls the font size in pixels of the terminal.',
        type: 'number',
        default: '14'
    },
    'git.enabled': {
        description: 'Whether git is enabled.',
        type: 'boolean',
        default: 'true'
    },
    'git.autofetch': {
        description: 'Whether auto fetching is enabled.',
        type: 'boolean',
        default: 'false'
    },
    // Launch.json configuration documentation
    'name': {
        description: 'Name of the configuration; appears in the launch configuration dropdown menu.',
        type: 'string',
        default: 'Launch Program'
    },
    'type': {
        description: 'Type of configuration launcher to use.',
        type: 'string',
        default: 'node',
        enum: ['node', 'chrome', 'extensionHost', 'python', 'go', 'java', 'php', 'ruby', 'lldb', 'cppdbg', 'coreclr'],
        enumDescriptions: {
            'node': 'For debugging Node.js applications',
            'chrome': 'For debugging web applications in Chrome',
            'extensionHost': 'For debugging VS Code extensions',
            'python': 'For debugging Python applications',
            'go': 'For debugging Go applications',
            'java': 'For debugging Java applications',
            'php': 'For debugging PHP applications',
            'ruby': 'For debugging Ruby applications',
            'lldb': 'For debugging C/C++/Objective-C applications with LLDB',
            'cppdbg': 'For debugging C/C++ applications with GDB/LLDB',
            'coreclr': 'For debugging .NET Core applications'
        }
    },
    'request': {
        description: 'Request type of the configuration.',
        type: 'string',
        default: 'launch',
        enum: ['launch', 'attach'],
        enumDescriptions: {
            'launch': 'Launch a new instance of the program',
            'attach': 'Attach to an already running instance'
        }
    },
    'program': {
        description: 'Absolute path to the program.',
        type: 'string',
        default: '${workspaceFolder}/app.js'
    },
    'args': {
        description: 'Command line arguments passed to the program.',
        type: 'array',
        default: '[]'
    },
    'cwd': {
        description: 'Absolute path to the working directory of the program being debugged.',
        type: 'string',
        default: '${workspaceFolder}'
    },
    'env': {
        description: 'Environment variables passed to the program.',
        type: 'object',
        default: '{}'
    },
    'console': {
        description: 'Where to launch the debug target.',
        type: 'string',
        default: 'integratedTerminal',
        enum: ['internalConsole', 'integratedTerminal', 'externalTerminal'],
        enumDescriptions: {
            'internalConsole': 'VS Code Debug Console',
            'integratedTerminal': 'VS Code\'s integrated terminal',
            'externalTerminal': 'External terminal'
        }
    },
    'port': {
        description: 'Debug port to attach to.',
        type: 'number',
        default: '9229'
    },
    'skipFiles': {
        description: 'An array of glob patterns to skip when debugging.',
        type: 'array',
        default: '[]'
    },
    'stopOnEntry': {
        description: 'Automatically stop after launch.',
        type: 'boolean',
        default: 'false'
    },
    'sourceMaps': {
        description: 'Use JavaScript source maps (if they exist).',
        type: 'boolean',
        default: 'true'
    },
    'version': {
        description: 'Version of the debug configuration format.',
        type: 'string',
        default: '0.2.0'
    },
    'configurations': {
        description: 'List of configurations. Each configuration is a separate debug session.',
        type: 'array',
        default: '[]'
    },
    // Extensions.json specific
    'recommendations': {
        description: 'List of extensions recommended for users of this workspace.',
        type: 'array',
        default: '[]'
    },
    'unwantedRecommendations': {
        description: 'List of extensions not recommended for users of this workspace.',
        type: 'array',
        default: '[]'
    }
};

// Function to get configuration documentation
function getConfigDocumentation(key: string): { description: string, type: string, default?: string, enum?: string[], enumDescriptions?: Record<string, string> } {
    return (configDocs as any)[key] || {
        description: 'No documentation available for this configuration.',
        type: 'unknown'
    };
}

// Function to check if current file is a config file we manage
function isConfigFile(filePath: string): boolean {
    const configFileNames = ['settings.json', 'launch.json', 'extensions.json'];
    const fileName = path.basename(filePath);
    const isInVscodeDir = filePath.includes('.vscode');
    return isInVscodeDir && configFileNames.includes(fileName);
}

// Function to get JSON property at cursor position
function getPropertyAtPosition(document: vscode.TextDocument, position: vscode.Position): { key: string, value: string } | null {
    try {
        const text = document.getText();
        const currentLineText = document.lineAt(position.line).text;
        
        // Try to extract key from current line
        const keyValuePattern = /"([^"]+)"\s*:\s*(.+?)(?:,\s*$|$)/;
        const keyOnlyPattern = /"([^"]+)"/;
        
        const kvMatch = currentLineText.match(keyValuePattern);
        if (kvMatch) {
            return { key: kvMatch[1], value: kvMatch[2].trim() };
        }
        
        const keyMatch = currentLineText.match(keyOnlyPattern);
        if (keyMatch) {
            return { key: keyMatch[1], value: 'undefined' };
        }
        
        return null;
    } catch (error) {
        console.log('Error in getPropertyAtPosition:', error);
        return null;
    }
}

class ConfigFile extends vscode.TreeItem {
    constructor(
        public readonly config: ConfigFileItem,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(config.label, collapsibleState);
        
        this.tooltip = config.description;
        this.contextValue = config.exists ? 'configFile' : 'missingConfigFile';
        
        if (config.exists) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.description = 'exists';
            this.command = {
                command: 'vscode-settings.openConfigFile',
                title: 'Open Config File',
                arguments: [config.fileName]
            };
        } else {
            this.iconPath = new vscode.ThemeIcon('file-add', new vscode.ThemeColor('errorForeground'));
            this.description = 'missing';
            this.command = {
                command: 'vscode-settings.createConfigFile',
                title: 'Create Config File',
                arguments: [config.fileName]
            };
        }
    }
}

class ConfigFilesProvider implements vscode.TreeDataProvider<ConfigFile> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConfigFile | undefined | null | void> = new vscode.EventEmitter<ConfigFile | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConfigFile | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ConfigFile): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConfigFile): Thenable<ConfigFile[]> {
        if (!element) {
            const items = this.getConfigFiles();
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }

    private getConfigFiles(): ConfigFile[] {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }

        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const configFiles = [
            { fileName: 'settings.json', label: 'Settings', description: 'Workspace settings configuration' },
            { fileName: 'launch.json', label: 'Launch', description: 'Debug configuration' },
            { fileName: 'extensions.json', label: 'Extensions', description: 'Extension recommendations' }
        ];

        return configFiles.map(config => {
            const filePath = path.join(vscodeDir, config.fileName);
            const exists = fs.existsSync(filePath);
            return new ConfigFile(
                { ...config, exists },
                vscode.TreeItemCollapsibleState.None
            );
        });
    }
}

class HelloWorldProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private content: vscode.TreeItem[] = [];

    updateContent(key: string, value: string, description: string, type?: string, enumValues?: string[], enumDescriptions?: Record<string, string>): void {
        this.content = [
            new vscode.TreeItem(`${key}: ${value}`, vscode.TreeItemCollapsibleState.Expanded),
            new vscode.TreeItem(`Type: ${type || 'unknown'}`, vscode.TreeItemCollapsibleState.None),
            new vscode.TreeItem(`Description: ${description}`, vscode.TreeItemCollapsibleState.None)
        ];

        if (enumValues && enumValues.length > 0) {
            const enumItem = new vscode.TreeItem('Possible Values:', vscode.TreeItemCollapsibleState.Expanded);
            this.content.push(enumItem);
            enumValues.forEach(enumValue => {
                const desc = enumDescriptions?.[enumValue] || '';
                this.content.push(new vscode.TreeItem(`  ${enumValue}${desc ? ': ' + desc : ''}`, vscode.TreeItemCollapsibleState.None));
            });
        }

        this._onDidChangeTreeData.fire();
    }

    clearContent(): void {
        this.content = [];
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            return Promise.resolve(this.content);
        }
        return Promise.resolve([]);
    }
}

class ProjectAnalyzer {
    async analyzeProject(workspacePath: string): Promise<ProjectType[]> {
        const projectTypes: ProjectType[] = [
            {
                name: 'Node.js',
                detected: false,
                files: ['package.json'],
                patterns: ['node_modules/', '*.js', '*.ts'],
                confidence: 0
            },
            {
                name: 'React',
                detected: false,
                files: ['package.json'],
                patterns: ['src/', 'public/', '*.jsx', '*.tsx'],
                confidence: 0
            },
            {
                name: 'Python',
                detected: false,
                files: ['requirements.txt', 'setup.py', 'pyproject.toml'],
                patterns: ['*.py', '__pycache__/'],
                confidence: 0
            }
        ];

        for (const type of projectTypes) {
            let detectedFiles = 0;
            let detectedPatterns = 0;

            // Check for key files
            for (const file of type.files) {
                const filePath = path.join(workspacePath, file);
                if (fs.existsSync(filePath)) {
                    detectedFiles++;
                }
            }

            // Check for patterns (simplified)
            try {
                const files = fs.readdirSync(workspacePath);
                for (const pattern of type.patterns) {
                    if (pattern.endsWith('/')) {
                        // Directory pattern
                        if (files.some(f => f === pattern.slice(0, -1))) {
                            detectedPatterns++;
                        }
                    } else if (pattern.includes('*')) {
                        // File pattern
                        const regex = new RegExp(pattern.replace('*', '.*'));
                        if (files.some(f => regex.test(f))) {
                            detectedPatterns++;
                        }
                    }
                }
            } catch (error) {
                console.error('Error reading workspace directory:', error);
            }

            // Calculate confidence
            const totalChecks = type.files.length + type.patterns.length;
            const totalDetected = detectedFiles + detectedPatterns;
            type.confidence = totalChecks > 0 ? (totalDetected / totalChecks) * 100 : 0;
            type.detected = type.confidence > 30; // 30% threshold
        }

        return projectTypes;
    }
}

class ProjectRecommendationsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return [new vscode.TreeItem('No workspace folder found', vscode.TreeItemCollapsibleState.None)];
            }

            const analyzer = new ProjectAnalyzer();
            const analysis = await analyzer.analyzeProject(workspaceFolder.uri.fsPath);
            
            const items: vscode.TreeItem[] = [
                new vscode.TreeItem('Project Analysis', vscode.TreeItemCollapsibleState.Expanded)
            ];

            const detectedTypes = analysis.filter(type => type.detected);
            if (detectedTypes.length > 0) {
                items.push(new vscode.TreeItem('Detected Technologies:', vscode.TreeItemCollapsibleState.Expanded));
                detectedTypes.forEach(type => {
                    items.push(new vscode.TreeItem(`${type.name} (${type.confidence.toFixed(1)}%)`, vscode.TreeItemCollapsibleState.None));
                });
            } else {
                items.push(new vscode.TreeItem('No specific project type detected', vscode.TreeItemCollapsibleState.None));
            }

            return items;
        }
        return [];
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 VS Code Settings Extension ACTIVATED!');

    // Create providers
    const configFilesProvider = new ConfigFilesProvider();
    const helloWorldProvider = new HelloWorldProvider();
    const projectRecommendationsProvider = new ProjectRecommendationsProvider();

    // Register tree data providers
    vscode.window.createTreeView('vscode-settings.configFiles', {
        treeDataProvider: configFilesProvider
    });

    vscode.window.createTreeView('vscode-settings.helloWorld', {
        treeDataProvider: helloWorldProvider
    });

    vscode.window.createTreeView('vscode-settings.projectRecommendations', {
        treeDataProvider: projectRecommendationsProvider
    });

    // Register commands
    const openConfigFileCommand = vscode.commands.registerCommand('vscode-settings.openConfigFile', (fileName: string) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const filePath = path.join(vscodeDir, fileName);
        const fileUri = vscode.Uri.file(filePath);

        vscode.workspace.openTextDocument(fileUri).then(doc => {
            vscode.window.showTextDocument(doc);
        }, (err: any) => {
            vscode.window.showErrorMessage(`Failed to open file: ${err.message}`);
        });
    });

    const createConfigFileCommand = vscode.commands.registerCommand('vscode-settings.createConfigFile', async (fileName: string) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const filePath = path.join(vscodeDir, fileName);

        try {
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir, { recursive: true });
            }

            let initialContent = '';
            switch (fileName) {
                case 'settings.json':
                    initialContent = '{\n    \n}';
                    break;
                case 'launch.json':
                    initialContent = '{\n    "version": "0.2.0",\n    "configurations": [\n        \n    ]\n}';
                    break;
                case 'extensions.json':
                    initialContent = '{\n    "recommendations": [\n        \n    ]\n}';
                    break;
                default:
                    initialContent = '{\n    \n}';
            }

            fs.writeFileSync(filePath, initialContent, 'utf8');
            configFilesProvider.refresh();

            const fileUri = vscode.Uri.file(filePath);
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`Created ${fileName}`);
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to create file: ${err.message}`);
        }
    });

    const applyConfigTemplateCommand = vscode.commands.registerCommand('vscode-settings.applyConfigTemplate', async (template: ConfigTemplate) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const settingsPath = path.join(vscodeDir, 'settings.json');
        
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }
        
        let existingSettings = {};
        if (fs.existsSync(settingsPath)) {
            try {
                const content = fs.readFileSync(settingsPath, 'utf8');
                existingSettings = JSON.parse(content);
            } catch (error) {
                console.error('Failed to parse existing settings:', error);
            }
        }
        
        const mergedSettings = { ...existingSettings, ...template.content };
        
        try {
            fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 4));
            vscode.window.showInformationMessage(`Applied ${template.name} configuration template`);
            
            const fileUri = vscode.Uri.file(settingsPath);
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply template: ${error}`);
        }
    });

    const createRecommendedSettingsCommand = vscode.commands.registerCommand('vscode-settings.createRecommendedSettings', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const analyzer = new ProjectAnalyzer();
        const analysis = await analyzer.analyzeProject(workspaceFolder.uri.fsPath);
        
        const detectedTypes = analysis.filter(type => type.detected);
        if (detectedTypes.length === 0) {
            vscode.window.showInformationMessage('No specific project type detected. You can manually select a configuration template.');
            return;
        }

        const primaryType = detectedTypes.reduce((prev, current) => 
            (prev.confidence > current.confidence) ? prev : current
        );

        vscode.window.showInformationMessage(`Detected ${primaryType.name} project. Creating recommended settings...`);
    });

    const refreshProjectAnalysisCommand = vscode.commands.registerCommand('vscode-settings.refreshProjectAnalysis', () => {
        projectRecommendationsProvider.refresh();
        vscode.window.showInformationMessage('Project analysis refreshed');
    });

    // Function to update Prop. Helper content based on cursor position
    function updatePropHelperContent() {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor || !isConfigFile(activeEditor.document.uri.fsPath)) {
            helloWorldProvider.clearContent();
            return;
        }

        const position = activeEditor.selection.active;
        const property = getPropertyAtPosition(activeEditor.document, position);
        
        if (property) {
            const doc = getConfigDocumentation(property.key);
            helloWorldProvider.updateContent(
                property.key,
                property.value,
                doc.description,
                doc.type,
                doc.enum,
                doc.enumDescriptions
            );
        } else {
            helloWorldProvider.clearContent();
        }
    }

    // Function to update Prop. Helper visibility
    function updatePropHelperVisibility() {
        const activeEditor = vscode.window.activeTextEditor;
        let showHelper = false;
        
        if (activeEditor && activeEditor.document.uri.scheme === 'file') {
            const filePath = activeEditor.document.uri.fsPath;
            showHelper = isConfigFile(filePath);
        }
        
        vscode.commands.executeCommand('setContext', 'vscode-settings.showPropHelper', showHelper);
        
        if (showHelper) {
            updatePropHelperContent();
        } else {
            helloWorldProvider.clearContent();
        }
    }

    // Initial setup
    updatePropHelperVisibility();

    // Event listeners
    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
        updatePropHelperVisibility();
    });

    const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.textEditor && isConfigFile(event.textEditor.document.uri.fsPath)) {
            updatePropHelperContent();
        }
    });

    const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document === event.document && isConfigFile(event.document.uri.fsPath)) {
            updatePropHelperContent();
        }
    });

    const documentOpenDisposable = vscode.workspace.onDidOpenTextDocument(() => {
        updatePropHelperVisibility();
    });

    const documentCloseDisposable = vscode.workspace.onDidCloseTextDocument(() => {
        updatePropHelperVisibility();
    });

    // Add all disposables to context
    context.subscriptions.push(
        openConfigFileCommand,
        createConfigFileCommand,
        applyConfigTemplateCommand,
        createRecommendedSettingsCommand,
        refreshProjectAnalysisCommand,
        activeEditorDisposable,
        selectionChangeDisposable,
        documentChangeDisposable,
        documentOpenDisposable,
        documentCloseDisposable
    );
}

export function deactivate() {}
