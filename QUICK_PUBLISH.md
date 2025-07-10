# 🚀 立即发布指南

## 当前状态
✅ 扩展已打包完成: `vscode-settings-1.0.0.vsix`  
✅ 代码已推送到 GitHub: https://github.com/gorebill/vscode-settings  
🔄 等待发布到 VS Code Marketplace

## 📋 发布步骤（跟着做）

### 1️⃣ 获取 Personal Access Token

1. **打开 Azure DevOps**: https://dev.azure.com/
2. **登录**: 使用 Microsoft 账号
3. **创建 Token**:
   - 点击右上角头像 → "Personal Access Tokens"
   - 点击 "New Token"
   - Name: `VS Code Marketplace Publishing`
   - Organization: `All accessible organizations`
   - Expiration: `1 year`
   - Scopes: `Custom defined` → 勾选 `Marketplace (Manage)`
   - 点击 "Create"
   - **立即复制 token**（只显示一次！）

### 2️⃣ 发布命令

准备好 token 后，在终端中执行：

```bash
# 登录（会提示输入 token）
npx vsce login gorebill

# 发布
npm run publish
```

### 3️⃣ 如果 publisher 不存在

如果提示 publisher "gorebill" 不存在：

1. 访问: https://marketplace.visualstudio.com/manage
2. 使用同一个 Microsoft 账号登录
3. 点击 "Create Publisher"
4. Publisher ID: `gorebill`
5. Publisher Name: `gorebill`
6. 创建完成后重新执行发布命令

## 🔧 故障排除

**问题**: `ERROR  The publisher 'gorebill' is not found.`  
**解决**: 先在 https://marketplace.visualstudio.com/manage 创建 publisher

**问题**: `ERROR  Personal Access Token is invalid`  
**解决**: 确保 token 有 "Marketplace Manage" 权限

**问题**: `ERROR  Extension 'vscode-settings' already exists`  
**解决**: 扩展名已被占用，需要修改 package.json 中的 name

## 📞 需要帮助？

如果遇到任何问题，告诉我具体的错误信息，我会帮你解决！

准备好了就开始第一步获取 token 吧！🚀
