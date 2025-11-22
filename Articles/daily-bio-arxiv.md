# Daily-Bio-Arxiv

**Daily-Bio-Arxiv** 项目是一个简单的的工具，旨在简化跟踪最新科学研究的过程。它每天自动抓取 arXiv 存储库，重点关注生物学和计算机科学等特定类别。该项目利用大型语言模型（LLM），以您选择的语言生成新论文的简洁摘要。这些摘要随后会自动发布到一个简洁、易于访问的 GitHub Pages 网站，使获得的资料便于访问。
网站链接为[Daily-Bio-Arxiv](https://yukari502.github.io/Daily-Bio-Arxiv/)

### 这是网站界面预览

![Alt text](page1.png)
![Alt text](page2.png)

## 主要特点

* **每日更新**：自动从 arXiv 获取新论文。
* **AI 驱动的摘要**：利用 LLM 进行高效准确的摘要。
* **可定制**：配置类别、LLM 和摘要语言。
* **自动化部署**：将摘要发布到 GitHub Pages 网站。

## 使用

要设置此项目，您需要 fork 存储库，在 GitHub 存储库设置中配置必要的秘密（例如 LLM 的 API 密钥）和变量（例如 arXiv 类别和所需的摘要语言），然后运行提供的 GitHub Action。
具体流程请访问[Daily-Bio-Arxiv](https://github.com/yukari502/Daily-Bio-Arxiv)

## 使用的技术

* **编程语言**：Python
* **Web 技术**：HTML、CSS
* **自动化**：GitHub Actions、Shell 脚本
* **AI**：用于摘要的 LLM
