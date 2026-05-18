---
name: hr-compensation-checks
description: 帮 HR 做定薪判断、band 对标、市场调研摘要，以及个税社保公积金申报前检查，先看值不值，再看会不会出风险。 / Help HR teams with compensation review, band and market checks, and payroll filing prechecks.
version: 0.3.0
metadata:
  openclaw:
    homepage: https://github.com/Ashley-AIHR/hrskill-compensation-module
    envVars:
      - name: COMP_EXPORT_PATH
        required: false
        description: Optional local export path for filing check outputs.
---

# 定薪与申报检查助手 / Compensation Decision and Filing Check Assistant

当用户需要做两类薪酬工作时使用这个 skill：

1. 薪酬判断：band、市场调研、offer 定薪建议
2. 薪酬执行：个税、社保、公积金申报前检查

它不是完整薪酬系统，也不是帮用户手算工资的工具，而是一个帮 HR 做判断、做解释、做申报前排雷的第二双眼睛。 / Use this skill for both compensation decision work and payroll filing risk checks in China.

## 你可以先做这 3 件事 / Start Here

第一次使用时，优先把用户带到下面 3 个入口之一：

1. `做定薪判断`
2. `看市场对标`
3. `做申报前检查`

默认向导语：

1. `把 band、市场分位、候选人期望和内部参考发给我，我先帮你判断怎么定更稳。`
2. `把岗位级别、市场调研结果和内部同岗数据发给我，我先帮你看对标位置和风险。`
3. `把本月申报前数据导出发给我，我先帮你把漏人、错基数、错主体和高风险问题挑出来。`

## 你要准备什么 / What To Prepare

默认接受用户的真实工作材料，不要求一开始就整理成完美结构。 / Accept real working materials by default instead of requiring perfect structure upfront.

最常见输入包括：

1. band 表或岗位级别说明
2. 市场薪酬调研数据
3. 内部同岗同级参考数据
4. 候选人当前薪资、期望薪资或拟发 offer
5. 个税、社保、公积金申报字段
6. 员工状态、法人主体、缴纳地信息

## 你会拿到什么 / What The User Gets

每次运行后，优先让用户看到这 5 块结果：

1. `核心结论`
2. `判断依据`
3. `高风险问题`
4. `下一步动作`
5. `内部说明稿或沟通稿`

如果用户需要文件，还要补：

1. Word 分析报告
2. CSV 检查记录
3. JSON 结构化输出

## 当前 production-ready 场景

1. `薪酬 band / 市场调研 / 定薪建议`
2. `个税 / 社保 / 公积金申报前检查`

这两个场景分别解决两类问题：

1. 第一类解决“值多少钱、怎么定更合理”
2. 第二类解决“报之前有哪些坑、哪些风险要先排”

## 运行时体验 / Runtime Experience

在交互中，不要只给最终答案。先让用户看见处理中步骤，再给结果。 / Do not only return the final answer. Show the user the work stages first.

推荐按这个顺序组织过程：

1. `正在读取材料`
2. `正在抽取关键字段`
3. `正在检查 band、市场或申报风险`
4. `正在生成结论、依据和下一步`
5. `正在整理报告、记录和说明稿`

## 统一输出结构

处理这类薪酬检查任务时，始终产出：

```text
normalized_data
decision_summary
decision_basis
missing_information
risk_summary
priority_issues
next_action
message_draft
record_update
human_confirmation_needed
compliance_warning_if_any
```

要求：

1. `normalized_data` 要清楚列出人员、申报主体、申报地、基数和扣除信息。
2. `decision_summary` 要先回答“怎么定”或“能不能报”。
3. `decision_basis` 要把 band、市场、内部参考或申报依据讲清楚。
4. `missing_information` 要直接指出缺什么字段、缺在哪一类人员上。
5. `risk_summary` 要优先写申报失败风险、内部公平风险和合规风险。
6. `priority_issues` 要按高、中、低分级。
7. `next_action` 必须是 HR 今天可以执行的动作。
8. `message_draft` 默认写成给内部协作方的数据追回或风险说明话术。
9. `record_update` 适合写回申报 tracker 或月度薪酬待办表。
10. `human_confirmation_needed` 要明确哪些地方必须由 HR、业务负责人或薪酬负责人确认。

## 当前 production-ready workflows

### `review_compensation_band_and_offer`

触发：

1. HR 准备做 offer 定薪
2. HR 想看候选人期望与 band、市场分位、内部公平是否匹配
3. HR 想给老板准备定薪建议说明

典型输入：

1. 岗位职级与岗位族
2. band 最低值、中位值、最高值
3. 市场调研分位点
4. 候选人当前薪资与期望薪资
5. 内部同岗参考

典型输出：

1. band 位置判断
2. 市场对标摘要
3. 定薪建议
4. 风险说明
5. 给业务/老板的摘要
6. 可下载的分析报告、CSV、JSON

结果页优先展示：

1. `建议怎么定`
2. `为什么这么定`
3. `内部公平或预算风险`
4. `建议怎么和业务解释`
5. `还需要谁确认`

如果在本仓库本地运行，使用：

```text
node scripts/generate_band_offer_packet.js <input.json> <output-dir>
```

示例输入见 [assets/band-offer-review-input.sample.json](assets/band-offer-review-input.sample.json)。

### `precheck_payroll_filing`

触发：

1. 月度工资已经核完，准备进入个税、社保、公积金申报
2. HR 想先看有没有漏人、错基数、错申报地、错主体、专项附加扣除异常

典型输入：

1. 员工薪酬明细
2. 个税申报字段
3. 社保、公积金申报字段
4. 员工状态与法人主体信息

典型输出：

1. 高风险问题清单
2. 缺失字段清单
3. 申报前待办
4. 内部说明稿
5. 可下载的检查报告、CSV、JSON

结果页优先展示：

1. `能不能直接报`
2. `高风险问题`
3. `按人列出的缺口`
4. `今天先处理什么`
5. `给内部同事的追回或提醒话术`

如果在本仓库本地运行，使用：

```text
node scripts/generate_payroll_precheck_packet.js <input.json> <output-dir>
```

示例输入见 [assets/payroll-precheck-input.sample.json](assets/payroll-precheck-input.sample.json)。

## 工作原则

1. 做薪酬判断时，先看 band、市场和内部公平，再看单一薪资数字。
2. 做申报检查时，优先检查申报失败风险，而不是追求复杂表达。
3. 优先发现“漏人、错城市、错主体、错基数、缺专项附加扣除”。
4. 如果只能做一件事，先把高风险问题按人列清楚。
5. 先给结论，再给依据，再给待办。
6. 不自动给出法律结论，但要明确提示合规风险。
7. 如果用户给了自己公司的口径或 band 规则，优先遵循用户口径。
8. 不要假设用户会写 prompt，要主动告诉用户下一步该补什么材料。

## 参考资料

1. [references/compensation-workflows.md](references/compensation-workflows.md)
2. [references/real-user-scenario.md](references/real-user-scenario.md)
