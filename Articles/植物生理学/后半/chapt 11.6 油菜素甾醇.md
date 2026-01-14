# Chapter 11-6 油菜素甾醇 (Brassinosteroids)

### 一、 重点名词解释

**油菜素甾醇 (Brassinosteroids, BRs):** 一类多羟基甾醇类植物激素，结构上与动物类固醇激素（如雄性激素、蜕皮激素）相似。它是植物体内第六大类激素，主要功能包括促进细胞伸长和分裂、维管束分化、生殖发育以及抗逆等。

**油菜素内酯 (Brassinolide, BL):** 自然界中活性最高的油菜素甾醇。1979年首次从油菜花粉中提取并解析其化学结构。它是BR生物合成途径的终产物。

**BRI1 (Brassinosteroid Insensitive 1, N):** 油菜素甾醇的细胞膜表面受体，属于富含亮氨酸重复序列的受体激酶 (LRR-RLK)。它包含胞外配体结合域、跨膜域和胞内激酶域。BRI1突变体表现出极度矮化且对BR不敏感的表型。

**BAK1 (BRI1-Associated Kinase 1, N):** BRI1的共受体（Co-receptor），也是一种LRR-RLK。在BR存在时，BAK1与BRI1形成异源二聚体并发生相互磷酸化，从而启动下游信号转导。*bak1* 突变体能部分抑制 *bri1* 的表型。

**DWF4 (DWARF4, N):** 编码细胞色素P450单加氧酶 (CYP90B1) 的基因，催化BR合成途径中的C-22羟化反应（限速步骤）。*dwf4* 突变体因BR合成受阻而表现为矮小表型。

**BIN2 (Brassinosteroid Insensitive 2, N):** 一种GSK3/Shaggy样激酶，是BR信号通路的负调控因子。在没有BR时，BIN2磷酸化转录因子BZR1/BES1，导致其被降解或被截留在细胞质中。

**BZR1/BES1 (Brassinazole Resistant 1 / bri1-EMS-Suppressor 1, N):** BR信号通路下游的关键转录因子。去磷酸化状态下的BZR1/BES1进入细胞核，结合在启动子的BRRE元件 (CGTGC/TG) 上，调控基因表达。

---

### 二、 植物生理学重点内容归纳

**1. 发现与结构**
*   **发现历程：** 1941年发现花粉提取物促进豆科植物伸长；1970年命名为“Brassins”；1979年确定Brassinolide (BL) 结构；1996年确定 *DET2* 和 *CPD* 为合成基因，且发现受体突变体 *bri1*；2000s后期被正式公认为第六大植物激素。
*   **结构特征：** 结构与昆虫蜕皮激素（Ecdysone）和哺乳动物性激素（睾酮、雌二醇）高度相似，但在植物中其受体位于**细胞表面**而非胞内。

**2. 生物合成与代谢**
*   **合成途径：** 以**菜油甾醇 (Campesterol)** 为前体，经过一系列氧化、羟化反应（早期C-6氧化或晚期C-6氧化途径），最终合成活性最强的 **Brassinolide (BL)**。
*   **关键酶：** **DWF4** (限速酶), CPD, DET2, ROT3/CYP90D1, CYP85A1/2 (Castasterone synthase) 等。这些基因的突变体均表现为矮化（Dwarfism）。
*   **失活机制：** 维持体内BR稳态至关重要。失活方式包括：
    *   **羟化：** BAS1 (P450) 介导的C-26羟化。
    *   **糖基化：** UGT73C5 介导的葡萄糖基转移。
    *   **磺化：** BNST3 介导的硫酸化。
*   **调控：** 终产物BL会对合成基因（如 *DWF4*, *CPD*）进行负反馈调节。同时，TCP1等转录因子可正向调控 *DWF4* 表达。

**3. 生理功能**
*   **细胞水平：** 促进细胞伸长（Cell elongation）和细胞分裂（Cell division，涉及CycD3诱导）。
*   **整体发育：**
    *   **株型控制：** BR合成缺陷导致植株矮小、叶片深绿、叶夹角变小（直立叶）。适当降低BR水平（如水稻 *osdwarf4*）可使叶片直立，增加密植条件下的光合效率，从而提高作物产量。
    *   **维管束发育：** 促进木质部（Xylem）分化，抑制韧皮部（Phloem）过度增殖。
    *   **其他：** 促进种子萌发、生殖发育（育性）、叶片衰老及抗逆反应。

**4. 信号转导 (Signal Transduction)**
BR信号转导是一个**去抑制 (Derepression)** 过程：
*   **受体复合物：** 细胞膜上的 **BRI1** (受体) 和 **BAK1** (共受体)。
*   **无BR时（关闭状态）：** BRI1的激酶域被 **BKI1** 结合而失活。胞质中的 **BIN2** 激酶处于活性状态，磷酸化转录因子 **BZR1/BES1**。磷酸化的BZR1/BES1与 **14-3-3蛋白** 结合被滞留在胞质中，或被蛋白酶体降解，导致下游基因无法表达。
*   **有BR时（开启状态）：**
    1.  BR分子结合BRI1胞外域，导致BKI1解离。
    2.  BRI1招募BAK1并发生相互磷酸化激活。
    3.  激活的BRI1磷酸化 **BSKs/CDG1**。
    4.  BSKs/CDG1 激活磷酸酶 **BSU1**。
    5.  BSU1 使 **BIN2** 去磷酸化并失活。
    6.  **PP2A** 磷酸酶使 **BZR1/BES1** 去磷酸化。
    7.  去磷酸化的BZR1/BES1 进入细胞核，调节靶基因表达。

---

### 三、 重点实验概述

**1. 菜豆第二节间伸长实验 (Bean Second Internode Bioassay)**
*   **背景：** 1941年 Mitchell 等人。
*   **内容：** 使用玉米花粉提取物处理菜豆幼苗。
*   **结果：** 处理组表现出显著的茎伸长和细胞伸长。
*   **意义：** 早期证明了植物体内存在促进伸长的活性物质（后来被鉴定为BR）。

**2. 拟南芥暗形态建成突变体筛选**
*   **背景：** 1996年 Li, Szekeres 等人。
*   **内容：** 筛选在暗中不能像正常植株那样伸长（去黄化）的突变体。
*   **结果：** 鉴定出 *det2* (de-etiolated 2) 和 *cpd* (constitutive photomorphogenic dwarf)。
*   **验证：** 外源施加BR可以恢复这些突变体的野生型表型。
*   **结论：** 证明了这些基因参与BR的生物合成，且BR对细胞伸长至关重要。

**3. *bri1* 不敏感突变体的鉴定与克隆**
*   **实验：** Clouse 等人 (1996) 筛选出表型类似BR合成缺陷（极度矮小），但对外源BR处理**不敏感**的突变体 *bri1*。Li & Chory (1997) 克隆了该基因。
*   **结果：** 发现 *BRI1* 编码一个富含亮氨酸重复序列的受体激酶 (LRR-RLK)。
*   **结论：** 确立了BRI1作为BR膜受体的地位。

**4. 根伸长抑制实验**
*   **内容：** 比较野生型 (Columbia) 和 *bri1* 突变体在不同浓度 24-表油菜素内酯 (24-epibrassinolide) 处理下的根长。
*   **结果：** 野生型根长随BR浓度增加受到强烈抑制；而 *bri1* 突变体的根长几乎不受高浓度BR的影响。
*   **结论：** 进一步证实 *bri1* 是BR不敏感突变体。

---

### 四、 问题回答 (Q&A)

**Q1: How do Brassinosteroids (BRs) differ from animal steroid hormones in terms of perception? (油菜素甾醇与动物类固醇激素在感知上有何不同？)**
**A:** 尽管结构相似，动物类固醇激素通常结合**胞内受体**（核受体），直接作为转录因子调节基因表达；而植物的BRs被定位在**细胞膜表面的受体激酶 (BRI1)** 感知，通过胞内磷酸化级联反应将信号传递至细胞核。

**Q2: Why are BR-deficient mutants dwarfed? (为什么BR缺陷突变体是矮小的？)**
**A:** BRs 在植物中主要负责促进**细胞伸长 (Cell elongation)** 和细胞分裂。缺乏BR（合成突变体）或无法感知BR（受体突变体）会导致细胞无法正常伸长，从而导致植株极其矮小（Dwarfism）。

**Q3: How can manipulating BR pathways improve crop yield? (调控BR通路如何提高作物产量？)**
**A:** 适度降低BR的合成（如水稻 *osdwarf4* 突变体）或减弱BR信号，可以使作物叶片夹角变小，呈现**直立叶 (Erect leaves)** 形态。这种株型有利于密植，减少叶片间的遮阴，提高群体的光合作用效率和生物量，从而增加产量。

**Q4: What is the "Sequential Activation Model" of BR signaling? (BR信号转导的“顺序激活模型”是什么？)**
**A:** 这是一个磷酸化级联反应模型：BR结合BRI1 $\rightarrow$ BRI1与BAK1互作并激活 $\rightarrow$ 磷酸化并激活BSK/CDG1 $\rightarrow$ 激活BSU1 (磷酸酶) $\rightarrow$ BSU1使BIN2 (抑制因子) 去磷酸化而失活 $\rightarrow$ 解除BIN2对转录因子BZR1/BES1的抑制 $\rightarrow$ 基因表达启动。