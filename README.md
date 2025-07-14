# VS Code Settings Extension

A comprehensive VS Code extension for managing workspace configuration files with intelligent property assistance and project-based configuration recommendations.

## Features

- **Configuration File Management**: Easily view, create, and open VS Code configuration files
- **Intelligent Property Helper**: Real-time documentation and assistance for configuration properties
- **Project Type Detection**: Automatically detects your project type (Node.js, React, Python, Java, etc.)
- **Smart Configuration Recommendations**: Suggests optimal settings based on detected project types
- **Configuration Templates**: Pre-built configuration templates for common development scenarios
- **Comprehensive Documentation**: 200+ configuration options with detailed descriptions and enum values
- **Multi-file Support**: Works with `settings.json`, `launch.json`, `extensions.json`, `tasks.json`, and more

## What's New in v1.0.2

### 🚀 Project-Based Recommendations
- **Automatic Project Detection**: Identifies 15+ project types including Node.js, React, Vue.js, Angular, Python, Java, C/C++, Go, Rust, PHP, Ruby, Docker, Flutter, Unity
- **Smart Configuration Templates**: Pre-configured settings optimized for each project type
- **One-Click Apply**: Apply recommended configurations with a single click
- **Project Analysis Panel**: New sidebar panel showing detected technologies and confidence scores

### 🎯 Enhanced User Experience
- **Visual Project Analysis**: See what technologies are detected in your workspace
- **Confidence Scoring**: Know how certain the detection is for each project type
- **Template Previews**: See what settings will be applied before confirming
- **Quick Actions**: Fast access to common configuration tasks

## How to Use

1. Open a workspace folder
2. Access the VS Code Settings panel from the Activity Bar
3. **NEW**: Check the "Project Recommendations" panel to see detected project types
4. **NEW**: Click "Apply template" to automatically configure optimal settings for your project
5. View existing configuration files or create new ones
6. Open any configuration file and place your cursor on a property to see detailed documentation in the Prop. Helper panel

## Supported Project Types

- **Frontend**: React, Vue.js, Angular, HTML/CSS/JS
- **Backend**: Node.js, Python, Java, C/C++, Go, Rust, PHP, Ruby
- **Mobile**: Flutter/Dart, React Native
- **Game Development**: Unity
- **DevOps**: Docker, Docker Compose
- **And more**: Automatic detection with confidence scoring

## Supported Configuration Files

- `settings.json` - Workspace and user settings
- `launch.json` - Debug configurations  
- `extensions.json` - Extension recommendations
- `tasks.json` - Task configurations
- `keybindings.json` - Custom key bindings

## Configuration Templates

### Available Templates:
- **Node.js Development**: ESLint integration, proper tab sizes, file exclusions
- **Python Development**: Black formatting, linting, virtual environment support
- **React Development**: JSX support, Emmet configuration, quote preferences
- **Java Development**: Compilation settings, classpath management
- **C/C++ Development**: Standards configuration, IntelliSense setup
- **Go Development**: goimports, language server, format on save

## Requirements

- VS Code 1.74.0 or higher

## Known Issues

None at this time. If you encounter any issues, please report them on GitHub.

## Release Notes

### 1.0.2
- Added project type detection for 15+ technologies
- Implemented smart configuration recommendations
- New Project Recommendations sidebar panel
- Configuration templates for common development scenarios
- Enhanced project analysis with confidence scoring
- Quick actions for applying recommended settings

### 1.0.1
- Updated extension icon
- Enhanced visual design

### 1.0.0
- Complete rewrite with comprehensive configuration documentation
- Added intelligent property detection for nested structures
- Support for 200+ configuration options
- Enhanced UI with detailed enum value explanations
- Improved error handling and fallback parsing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

© 2025 gorebill. All rights reserved.

## Contributing

Found a bug or want to contribute? Check out our [GitHub repository](https://github.com/gorebill/vscode-settings) and feel free to open an issue or submit a pull request!
