# 🚀 VS Code Settings Helper - 发布流程

## ✅ 当前状态
- [x] 代码已提交到 GitHub: https://github.com/gorebill/vscode-settings
- [x] 扩展已成功打包: `vscode-settings-1.0.0.vsix` (21.26KB, 11 files)
- [x] 所有必要文件已包含在包中

## 📦 扩展包内容
```
LICENSE                     # MIT 许可证
out/extension.js           # 主扩展代码
out/test/                  # 测试文件
package.json               # 扩展清单
PUBLISH.md                 # 发布文档
README.md                  # 项目说明
resources/icon.svg         # 自定义图标
```

## 🔄 下一步发布选项

### 选项 1: 发布到 VS Code Marketplace（推荐）

**第一步: 准备 Azure DevOps 账号**
1. 访问 https://dev.azure.com/
2. 使用 Microsoft 账号登录（如果没有则注册）

**第二步: 创建 Personal Access Token**
1. 在 Azure DevOps 中点击右上角用户头像
2. 选择 "Personal Access Tokens"
3. 点击 "New Token"
4. 设置以下选项：
   - Name: `VS Code Marketplace`
   - Organization: `All accessible organizations`
   - Expiration: 选择合适的过期时间
   - Scopes: 选择 "Custom defined"，然后勾选 "Marketplace" → "Manage"
5. 点击 "Create" 并**立即复制生成的 token**（只显示一次）

**第三步: 登录并发布**
```bash
# 使用你的 publisher name 登录（package.json 中的 publisher 字段）
npx vsce login gorebill

# 输入刚才复制的 Personal Access Token

# 发布扩展
npm run publish
```

**⚠️ 重要提醒**:
- Personal Access Token 只显示一次，请立即保存
- 如果 publisher "gorebill" 不存在，需要先在 https://marketplace.visualstudio.com/manage 创建
- 确保 token 有 "Marketplace Manage" 权限

### 选项 2: 本地测试安装
1. **手动安装扩展**
   - 打开 VS Code
   - 按 `Cmd+Shift+P`
   - 输入 "Extensions: Install from VSIX"
   - 选择 `vscode-settings-1.0.0.vsix`

2. **或使用命令行**（需要添加 code 到 PATH）
   ```bash
   code --install-extension vscode-settings-1.0.0.vsix
   ```

### 选项 3: 分享给他人测试
- 直接分享 `vscode-settings-1.0.0.vsix` 文件
- 接收者可以通过 VS Code 安装

## 🎯 发布后的 Marketplace 链接
发布成功后，扩展将出现在：
`https://marketplace.visualstudio.com/items?itemName=gorebill.vscode-settings`

## 📊 扩展特性总结
- **智能配置管理**: 可视化管理 VS Code 配置文件
- **实时文档帮助**: 200+ 配置项详细说明
- **嵌套属性支持**: 正确处理 launch.json configurations
- **自定义图标**: 独特的盾牌样式设计
- **一键创建**: 快速创建缺失的配置文件
- **MIT 开源**: 完整的版权保护

准备好发布了吗？🚀
