# macOS 原生词典制作与导入教程 (AppleDict)

---

## 1. 为什么选择原生词典？

macOS 的原生词典系统因其深度集成而备受推崇，特别是配合触控板的**三指轻点**取词功能，能够提供无与伦比的便捷查词体验。

然而，macOS 自带的词典库虽然质量上乘，但数量和种类有限，难以满足专业或特定语言学习的需求。为了突破这一限制，我们可以通过工具将第三方词典（如 `.mdx` 格式）转换为 macOS 原生支持的格式，实现高度的个性化定制。

![convenient](/Pic/语言学习记录/1.png)

---

## 2. 环境部署与前期准备

本教程主要依赖命令行工具，请确保你对终端（Terminal）有基本的操作认知。
*参考项目：[pyglossary](https://github.com/ilius/pyglossary/blob/master/doc/apple.md)*

### 2.1 安装 Homebrew
如果您尚未安装 Homebrew，请先在终端执行以下命令进行安装（如果已安装请跳过）：

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2.2 搭建 Python 与 Git 环境
我们需要安装 Python 3 和 Git，并安装转换所需的 Python 库。

1. **安装基础工具**：
   ```shell
   brew install python git
   ```

2. **下载 Pyglossary 及依赖**：
   建议在 `Downloads` 目录下进行操作，方便管理。
   ```shell
   cd ~/Downloads
   
   # 克隆 Pyglossary 仓库
   git clone https://github.com/ilius/pyglossary.git
   
   # 安装必要的 Python 依赖库
   sudo pip3 install lxml beautifulsoup4 html5lib
   ```

### 2.3 获取 Apple Dictionary Development Kit
制作词典还需要苹果提供的开发工具包。

*   **方法一（推荐）**：直接从 GitHub 克隆整理好的工具包。
    ```shell
    # 同样在 Downloads 目录下执行
    git clone https://github.com/SebastianSzturo/Dictionary-Development-Kit.git
    ```
    *(工具来源：[Dictionary-Development-Kit](https://github.com/SebastianSzturo/Dictionary-Development-Kit))*

*   **方法二**：从 Apple 官方下载 [Additional Tools for Xcode](https://developer.apple.com/download/all/?q=Command%20Line%20Tools)。下载后解压，找到 `Utilities/Dictionary Development Kit` 并将其放置在便于访问的路径（如 `/Applications/Utilities`）。

---

## 3. 准备词典源文件
本教程以常见的 **.mdx** 格式为例。其他格式的支持情况可参考 Pyglossary 文档。

**词典资源推荐：**
*   [FreeMdict Forum](https://freemdict.com/)
*   [FreeMdict Search](https://search.freemdict.com/)

---

## 4. 制作与安装步骤

我下载了一本 `牛津高階英漢雙解詞典8th.mdx` 的词典文件，本文将以此为例。

### 4.1 转换词典格式
首先创建一个工作文件夹，将你的 `.mdx` 文件放入其中。然后在终端中运行 `pyglossary` 进行转换：

```shell
# 语法说明：python3 <pyglossary路径> --write-format=AppleDict "<源文件>" "<输出名称>"
# 假设你在 Downloads 目录下：
python3 ~/Downloads/pyglossary/main.py --write-format=AppleDict "牛津高階英漢雙解詞典8th.mdx" "牛津高階英漢雙解詞典8th"
```

执行成功后，会在当前目录下生成一个名为 `牛津高階英漢雙解詞典8th` 的文件夹，其结构如下：
![tex](/Pic/语言学习记录/2.png)

### 4.2 配置构建环境 (Makefile)
进入生成的词典文件夹，找到 `Makefile` 文件并打开编辑。
我们需要修改 `DICT_BUILD_TOOL_DIR` 变量，将其指向我们在 **2.3 节** 中下载的 Dictionary Development Kit 的路径。

*例如，如果你使用的是 GitHub 克隆的工具包，路径可能是 `/Users/你的用户名/Downloads/Dictionary-Development-Kit`。*

![DIR](/Pic/语言学习记录/3.png)

### 4.3 编译词典
在终端中进入该词典文件夹，并执行 `make` 命令：

```shell
cd "牛津高階英漢雙解詞典8th"
make
```

编译完成后，你会在 `objects` 子文件夹中找到生成的 `.dictionary` 文件。
![text](/Pic/语言学习记录/4.png)

### 4.4 安装与启用
1.  **安装**：将生成的 `.dictionary` 文件移动到 macOS 的词典存放目录：
    *   路径：`~/Library/Dictionaries`
    *   或者：打开「词典」应用，点击菜单栏 `文件` -> `打开词典文件夹`，然后将文件拖入。

2.  **启用**：
    *   打开「词典」应用。
    *   点击菜单栏 `词典` -> `设置` (Preferences)。
    *   在列表中找到你刚才添加的词典，勾选它。

![text](/Pic/语言学习记录/5.png)

---

## 5. 最终效果
现在，你可以使用三指轻点或在词典应用中直接查询单词。

下面是我制作的日文词典效果。
![text](/Pic/语言学习记录/６.png)
