# chapt 11.7 茉莉酸

## 一、 重点名词解释

**茉莉酸类 (Jasmonates, JAs):** 一类源自游离脂肪酸（如亚麻酸）氧化的**氧化脂类 (Oxylipins)** 植物激素。包括茉莉酸 (JA)、茉莉酸甲酯 (MeJA) 和活性形式茉莉酸-异亮氨酸 (JA-Ile)。它们在防御昆虫和死体营养型病原菌以及调控植物发育中起关键作用。


**死体营养型病原菌 (Necrotrophic pathogens, N):** 通过杀死植物细胞并以其死亡组织为食的病原菌（如 *Alternaria brassicicola*, *Botrytis cinerea*）。这类病原菌的侵染通常诱导植物产生茉莉酸 (JA) 进行防御，区别于活体营养型病原菌（诱导水杨酸 SA）。



### 二、 植物生理学重点内容归纳

**1. 生物合成与代谢 (Biosynthesis and Metabolism)**
*   **合成部位与路径：** 跨越三个细胞器。
    1.  **质体 (Plastid):** 膜脂中的 $\alpha$-亚麻酸 (18:3) 在 **LOX** (脂氧合酶), **AOS**, **AOC** 作用下转化为 OPDA。
    2.  **过氧化物酶体 (Peroxisome):** OPDA 被 **OPR3** 还原，经 $\beta$-氧化生成 **JA**。
    3.  **细胞质 (Cytosol):** JA 经 **JAR1** 催化与异亮氨酸结合生成活性形式 **JA-Ile**；或经 **JMT** 转化为挥发性的 **MeJA**。
*   **代谢失活：** 细胞色素 P450 酶 (**CYP94B3**) 负责将 JA-Ile 羟基化（12OH-JA-Ile）使其失活，这对于防止过度防御反应至关重要。

**2. 生理功能 (Physiological Functions)**
*   **防御反应 (Defense):**
    *   主要防御 **食草昆虫 (Insects)**（如棉铃象甲、叶甲）和 **死体营养型病原菌 (Necrotrophs)**。
    *   诱导次生代谢产物（如生物碱）和防御蛋白（如硫堇 Thionins）的合成。
*   **生长与发育 (Development):**
    *   **生殖发育：** 调控花药裂开 (Anther dehiscence) 和花粉成熟，JA合成缺陷会导致雄性不育。
    *   **根系：** 抑制主根生长 (Root growth inhibition)。
    *   **其他：** 促进表皮毛 (Trichome) 形成、诱导叶片衰老、调控气孔关闭（与 ABA 类似）。

**3. 信号转导机制 (Signal Transduction)**
茉莉酸信号转导采用与生长素相似的 **"去抑制 (Derepression)"** 模式：
*   **无 JA 时 (Off state):** JAZ 阻遏蛋白与转录因子（如 **MYC2**）结合，并招募共抑制因子（NINJA, TPL），抑制下游抗性基因表达。
*   **有 JA 时 (On state):**
    1.  **JA-Ile** 作为“分子胶水”，促进受体 **COI1** 与 **JAZ** 蛋白形成高亲和力复合物。
    2.  $SCF^{COI1}$ 泛素连接酶对 JAZ 进行泛素化标记。
    3.  **26S 蛋白酶体** 降解 JAZ 蛋白。
    4.  转录因子 **MYC2** 被释放，启动茉莉酸响应基因（如 *VSP*, *PDF1.2*）的转录。
![alt text](/Pic/植物生理学/后半/3.png)
---

### 三、 重点实验与突变体概述

**3. JAZ 蛋白降解的可视化实验**
*   **实验内容：** 构建表达 *JAZ1-GUS* 或 *JAZ-GFP* 融合蛋白的转基因植株。
*   **处理：** 施加 JA 处理。
*   **结果：** 对照组中有明显的 GUS 染色或 GFP 荧光；JA 处理后，信号迅速消失。若使用蛋白酶体抑制剂处理，信号则不消失。
*   **结论：** 直观证明了 JA 诱导 JAZ 蛋白通过 26S 蛋白酶体途径迅速降解。

---

### 四、 问题回答 (Q&A)

基于材料最后的 Summary 部分回答潜在问题：

**Q1: How are Jasmonates synthesized and metabolized? (茉莉酸是如何合成与代谢的？)**
**Answer:** 茉莉酸属于氧化脂类 (Oxylipins)，源于膜脂中游离脂肪酸的氧化。合成跨越三个细胞器：质体（亚麻酸 $\rightarrow$ OPDA）、过氧化物酶体（OPDA $\rightarrow$ JA）和细胞质（JA $\rightarrow$ JA-Ile）。JA-Ile 是活性形式，MeJA 是运输形式。JA-Ile 最终被细胞色素 P450 (CYP94B3) 氧化失活。

**Q2: What is the core mechanism of JA signaling? (JA 信号转导的核心机制是什么？)**
**Answer:** 核心是 **SCF-泛素-蛋白酶体途径介导的去抑制机制**。活性激素 JA-Ile 结合到 $SCF^{COI1}$ 受体复合物和 JAZ 阻遏蛋白之间，导致 JAZ 被泛素化并降解。JAZ 的降解解除了其对转录因子 MYC2 的抑制，从而激活下游基因表达。

