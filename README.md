# Slides Source

## 目录结构

```
src/
├── styles/main.css        # 共享样式
├── scripts/app.js         # 共享运行时逻辑
├── templates/*.html       # HTML 壳片段（head、shell、footer）
├── sections/*.html        # 各模块幻灯片内容
└── sections.json          # 分节清单与元数据
```

## 幻灯片模块

| 文件 | 模块 | 页数 |
|------|------|------|
| `01-opening.html` | 开场 | 11 |
| `02-local-deploy.html` | 本地部署 | 2 |
| `03-install-config.html` | 安装与配置 | 10 |
| `04-feishu.html` | 飞书接入 | 8 |
| `05-skills-customization.html` | Skills 与个性化 | 10 |
| `06-cases-faq.html` | 案例与 FAQ | 11 |
| `07-ending.html` | 结束 | 2 |

## 修改幻灯片

1. 编辑 `sections/` 下对应的 `.html` 文件
2. 如需调整样式，编辑 `styles/main.css`
3. 如需调整交互逻辑，编辑 `scripts/app.js`

## 构建

在项目根目录运行：

```bash
node scripts/build-slides.mjs
```

生成 `openclaw-training-ppt.html`。
