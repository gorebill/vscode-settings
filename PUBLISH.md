# 发布检查清单

## 📋 发布前检查

### ✅ 代码质量
- [x] TypeScript 编译无错误
- [x] 所有源文件已添加版权信息
- [x] 代码格式化完整

### ✅ 项目配置
- [x] package.json 信息完整
- [x] LICENSE 文件已创建
- [x] README.md 已更新
- [x] 版本号已设置为 1.0.0

### ✅ 功能测试
- [x] 扩展激活正常
- [x] 配置文件管理功能正常
- [x] Prop. Helper 面板工作正常
- [x] 支持 launch.json 嵌套属性解析
- [x] 200+ 配置项文档完整

### ✅ 调试配置
- [x] launch.json 配置正确
- [x] tasks.json 配置正确
- [x] preLaunchTask 引用正确

## 🚀 发布步骤

1. **配置代理**（如果需要）：
   - 编辑 `.npmrc` 文件，取消注释并配置代理设置
   - 或者设置环境变量：
     ```bash
     export HTTP_PROXY=http://proxy.company.com:8080
     export HTTPS_PROXY=http://proxy.company.com:8080
     ```

2. **打包扩展**：
   ```bash
   npm run package
   ```

3. **测试打包的扩展**：
   - 安装生成的 .vsix 文件测试功能

4. **发布到 VS Code Marketplace**：
   ```bash
   npm run publish
   ```
   
   注意：首次发布需要：
   - 创建 Azure DevOps 账号
   - 获取 Personal Access Token
   - 使用 `npx vsce login <publisher>` 登录

## 📦 扩展特性

- **智能配置管理**：可视化管理 VS Code 配置文件
- **实时文档帮助**：光标悬停显示配置项详细说明
- **全面配置支持**：支持 settings.json, launch.json, tasks.json, extensions.json
- **嵌套属性解析**：正确处理 configurations 数组中的属性
- **枚举值说明**：详细的枚举选项解释
- **一键创建**：快速创建缺失的配置文件

## 🔧 技术亮点

- TypeScript 开发，类型安全
- VS Code Extension API 1.74.0+
- 200+ 配置项完整文档
- 智能 JSON 解析，支持注释
- 响应式 TreeView 界面
- MIT 开源许可证
