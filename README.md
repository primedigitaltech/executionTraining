# 赢在执行电子书 PWA

这是《赢在执行》专项培训心得体会电子书的手机端 PWA 版本，可部署到 GitHub Pages。

## 本地预览

```bash
python3 -m http.server 8127
```

然后打开：

```text
http://127.0.0.1:8127/
```

## 上传到 GitHub

1. 在 GitHub 新建一个空仓库，例如 `execution-ebook-pwa`。
2. 在本目录执行：

```bash
git remote add origin https://github.com/<你的用户名>/execution-ebook-pwa.git
git branch -M main
git push -u origin main
```

3. 进入 GitHub 仓库的 `Settings` → `Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。
6. 保存后等待 GitHub Pages 发布。

发布后的访问地址通常是：

```text
https://<你的用户名>.github.io/execution-ebook-pwa/
```

## 手机端安装

### iPhone / iPad

用 Safari 打开 GitHub Pages 地址，点击分享按钮，选择“添加到主屏幕”。

### Android

用 Chrome 或 Edge 打开 GitHub Pages 地址，点击浏览器菜单，选择“安装应用”或“添加到主屏幕”。

## 文件说明

- `index.html`：电子书入口
- `app.js`：翻页、目录、缩放、安装提示
- `styles.css`：桌面端和手机端样式
- `manifest.webmanifest`：PWA 应用配置
- `service-worker.js`：离线缓存
- `pages/`：电子书页面图片
- `assets/执行力心得体会汇编.pdf`：轻量下载版 PDF
