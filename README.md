# 我的博客

基于 GitHub Pages 的静态博客，文章用 Markdown 写，`git push` 即发布。

## 快速开始

### 1. 创建仓库

在 GitHub 新建仓库，命名为 `<你的用户名>.github.io`。

### 2. 上传文件

将本目录所有文件推送到仓库：

```bash
git init
git add .
git commit -m "init blog"
git remote add origin https://github.com/<你的用户名>/<你的用户名>.github.io
git push -u origin main
```

### 3. 开启 GitHub Pages

仓库 → Settings → Pages → Source → Deploy from branch → `main` / `root`

### 4. 配置博客

访问你的博客地址，会出现初次配置界面，填入 GitHub 用户名和仓库名即可。

---

## 写文章

在博客中点击「✎ 写文章」，生成模板后：

1. 在本地 `posts/` 目录新建 `.md` 文件
2. 粘贴模板，用你喜欢的编辑器（Typora / VS Code / Obsidian）写内容
3. `git push`
4. 博客里点「↻ 刷新文章」

### Front-matter 格式

```markdown
---
title: 文章标题
date: 2025-12-10
category: go        # 填分类 ID（在设置里管理）
excerpt: 一句话描述
---

正文内容……
```

---

## 自定义

所有配置都在博客的「⚙ 博客设置」里完成：

- **个人简介**：名字、职位、头像、自我介绍、社交链接
- **文章分类**：可以增删改分类，设置名称、ID 和颜色
- **站点信息**：博客标题、副标题

设置保存在浏览器本地。如果想让 `config.json` 也同步，把设置内容手动更新到仓库的 `config.json` 即可（这样换设备时自动读取）。

---

## 文件结构

```
├── index.html        # 博客前端（唯一需要的 HTML 文件）
├── config.json       # 站点配置、个人简介、分类
├── posts/            # 文章目录
│   ├── go-gc-deep-dive.md
│   ├── grpc-in-production.md
│   └── side-hustle-start.md
└── README.md
```
