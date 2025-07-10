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
            // Add command for opening existing file
            this.command = {
                command: 'vscode-settings.openConfigFile',
                title: 'Open Config File',
                arguments: [config.fileName]
            };
        } else {
            this.iconPath = new vscode.ThemeIcon('file-add', new vscode.ThemeColor('errorForeground'));
            this.description = 'missing';
            // Add command for creating new file
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

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ConfigFile): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConfigFile): Thenable<ConfigFile[]> {
        if (!element) {
            const configFiles = this.getConfigFiles();
            
            // Create a help/info item at the top
            const helpItem = new ConfigFile({
                label: 'Configuration files will appear here',
                description: 'Info',
                fileName: '',
                exists: true
            }, vscode.TreeItemCollapsibleState.None);
            
            helpItem.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('descriptionForeground'));
            helpItem.description = '';
            helpItem.contextValue = 'helpItem';
            helpItem.tooltip = 'VS Code configuration files for this workspace';
            
            return Promise.resolve([helpItem, ...configFiles]);
        }
        return Promise.resolve([]);
    }

    private getConfigFiles(): ConfigFile[] {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }

        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        
        const configFiles: ConfigFileItem[] = [
            { label: 'settings.json', description: 'Workspace settings', fileName: 'settings.json', exists: false },
            { label: 'launch.json', description: 'Debug configurations', fileName: 'launch.json', exists: false },
            { label: 'extensions.json', description: 'Recommended extensions', fileName: 'extensions.json', exists: false }
        ];

        // Check which files exist
        configFiles.forEach(config => {
            const filePath = path.join(vscodeDir, config.fileName);
            config.exists = fs.existsSync(filePath);
        });

        // Sort by existence (existing files first)
        configFiles.sort((a, b) => {
            if (a.exists && !b.exists) return -1;
            if (!a.exists && b.exists) return 1;
            return a.label.localeCompare(b.label);
        });

        return configFiles.map(config => new ConfigFile(config, vscode.TreeItemCollapsibleState.None));
    }
}

class HelloWorldProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private currentKey: string = '';
    private currentValue: string = '';
    private currentDescription: string = '';
    private currentValueType: string = '';
    private currentEnumValues?: string[];
    private currentEnumDescriptions?: Record<string, string>;
    private hasContent: boolean = false;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateContent(key: string, value: string, description: string = '', valueType: string = '', enumValues?: string[], enumDescriptions?: Record<string, string>) {
        this.currentKey = key;
        this.currentValue = value;
        this.currentDescription = description;
        this.currentValueType = valueType;
        this.currentEnumValues = enumValues;
        this.currentEnumDescriptions = enumDescriptions;
        this.hasContent = true;
        this.refresh();
    }

    clearContent() {
        this.currentKey = '';
        this.currentValue = '';
        this.currentDescription = '';
        this.currentValueType = '';
        this.currentEnumValues = undefined;
        this.currentEnumDescriptions = undefined;
        this.hasContent = false;
        this.refresh();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            if (!this.hasContent) {
                const noContentItem = new vscode.TreeItem('No content to show', vscode.TreeItemCollapsibleState.None);
                noContentItem.tooltip = 'Position cursor on a JSON property to see details';
                noContentItem.iconPath = new vscode.ThemeIcon('info');
                return Promise.resolve([noContentItem]);
            }

            const items: vscode.TreeItem[] = [];

            // Property name
            const propertyItem = new vscode.TreeItem(`📌 ${this.currentKey}`, vscode.TreeItemCollapsibleState.None);
            propertyItem.tooltip = `Property: ${this.currentKey}`;
            propertyItem.iconPath = new vscode.ThemeIcon('symbol-property');
            items.push(propertyItem);

            // Current value
            const valueItem = new vscode.TreeItem(`💎 ${this.currentValue}`, vscode.TreeItemCollapsibleState.None);
            valueItem.tooltip = `Current value: ${this.currentValue}`;
            valueItem.iconPath = new vscode.ThemeIcon('symbol-constant');
            items.push(valueItem);

            // Type information
            if (this.currentValueType) {
                const typeItem = new vscode.TreeItem(`🏷️ Type: ${this.currentValueType}`, vscode.TreeItemCollapsibleState.None);
                typeItem.tooltip = `Data type: ${this.currentValueType}`;
                typeItem.iconPath = new vscode.ThemeIcon('symbol-interface');
                items.push(typeItem);
            }

            // Enum values if available
            if (this.currentEnumValues && this.currentEnumValues.length > 0) {
                const enumHeader = new vscode.TreeItem(`🎯 Possible Values`, vscode.TreeItemCollapsibleState.Expanded);
                enumHeader.tooltip = `Available options for ${this.currentKey}`;
                enumHeader.iconPath = new vscode.ThemeIcon('list-selection');
                items.push(enumHeader);

                // Add each enum value with description
                this.currentEnumValues.forEach(enumValue => {
                    const description = this.currentEnumDescriptions?.[enumValue] || 'No description available';
                    const enumItem = new vscode.TreeItem(`  • ${enumValue}`, vscode.TreeItemCollapsibleState.None);
                    enumItem.tooltip = `${enumValue}: ${description}`;
                    enumItem.iconPath = new vscode.ThemeIcon('symbol-enum-member');
                    enumItem.description = description.length > 50 ? description.substring(0, 47) + '...' : description;
                    items.push(enumItem);
                });
            }

            // Description
            if (this.currentDescription) {
                const descItem = new vscode.TreeItem(`📖 Description`, vscode.TreeItemCollapsibleState.Expanded);
                descItem.tooltip = this.currentDescription;
                descItem.iconPath = new vscode.ThemeIcon('book');
                
                // Split description into multiple lines for better readability
                const words = this.currentDescription.split(' ');
                const lines: string[] = [];
                let currentLine = '';
                
                for (const word of words) {
                    if ((currentLine + word).length > 50) {
                        if (currentLine) {
                            lines.push(currentLine.trim());
                            currentLine = word + ' ';
                        } else {
                            lines.push(word);
                        }
                    } else {
                        currentLine += word + ' ';
                    }
                }
                if (currentLine.trim()) {
                    lines.push(currentLine.trim());
                }

                // Add description lines as children
                const descChildren = lines.slice(0, 3).map((line, index) => {
                    const lineItem = new vscode.TreeItem(`  ${line}`, vscode.TreeItemCollapsibleState.None);
                    lineItem.iconPath = new vscode.ThemeIcon('circle-outline');
                    lineItem.tooltip = this.currentDescription;
                    return lineItem;
                });

                items.push(descItem, ...descChildren);
            }
            
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 VS Code Settings Extension ACTIVATED!');

    // Configuration documentation database
    const configDocs = {
        // Editor settings
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
        'editor.minimap.side': {
            description: 'Controls the side where to render the minimap.',
            type: 'string',
            default: 'right',
            enum: ['left', 'right'],
            enumDescriptions: {
                'left': 'Render minimap to left of editor',
                'right': 'Render minimap to right of editor'
            }
        },
        'editor.minimap.size': {
            description: 'The size of the minimap.',
            type: 'string',
            default: 'proportional',
            enum: ['proportional', 'fill', 'fit'],
            enumDescriptions: {
                'proportional': 'The minimap has the same size as the editor contents (and might scroll)',
                'fill': 'The minimap will stretch or shrink as necessary to fill the height of the editor',
                'fit': 'The minimap will shrink as necessary to never be larger than the editor'
            }
        },
        'editor.cursorStyle': {
            description: 'Controls the cursor style.',
            type: 'string',
            default: 'line',
            enum: ['line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin'],
            enumDescriptions: {
                'line': 'A thick vertical line',
                'block': 'A filled rectangle',
                'underline': 'A thick horizontal line',
                'line-thin': 'A thin vertical line',
                'block-outline': 'An outlined rectangle',
                'underline-thin': 'A thin horizontal line'
            }
        },
        'editor.cursorBlinking': {
            description: 'Control the cursor animation style.',
            type: 'string',
            default: 'blink',
            enum: ['blink', 'smooth', 'phase', 'expand', 'solid'],
            enumDescriptions: {
                'blink': 'Normal blinking',
                'smooth': 'Smooth fading',
                'phase': 'Blinking with smooth fading',
                'expand': 'Cursor expands and contracts',
                'solid': 'No blinking'
            }
        },
        'editor.formatOnSave': {
            description: 'Format a file on save. A formatter must be available, the file must not be saved after delay, and the editor must not be shutting down.',
            type: 'boolean',
            default: 'false'
        },
        'editor.formatOnPaste': {
            description: 'Format the line after typing. Requires a formatter to be available.',
            type: 'boolean',
            default: 'false'
        },
        'editor.formatOnType': {
            description: 'Format the line after typing. Requires a formatter to be available.',
            type: 'boolean',
            default: 'false'
        },
        'editor.autoIndent': {
            description: 'Controls whether the editor should automatically adjust the indentation when users type, paste, move or indent lines.',
            type: 'string',
            default: 'full',
            enum: ['none', 'keep', 'brackets', 'advanced', 'full'],
            enumDescriptions: {
                'none': 'The editor will not insert indentation automatically',
                'keep': 'The editor will keep the current line indentation',
                'brackets': 'The editor will keep the current line indentation and honor language defined brackets',
                'advanced': 'The editor will keep the current line indentation, honor language defined brackets and invoke special onEnterRules defined by languages',
                'full': 'The editor will keep the current line indentation, honor language defined brackets, invoke special onEnterRules defined by languages, and honor indentationRules defined by languages'
            }
        },
        'editor.bracketPairColorization.enabled': {
            description: 'Controls whether bracket pair colorization is enabled or not. Use workbench.colorCustomizations to override the bracket highlight colors.',
            type: 'boolean',
            default: 'true'
        },
        'editor.suggest.showKeywords': {
            description: 'When enabled IntelliSense shows keyword suggestions.',
            type: 'boolean',
            default: 'true'
        },
        'editor.suggest.showSnippets': {
            description: 'When enabled IntelliSense shows snippet suggestions.',
            type: 'boolean',
            default: 'true'
        },
        'editor.quickSuggestions': {
            description: 'Controls whether suggestions should automatically show up while typing.',
            type: 'boolean|object',
            default: 'true'
        },
        'editor.acceptSuggestionOnCommitCharacter': {
            description: 'Controls whether suggestions should be accepted on commit characters.',
            type: 'boolean',
            default: 'true'
        },
        'editor.acceptSuggestionOnEnter': {
            description: 'Controls whether suggestions should be accepted on Enter, in addition to Tab.',
            type: 'string',
            default: 'on',
            enum: ['on', 'smart', 'off'],
            enumDescriptions: {
                'on': 'Accept suggestions on Enter',
                'smart': 'Only accept a suggestion with Enter when it makes a textual change',
                'off': 'Never accept suggestions on Enter'
            }
        },

        // Files settings
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
        'files.encoding': {
            description: 'The default character set encoding to use when reading and writing files.',
            type: 'string',
            default: 'utf8'
        },
        'files.eol': {
            description: 'The default end of line character.',
            type: 'string',
            default: 'auto',
            enum: ['auto', '\n', '\r\n'],
            enumDescriptions: {
                'auto': 'Uses operating system specific end of line character',
                '\n': 'LF',
                '\r\n': 'CRLF'
            }
        },
        'files.trimTrailingWhitespace': {
            description: 'When enabled, will trim trailing whitespace when saving a file.',
            type: 'boolean',
            default: 'false'
        },
        'files.insertFinalNewline': {
            description: 'When enabled, insert a final new line at the end of the file when saving it.',
            type: 'boolean',
            default: 'false'
        },

        // Workbench settings
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
        'workbench.editor.showTabs': {
            description: 'Controls whether opened editors should show in tabs or not.',
            type: 'boolean',
            default: 'true'
        },
        'workbench.editor.tabCloseButton': {
            description: 'Controls the position of the editor tabs close buttons, or disables them when set to off.',
            type: 'string',
            default: 'right',
            enum: ['left', 'right', 'off'],
            enumDescriptions: {
                'left': 'Tab close button on the left of the tab',
                'right': 'Tab close button on the right of the tab',
                'off': 'Tab close button is disabled'
            }
        },
        'workbench.activityBar.visible': {
            description: 'Controls the visibility of the activity bar in the workbench.',
            type: 'boolean',
            default: 'true'
        },
        'workbench.statusBar.visible': {
            description: 'Controls the visibility of the status bar at the bottom of the workbench.',
            type: 'boolean',
            default: 'true'
        },
        'workbench.sideBar.location': {
            description: 'Controls the location of the sidebar and activity bar.',
            type: 'string',
            default: 'left',
            enum: ['left', 'right'],
            enumDescriptions: {
                'left': 'Positions the sidebar and activity bar on the left',
                'right': 'Positions the sidebar and activity bar on the right'
            }
        },

        // Terminal settings
        'terminal.integrated.shell.windows': {
            description: 'The path of the shell that the terminal uses on Windows.',
            type: 'string',
            default: 'C:\\Windows\\System32\\cmd.exe'
        },
        'terminal.integrated.shell.osx': {
            description: 'The path of the shell that the terminal uses on macOS.',
            type: 'string',
            default: '/bin/bash'
        },
        'terminal.integrated.shell.linux': {
            description: 'The path of the shell that the terminal uses on Linux.',
            type: 'string',
            default: '/bin/bash'
        },
        'terminal.integrated.fontSize': {
            description: 'Controls the font size in pixels of the terminal.',
            type: 'number',
            default: '14'
        },
        'terminal.integrated.fontFamily': {
            description: 'Controls the font family of the terminal.',
            type: 'string',
            default: 'Consolas, "Courier New", monospace'
        },

        // Git settings
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
        'git.confirmSync': {
            description: 'Confirm before synchronizing git repositories.',
            type: 'boolean',
            default: 'true'
        },

        // Search settings
        'search.exclude': {
            description: 'Configure glob patterns for excluding files and folders in fulltext searches and quick open.',
            type: 'object',
            default: '{}'
        },
        'search.useGlobalIgnoreFiles': {
            description: 'Controls whether to use global .gitignore and .ignore files when searching for files.',
            type: 'boolean',
            default: 'false'
        },

        // Launch.json specific
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
        'envFile': {
            description: 'Absolute path to a file containing environment variable definitions.',
            type: 'string',
            default: '${workspaceFolder}/.env'
        },
        'console': {
            description: 'Where to launch the debug target.',
            type: 'string',
            default: 'integratedTerminal',
            enum: ['internalConsole', 'integratedTerminal', 'externalTerminal'],
            enumDescriptions: {
                'internalConsole': 'VS Code Debug Console (which doesn\'t support to read from stdin)',
                'integratedTerminal': 'VS Code\'s integrated terminal',
                'externalTerminal': 'External terminal that can be configured via user settings'
            }
        },
        'port': {
            description: 'Debug port to attach to.',
            type: 'number',
            default: '9229'
        },
        'address': {
            description: 'TCP/IP address of debug port.',
            type: 'string',
            default: 'localhost'
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
        'restart': {
            description: 'Restart session on termination.',
            type: 'boolean',
            default: 'false'
        },
        'timeout': {
            description: 'Retry for this number of milliseconds to connect to the debug adapter.',
            type: 'number',
            default: '10000'
        },
        'sourceMaps': {
            description: 'Use JavaScript source maps (if they exist).',
            type: 'boolean',
            default: 'true'
        },
        'outFiles': {
            description: 'If source maps are enabled, these glob patterns specify the generated JavaScript files.',
            type: 'array',
            default: '[]'
        },
        'smartStep': {
            description: 'Automatically step through generated code that cannot be mapped back to the original source.',
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
        'compounds': {
            description: 'List of compound configurations that are collections of configurations.',
            type: 'array',
            default: '[]'
        },
        'preLaunchTask': {
            description: 'Task to run before the session starts.',
            type: 'string',
            default: ''
        },
        'postDebugTask': {
            description: 'Task to run after the session ends.',
            type: 'string',
            default: ''
        },
        'internalConsoleOptions': {
            description: 'Controls behavior of the internal debug console.',
            type: 'string',
            default: 'openOnFirstSessionStart',
            enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart'],
            enumDescriptions: {
                'neverOpen': 'Never open the internal debug console',
                'openOnSessionStart': 'Open the internal debug console on every session start',
                'openOnFirstSessionStart': 'Open the internal debug console on the first session start'
            }
        },

        // Python specific debug settings
        'python': {
            description: 'Absolute path to python executable.',
            type: 'string',
            default: 'python'
        },
        'module': {
            description: 'Name of the module to be debugged.',
            type: 'string',
            default: ''
        },
        'django': {
            description: 'Whether to enable Django debugging.',
            type: 'boolean',
            default: 'false'
        },
        'flask': {
            description: 'Whether to enable Flask debugging.',
            type: 'boolean',
            default: 'false'
        },
        'pyramid': {
            description: 'Whether to enable Pyramid debugging.',
            type: 'boolean',
            default: 'false'
        },
        'jinja': {
            description: 'Whether to enable Jinja2 template debugging.',
            type: 'boolean',
            default: 'true'
        },

        // Chrome specific debug settings
        'url': {
            description: 'Will search for a tab with this exact url and attach to it, if found.',
            type: 'string',
            default: 'http://localhost:8080'
        },
        'webRoot': {
            description: 'This specifies the workspace absolute path to the webserver root.',
            type: 'string',
            default: '${workspaceFolder}'
        },
        'file': {
            description: 'A local html file to open in the browser.',
            type: 'string',
            default: '${workspaceFolder}/index.html'
        },
        'userDataDir': {
            description: 'When set, Chrome is launched with a custom user profile stored in this location.',
            type: 'string',
            default: '${workspaceFolder}/.vscode/chrome'
        },
        'runtimeExecutable': {
            description: 'Workspace relative or absolute path to the runtime executable to be used.',
            type: 'string',
            default: 'stable'
        },
        'runtimeArgs': {
            description: 'Optional arguments passed to the runtime executable.',
            type: 'array',
            default: '[]'
        },

        // Extensions.json specific
        'recommendations': {
            description: 'List of extensions recommended for users of this workspace. Extensions are identified using their publisher name and extension name, e.g., "ms-python.python".',
            type: 'array',
            default: '[]'
        },
        'unwantedRecommendations': {
            description: 'List of extensions not recommended for users of this workspace. This prevents certain extensions from appearing in the recommendations list.',
            type: 'array',
            default: '[]'
        },

        // Additional launch.json properties for different debugger types
        'pathMappings': {
            description: 'A list of mappings from a local path to a remote path for debugging remote applications.',
            type: 'array',
            default: '[]'
        },
        'protocol': {
            description: 'Protocol to use for connecting to the debug adapter.',
            type: 'string',
            default: 'inspector',
            enum: ['inspector', 'legacy'],
            enumDescriptions: {
                'inspector': 'Use the Inspector Protocol',
                'legacy': 'Use the legacy V8 Debugger Protocol'
            }
        },
        'remoteRoot': {
            description: 'Remote directory containing the source code being debugged.',
            type: 'string',
            default: ''
        },
        'localRoot': {
            description: 'Local directory containing the source code being debugged.',
            type: 'string',
            default: '${workspaceFolder}'
        },
        'trace': {
            description: 'Enable logging of the Debug Adapter Protocol.',
            type: 'boolean|string',
            default: 'false',
            enum: ['false', 'true', 'all', 'verbose'],
            enumDescriptions: {
                'false': 'No logging',
                'true': 'Basic logging',
                'all': 'Log all Debug Adapter Protocol traffic',
                'verbose': 'Verbose logging with full message content'
            }
        },
        'outputCapture': {
            description: 'From where to capture output messages.',
            type: 'string',
            default: 'console',
            enum: ['console', 'std'],
            enumDescriptions: {
                'console': 'Capture output from Debug Console',
                'std': 'Capture output from stdout/stderr'
            }
        },
        'breakOnLoad': {
            description: 'Automatically insert a breakpoint at the first line of the program.',
            type: 'boolean',
            default: 'false'
        },
        'enableBreakpointsFor': {
            description: 'Allows breakpoints to be set in files with these extensions.',
            type: 'array',
            default: '[]'
        },

        // Node.js specific launch properties
        'runtimeVersion': {
            description: 'Version of Node.js runtime to use.',
            type: 'string',
            default: 'default'
        },
        'autoAttachChildProcesses': {
            description: 'Automatically attach to spawned subprocesses.',
            type: 'boolean',
            default: 'true'
        },
        'killBehavior': {
            description: 'Configures how debug processes are killed when stopping the session.',
            type: 'string',
            default: 'forceful',
            enum: ['polite', 'forceful'],
            enumDescriptions: {
                'polite': 'Send SIGTERM to allow graceful shutdown',
                'forceful': 'Send SIGKILL to force immediate termination'
            }
        },
        'resolveSourceMapLocations': {
            description: 'A list of minimatch patterns for locations where source maps can be used.',
            type: 'array',
            default: '["**", "!**/node_modules/**"]'
        },
        'cascadeTerminateToConfigurations': {
            description: 'A list of debug session names that will also be terminated when this debug session terminates.',
            type: 'array',
            default: '[]'
        },

        // Python debugging specific
        'pythonPath': {
            description: 'Path to the Python interpreter.',
            type: 'string',
            default: 'python'
        },
        'justMyCode': {
            description: 'Debug only user-written code.',
            type: 'boolean',
            default: 'true'
        },
        'subProcess': {
            description: 'Enable debugging of subprocesses.',
            type: 'boolean',
            default: 'false'
        },
        'redirectOutput': {
            description: 'Redirect output to the debug console.',
            type: 'boolean',
            default: 'true'
        },
        'showReturnValue': {
            description: 'Show return values in the debug console.',
            type: 'boolean',
            default: 'true'
        },
        'gevent': {
            description: 'Enable debugging support for gevent.',
            type: 'boolean',
            default: 'false'
        },

        // C/C++ debugging specific
        'miDebuggerPath': {
            description: 'Path to the MI debugger (GDB or LLDB).',
            type: 'string',
            default: 'gdb'
        },
        'miDebuggerArgs': {
            description: 'Additional arguments for the MI debugger.',
            type: 'string',
            default: ''
        },
        'targetArchitecture': {
            description: 'Architecture of the debuggee.',
            type: 'string',
            default: 'x64',
            enum: ['x86', 'x64', 'arm', 'arm64'],
            enumDescriptions: {
                'x86': '32-bit x86 architecture',
                'x64': '64-bit x86 architecture',
                'arm': 'ARM architecture',
                'arm64': '64-bit ARM architecture'
            }
        },
        'setupCommands': {
            description: 'One or more GDB/LLDB commands to execute in order to set up the underlying debugger.',
            type: 'array',
            default: '[]'
        },
        'customLaunchSetupCommands': {
            description: 'Commands to execute when launching a program.',
            type: 'array',
            default: '[]'
        },
        'launchCompleteCommand': {
            description: 'Command to execute after the debugger is fully set up.',
            type: 'string',
            default: 'exec-run',
            enum: ['exec-run', 'exec-continue', 'None'],
            enumDescriptions: {
                'exec-run': 'Run the program',
                'exec-continue': 'Continue execution',
                'None': 'Do not execute any command'
            }
        },

        // Chrome/Browser debugging specific
        'urlFilter': {
            description: 'Will search for a page with this url and attach to it.',
            type: 'string',
            default: ''
        },
        'includeDefaultArgs': {
            description: 'Whether default browser launching args should be included.',
            type: 'boolean',
            default: 'true'
        },
        'disableNetworkCache': {
            description: 'Controls whether to skip the network cache for each request.',
            type: 'boolean',
            default: 'false'
        },
        'showAsyncStacks': {
            description: 'Show async stacks in the call stack.',
            type: 'boolean',
            default: 'true'
        },
        'breakOnLoadStrategy': {
            description: 'Strategy for setting breakpoints.',
            type: 'string',
            default: 'instrument',
            enum: ['instrument', 'regex'],
            enumDescriptions: {
                'instrument': 'Use source map instrumentation for breakpoints',
                'regex': 'Use regex matching for breakpoint locations'
            }
        },
        'browser.smartStep': {
            description: 'Try to automatically step over code that doesn\'t map to source files.',
            type: 'boolean',
            default: 'true'
        },
        'browser.skipFiles': {
            description: 'Skip these files when stepping.',
            type: 'array',
            default: '[]'
        },

        // Tasks.json specific
        'tasks.version': {
            description: 'Version of the task configuration format.',
            type: 'string',
            default: '2.0.0'
        },
        'tasks': {
            description: 'Array of task configurations.',
            type: 'array',
            default: '[]'
        },
        'task.label': {
            description: 'The user interface label for the task.',
            type: 'string',
            default: 'My Task'
        },
        'task.command': {
            description: 'The command to be executed.',
            type: 'string',
            default: 'echo'
        },
        'options': {
            description: 'Additional command options.',
            type: 'object',
            default: '{}'
        },
        'group': {
            description: 'Defines to which group the task belongs.',
            type: 'string|object',
            default: 'build',
            enum: ['build', 'test'],
            enumDescriptions: {
                'build': 'Task is a build task',
                'test': 'Task is a test task'
            }
        },
        'presentation': {
            description: 'Configures the panel that is used to present the task output and reads its input.',
            type: 'object',
            default: '{}'
        },
        'problemMatcher': {
            description: 'The problem matcher to be used if a global command is executed.',
            type: 'string|array',
            default: '[]'
        },
        'runOptions': {
            description: 'Configures when and how a task is run.',
            type: 'object',
            default: '{}'
        },
        'dependsOn': {
            description: 'Defines the task that this task depends on.',
            type: 'string|array',
            default: '[]'
        },
        'dependsOrder': {
            description: 'Defines the order in which dependent tasks are executed.',
            type: 'string',
            default: 'parallel',
            enum: ['parallel', 'sequence'],
            enumDescriptions: {
                'parallel': 'Dependent tasks are executed in parallel',
                'sequence': 'Dependent tasks are executed in sequence'
            }
        },
        'isBackground': {
            description: 'Defines whether the task is kept alive and is running in the background.',
            type: 'boolean',
            default: 'false'
        },
        'promptOnClose': {
            description: 'Controls whether the task is prompted when VS Code closes with a running task.',
            type: 'boolean',
            default: 'false'
        },

        // Additional task properties
        'detail': {
            description: 'A human-readable string which is rendered less prominently in the user interface.',
            type: 'string',
            default: ''
        },
        'hide': {
            description: 'Controls whether the task is hidden from the user interface.',
            type: 'boolean',
            default: 'false'
        },
        'icon': {
            description: 'The icon which is used in the task UI.',
            type: 'object',
            default: '{}'
        },
        'runOn': {
            description: 'Specifies when the task should be run.',
            type: 'string',
            default: 'default',
            enum: ['default', 'folderOpen'],
            enumDescriptions: {
                'default': 'The task will only be run when executed through the command palette or keybinding',
                'folderOpen': 'The task will be run when the containing folder is opened'
            }
        },

        // Task presentation options
        'presentation.echo': {
            description: 'Controls whether the executed command is echoed to the panel.',
            type: 'boolean',
            default: 'true'
        },
        'presentation.reveal': {
            description: 'Controls whether the panel is revealed when the task is run.',
            type: 'string',
            default: 'always',
            enum: ['always', 'silent', 'never'],
            enumDescriptions: {
                'always': 'Always reveal the panel when the task is run',
                'silent': 'Reveal the panel only if the task has output or errors',
                'never': 'Never reveal the panel'
            }
        },
        'presentation.focus': {
            description: 'Controls whether the panel takes focus.',
            type: 'boolean',
            default: 'false'
        },
        'presentation.panel': {
            description: 'Controls if the panel is shared between tasks, dedicated to this task, or a new one is created on every run.',
            type: 'string',
            default: 'shared',
            enum: ['shared', 'dedicated', 'new'],
            enumDescriptions: {
                'shared': 'The panel is shared between tasks',
                'dedicated': 'A dedicated panel is used for this task',
                'new': 'A new panel is created on every task run'
            }
        },
        'presentation.showReuseMessage': {
            description: 'Controls whether to show the "Terminal will be reused by tasks" message.',
            type: 'boolean',
            default: 'true'
        },
        'presentation.clear': {
            description: 'Controls whether the terminal is cleared before executing the task.',
            type: 'boolean',
            default: 'false'
        },
        'presentation.group': {
            description: 'Controls whether the task is executed in a specific terminal group.',
            type: 'string',
            default: ''
        },

        // Task options
        'options.cwd': {
            description: 'The current working directory of the executed program or script.',
            type: 'string',
            default: '${workspaceFolder}'
        },
        'options.env': {
            description: 'The environment of the executed program or script.',
            type: 'object',
            default: '{}'
        },
        'options.shell': {
            description: 'Configuration of the shell when task type is shell.',
            type: 'object',
            default: '{}'
        },

        // Run options
        'runOptions.instanceLimit': {
            description: 'Controls how many instances of the task are allowed to run in parallel.',
            type: 'number',
            default: '1'
        },
        'runOptions.reevaluateOnRerun': {
            description: 'Controls whether variables are re-evaluated when rerunning the task.',
            type: 'boolean',
            default: 'true'
        },

        // Problem matcher patterns
        'problemMatcher.$gcc': {
            description: 'Problem matcher for GCC compiler output.',
            type: 'string',
            default: '$gcc'
        },
        'problemMatcher.$msCompile': {
            description: 'Problem matcher for Microsoft compiler output.',
            type: 'string',
            default: '$msCompile'
        },
        'problemMatcher.$tsc': {
            description: 'Problem matcher for TypeScript compiler output.',
            type: 'string',
            default: '$tsc'
        },
        'problemMatcher.$eslint-stylish': {
            description: 'Problem matcher for ESLint output in stylish format.',
            type: 'string',
            default: '$eslint-stylish'
        },

        // Keybindings.json specific
        'keybinding.key': {
            description: 'Key or key sequence (separate keys with plus-sign and sequences with space).',
            type: 'string',
            default: 'ctrl+shift+p'
        },
        'keybinding.command': {
            description: 'Identifier of the command to run when keybinding is triggered.',
            type: 'string',
            default: 'workbench.action.showCommands'
        },
        'when': {
            description: 'Condition when the key binding is in effect.',
            type: 'string',
            default: ''
        },
        'keybinding.args': {
            description: 'Arguments to pass to the command.',
            type: 'any',
            default: null
        },

        // Workspace settings
        'folders': {
            description: 'List of folders in a multi-root workspace.',
            type: 'array',
            default: '[]'
        },
        'workspace.settings': {
            description: 'Workspace settings that apply to the entire workspace.',
            type: 'object',
            default: '{}'
        },
        'workspace.extensions': {
            description: 'Workspace extension recommendations.',
            type: 'object',
            default: '{}'
        },
        'workspace.launch': {
            description: 'Workspace debug configurations.',
            type: 'object',
            default: '{}'
        },
        'workspace.tasks': {
            description: 'Workspace task configurations.',
            type: 'object',
            default: '{}'
        },

        // Settings.json - workspace behavior
        'workbench.editor.wrapTabs': {
            description: 'Controls whether tabs should wrap when the available space is exceeded.',
            type: 'boolean',
            default: 'false'
        },
        'workbench.editor.decorations.badges': {
            description: 'Controls whether editor file decorations should use badges.',
            type: 'boolean',
            default: 'true'
        },
        'workbench.editor.decorations.colors': {
            description: 'Controls whether editor file decorations should use colors.',
            type: 'boolean',
            default: 'true'
        },
        'workbench.tree.indent': {
            description: 'Controls tree indentation in pixels.',
            type: 'number',
            default: '8'
        },
        'workbench.tree.renderIndentGuides': {
            description: 'Controls whether the tree should render indent guides.',
            type: 'string',
            default: 'onHover',
            enum: ['none', 'onHover', 'always'],
            enumDescriptions: {
                'none': 'No indent guides',
                'onHover': 'Indent guides on hover',
                'always': 'Always show indent guides'
            }
        },

        // Explorer settings
        'explorer.confirmDelete': {
            description: 'Controls whether the explorer should ask for confirmation when deleting a file via the trash.',
            type: 'boolean',
            default: 'true'
        },
        'explorer.confirmDragAndDrop': {
            description: 'Controls whether the explorer should ask for confirmation when moving files via drag and drop.',
            type: 'boolean',
            default: 'true'
        },
        'explorer.enableDragAndDrop': {
            description: 'Controls whether the explorer allows to move files and folders via drag and drop.',
            type: 'boolean',
            default: 'true'
        },
        'explorer.openEditors.visible': {
            description: 'Number of editors shown in the Open Editors pane.',
            type: 'number',
            default: '9'
        },
        'explorer.autoReveal': {
            description: 'Controls whether the explorer should automatically reveal and select files when opening them.',
            type: 'boolean|string',
            default: 'true',
            enum: ['true', 'false', 'focusNoScroll'],
            enumDescriptions: {
                'true': 'Files will be revealed and selected',
                'false': 'Files will not be revealed and selected',
                'focusNoScroll': 'Files will be revealed and selected only when focus moves to the explorer'
            }
        },

        // Debug settings
        'debug.allowBreakpointsEverywhere': {
            description: 'Controls whether to allow setting breakpoints in any file.',
            type: 'boolean',
            default: 'false'
        },
        'debug.inlineValues': {
            description: 'Controls whether to show inline values in the editor while debugging.',
            type: 'boolean',
            default: 'false'
        },
        'debug.toolBarLocation': {
            description: 'Controls the location of the debug toolbar.',
            type: 'string',
            default: 'floating',
            enum: ['floating', 'docked', 'hidden'],
            enumDescriptions: {
                'floating': 'Show debug toolbar in floating mode',
                'docked': 'Show debug toolbar docked in the debug viewlet',
                'hidden': 'Hide debug toolbar'
            }
        },
        'debug.console.fontSize': {
            description: 'Controls the font size in pixels in the debug console.',
            type: 'number',
            default: '14'
        },
        'debug.console.lineHeight': {
            description: 'Controls the line height in the debug console.',
            type: 'number',
            default: '1.4'
        },

        // Language specific settings
        '[javascript]': {
            description: 'Language specific editor settings for JavaScript.',
            type: 'object',
            default: '{}'
        },
        '[typescript]': {
            description: 'Language specific editor settings for TypeScript.',
            type: 'object',
            default: '{}'
        },
        '[json]': {
            description: 'Language specific editor settings for JSON.',
            type: 'object',
            default: '{}'
        },
        '[html]': {
            description: 'Language specific editor settings for HTML.',
            type: 'object',
            default: '{}'
        },
        '[css]': {
            description: 'Language specific editor settings for CSS.',
            type: 'object',
            default: '{}'
        },
        '[python]': {
            description: 'Language specific editor settings for Python.',
            type: 'object',
            default: '{}'
        },
        '[markdown]': {
            description: 'Language specific editor settings for Markdown.',
            type: 'object',
            default: '{}'
        },

        // Extension specific settings
        'eslint.enable': {
            description: 'Controls whether eslint is enabled or not.',
            type: 'boolean',
            default: 'true'
        },
        'eslint.workingDirectories': {
            description: 'Specifies how the working directories ESLint is using are computed.',
            type: 'array',
            default: '[]'
        },
        'prettier.enable': {
            description: 'Whether to enable prettier.',
            type: 'boolean',
            default: 'true'
        },
        'prettier.requireConfig': {
            description: 'Require a prettier configuration file to format.',
            type: 'boolean',
            default: 'false'
        },
        'emmet.includeLanguages': {
            description: 'Enable Emmet abbreviations in languages that are not supported by default.',
            type: 'object',
            default: '{}'
        },
        'liveServer.settings.port': {
            description: 'Set Custom Port Number of Live Server.',
            type: 'number',
            default: '5500'
        },
        'java.home': {
            description: 'Specifies the folder path to the JDK.',
            type: 'string',
            default: ''
        },
        'python.defaultInterpreterPath': {
            description: 'Path to default Python interpreter.',
            type: 'string',
            default: 'python'
        },
        'python.linting.enabled': {
            description: 'Whether to enable linting of Python files.',
            type: 'boolean',
            default: 'true'
        },
        'go.gopath': {
            description: 'Specifies the GOPATH to use when no environment variable is set.',
            type: 'string',
            default: ''
        },
        'go.goroot': {
            description: 'Specifies the GOROOT to use when finding the Go binary.',
            type: 'string',
            default: ''
        }
    };

    // Function to get configuration documentation
    function getConfigDocumentation(key: string): { description: string, type: string, default?: string, enum?: string[], enumDescriptions?: Record<string, string> } {
        return (configDocs as any)[key] || {
            description: 'No documentation available for this configuration.',
            type: 'unknown'
        };
    }

    // Create tree data providers
    const configFilesProvider = new ConfigFilesProvider();
    const helloWorldProvider = new HelloWorldProvider();
    
    // Register tree data providers
    vscode.window.registerTreeDataProvider('vscode-settings.configFiles', configFilesProvider);
    vscode.window.registerTreeDataProvider('vscode-settings.helloWorld', helloWorldProvider);

    // Register commands for opening/creating config files
    const openConfigFileCommand = vscode.commands.registerCommand('vscode-settings.openConfigFile', (fileName: string) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const filePath = path.join(vscodeDir, fileName);
        const fileUri = vscode.Uri.file(filePath);

        // Open the file
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
            // Create .vscode directory if it doesn't exist
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir, { recursive: true });
            }

            // Create file with appropriate content based on file type
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

            // Write the file
            fs.writeFileSync(filePath, initialContent, 'utf8');

            // Refresh the tree view
            configFilesProvider.refresh();

            // Open the newly created file
            const fileUri = vscode.Uri.file(filePath);
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`Created ${fileName}`);
        } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to create file: ${err.message}`);
        }
    });

    // Function to check if current file is a config file we manage
    function isConfigFile(filePath: string): boolean {
        const configFileNames = ['settings.json', 'launch.json', 'extensions.json'];
        const fileName = path.basename(filePath);
        const isInVscodeDir = filePath.includes('.vscode');
        return isInVscodeDir && configFileNames.includes(fileName);
    }

    // Function to update Prop. Helper visibility
    function updatePropHelperVisibility() {
        const activeEditor = vscode.window.activeTextEditor;
        let showHelper = false;
        
        if (activeEditor && activeEditor.document.uri.scheme === 'file') {
            const filePath = activeEditor.document.uri.fsPath;
            showHelper = isConfigFile(filePath);
            console.log('📁 File:', path.basename(filePath), '- Show helper:', showHelper);
        }
        
        vscode.commands.executeCommand('setContext', 'vscode-settings.showPropHelper', showHelper);
        
        // Update content when visibility changes
        if (showHelper) {
            updatePropHelperContent();
        } else {
            helloWorldProvider.clearContent();
        }
    }

    // Function to get JSON property at cursor position
    function getPropertyAtPosition(document: vscode.TextDocument, position: vscode.Position): { key: string, value: string } | null {
        try {
            const text = document.getText();
            
            // Remove comments for JSON parsing (simple approach)
            const cleanText = text
                .replace(/\/\/.*$/gm, '') // Remove line comments
                .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
            
            // Get the current line text for immediate analysis
            const currentLineText = document.lineAt(position.line).text;
            
            // First, try to extract key from current line regardless of JSON validity
            const keyValuePattern = /"([^"]+)"\s*:\s*(.+?)(?:,\s*$|$)/;
            const keyOnlyPattern = /"([^"]+)"/;
            
            let keyFromLine = null;
            let valueFromLine = null;
            
            // Try to get key-value pair from current line
            const kvMatch = currentLineText.match(keyValuePattern);
            if (kvMatch) {
                keyFromLine = kvMatch[1];
                valueFromLine = kvMatch[2].trim().replace(/,$/, '');
            } else {
                // Try to get just the key
                const keyMatch = currentLineText.match(keyOnlyPattern);
                if (keyMatch) {
                    keyFromLine = keyMatch[1];
                    valueFromLine = 'unknown';
                }
            }
            
            // If we found a key from the line, return it
            if (keyFromLine) {
                console.log(`🔍 Found key from line: ${keyFromLine} = ${valueFromLine || 'unknown'}`);
                return { key: keyFromLine, value: valueFromLine || 'unknown' };
            }
            
            // Try to parse the entire JSON to get more context
            let jsonObject: any;
            try {
                jsonObject = JSON.parse(cleanText);
            } catch (parseError) {
                console.log('⚠️ JSON parsing failed, using line-based extraction');
                return null;
            }
            
            // If JSON parsing succeeded, try to find the property with more context
            // This is useful for getting actual values from the JSON structure
            if (jsonObject && keyFromLine) {
                // Check if it's a top-level property
                if (jsonObject.hasOwnProperty(keyFromLine)) {
                    const value = jsonObject[keyFromLine];
                    const valueStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
                    return { key: keyFromLine, value: valueStr };
                }
                
                // Check if it's inside configurations array (for launch.json)
                if (jsonObject.configurations && Array.isArray(jsonObject.configurations)) {
                    for (const config of jsonObject.configurations) {
                        if (config && typeof config === 'object' && config.hasOwnProperty(keyFromLine)) {
                            const value = config[keyFromLine];
                            const valueStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
                            console.log(`🎯 Found in configurations: ${keyFromLine} = ${valueStr}`);
                            return { key: keyFromLine, value: valueStr };
                        }
                    }
                }
                
                // Check if it's inside tasks array (for tasks.json)
                if (jsonObject.tasks && Array.isArray(jsonObject.tasks)) {
                    for (const task of jsonObject.tasks) {
                        if (task && typeof task === 'object' && task.hasOwnProperty(keyFromLine)) {
                            const value = task[keyFromLine];
                            const valueStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
                            console.log(`🔧 Found in tasks: ${keyFromLine} = ${valueStr}`);
                            return { key: keyFromLine, value: valueStr };
                        }
                    }
                }
                
                // If we have the key but couldn't find the value, return with the line value
                return { key: keyFromLine, value: valueFromLine || 'unknown' };
            }
            
            // Fallback: try to find any property from the JSON structure
            if (jsonObject) {
                const firstKey = Object.keys(jsonObject)[0];
                if (firstKey) {
                    const value = jsonObject[firstKey];
                    const valueStr = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
                    return { key: firstKey, value: valueStr };
                }
            }
            
            return null;
        } catch (error) {
            console.log('💥 Error in getPropertyAtPosition:', error);
            return null;
        }
    }

    // Function to update Prop. Helper content based on cursor position
    function updatePropHelperContent() {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor || !isConfigFile(activeEditor.document.uri.fsPath)) {
            helloWorldProvider.clearContent();
            return;
        }

        const position = activeEditor.selection.active;
        const fileName = path.basename(activeEditor.document.uri.fsPath);
        console.log(`📍 Cursor position in ${fileName}: line ${position.line + 1}, character ${position.character + 1}`);
        
        const property = getPropertyAtPosition(activeEditor.document, position);
        
        if (property) {
            const doc = getConfigDocumentation(property.key);
            const valueTypeInfo = doc.enum ? `${doc.type} (${doc.enum.join(' | ')})` : doc.type;
            
            console.log(`🔍 Found property: ${property.key} = ${property.value}`);
            console.log(`📖 Documentation: ${doc.description.substring(0, 100)}...`);
            
            helloWorldProvider.updateContent(
                property.key, 
                property.value, 
                doc.description, 
                valueTypeInfo,
                doc.enum,
                doc.enumDescriptions
            );
        } else {
            console.log(`❌ No property found at cursor position`);
            helloWorldProvider.clearContent();
        }
    }

    // Initial check
    updatePropHelperVisibility();

    // Also do initial content update if we're already in a config file
    if (vscode.window.activeTextEditor && isConfigFile(vscode.window.activeTextEditor.document.uri.fsPath)) {
        updatePropHelperContent();
    }

    // Listen for active editor changes
    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(() => {
        updatePropHelperVisibility();
    });

    // Listen for cursor position changes
    const selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
        // Update content when cursor moves
        updatePropHelperContent();
    });

    // Listen for text document changes
    const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document === vscode.window.activeTextEditor?.document) {
            updatePropHelperContent();
        }
    });

    // Listen for text document open/close events
    const documentOpenDisposable = vscode.workspace.onDidOpenTextDocument(() => {
        updatePropHelperVisibility();
    });

    const documentCloseDisposable = vscode.workspace.onDidCloseTextDocument(() => {
        updatePropHelperVisibility();
    });

    context.subscriptions.push(
        openConfigFileCommand,
        createConfigFileCommand,
        activeEditorDisposable,
        selectionChangeDisposable,
        documentChangeDisposable,
        documentOpenDisposable,
        documentCloseDisposable
    );
}

export function deactivate() {}
