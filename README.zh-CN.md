# Zhaoqi Song 个人学术主页

这是可直接使用的静态网站，无需安装依赖或编译。

## 页面

- `index.html`：个人简介、研究兴趣、Selected Work、教育及论文等。
- `research.html`：研究概览图与各项目介绍。
- `scanyomics.html`：scAnyOmics 论文详情、全文搜索、原稿页面预览及 PDF 下载。
- `proclip.html`：保留的 ProCLIP 论文详情，搜索索引与实际 18 页 PDF 同步。
- `cv.html`：CV 预览和下载。

## 使用

解压后可打开 `index.html` 查看。完整预览也可以在此文件夹运行 `python3 -m http.server 8000`，然后访问 `http://localhost:8000`。

部署至 GitHub Pages 时，将此文件夹内的全部文件上传到网站仓库根目录，保留 `assets` 和 `.github` 的相对位置。沿用现有 GitHub Pages 工作流即可。

本次仅修改本地副本，未发布至线上。原始压缩包、论文、PPT 和 CV 附件均保留。网站中的 CV 副本仅同步了项目新名称。

## 后续维护

- 网站基础调整与项目卡片：`assets/css/portfolio.css`。
- 学历、实习、论文新增条目与链接交互样式：`assets/css/academic-polish.css`。
- 主题切换、手机导航与图片放大：`assets/js/site.js`。
- 两篇论文共用的检索与阅读逻辑：`assets/js/paper-search.js`。
- 论文原件：`assets/docs/`；CV：`assets/cv/CV.pdf`。
- 原稿页面预览：`assets/img/pages/`。替换 PDF 时，请同时更新对应预览图。
- 重新生成两篇论文的搜索数据：`python3 scripts/build_pdf_index.py`，需要 `pypdf`。
- 字体和功能图标已保存于本地。首页原有访客地图仍使用外部服务。

基于 Luka Homepage Template 修改，保留原有许可证与署名。

scAnyOmics 的 Publications 条目已预留空的 arXiv 编号和 Paper 链接区域。编号可填入 `.arxiv-id`；Paper 链接可添加到该条目的 `.links` 中。

第四版：ProCLIP 位于 scAnyOmics 下方，Paper 链接到 `proclip.html`。ProCLIP 页面顶部新增 workflow 展示区。首页已删除 Manuscripts in Preparation；Patent 已改为带原指定链接的独立条目。

## 第五版：Publications 排版
六篇文章统一为细分隔线目录，统一缩略图比例、文字间距和 Paper 按钮；arXiv、Manuscript 改为小标签。所有缩略图均可点击或键盘放大，手机端标题独占一行，元信息旁显示小图。论文顺序和链接保持原样，scAnyOmics 的编号和 Paper 链接仍留空。

## 第六版：Patent 样式统一
专利沿用 Publications 的目录结构、细分隔线、文字层级、图框和链接交互；去除原有渐变卡片，保留专利信息及原始链接。
