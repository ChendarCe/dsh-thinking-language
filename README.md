# dsh-thinking-language

English | [简体中文](#简体中文)

Ask DeepSeek Harness to reason in Simplified Chinese whatever language you use, and let you
replace that request with a prompt of your own. The instruction is a system-prompt section, so it
applies to the next model step of an existing conversation and to every new one.

## Install

```sh
dsh plugin --profile <profile> add github:ChendarCe/dsh-thinking-language
```

On DSH Desktop, install the same Git source from **Settings → Plugins**. Restart `dsh web` or the
app if the settings page does not appear, then reload the browser.

## Settings

Open **Settings → 中文思考 / Thinking language**:

| Setting | Default | Behavior |
| --- | --- | --- |
| 启用中文思考 / Enabled | On | Adds the instruction to the system prompt while on; off adds nothing. |
| 自定义提示词（完全覆盖内置） / Custom prompt | empty | Empty uses the built-in Chinese-thinking instruction; non-empty text replaces it completely. |

The page also shows the built-in instruction, a character count, and a reset button. Writes are
reported immediately: a refused write keeps the draft and shows the reason.

Both values are live: they persist in the active profile's `cordis.patch.yml` under the Loader
entry id `thinking-language`, survive restarts, and take effect at the next prompt assembly. The
browser page reads and writes them through DSH's `configForms` service, not a private channel.

## What the built-in instruction asks for

- the model reasons in Simplified Chinese regardless of the language of the request or history;
- code, commands, paths, identifiers, API names and quoted user text stay verbatim;
- replies still follow the user's language;
- the model does not mention the rule.

Model compliance is a request, not a guarantee. The plugin does not translate existing reasoning
text and does not rewrite conversation history.

## How it works

- `index.js` exports a `Config` with two `volatile` fields (`enabled`, `prompt`) and registers one
  `systemPrompt.section` at order `10400`, after every built-in section. The section's `text`
  function is evaluated on each `assemble()`, reads the current volatile values, and returns an
  empty string when disabled, which assembly drops.
- `client.js` registers the page into the `settings.section` slot and binds the `thinking-language`
  namespace through `configForms`. It renders its own switch and textarea with theme tokens instead
  of importing client primitives.
- The Host half makes no network requests.

## Compatibility

Verified on DSH `0.2.1-rc.2` with Node 24. Requires the DSH configuration API that serves volatile
plugin config to `configForms`, Cordis 4, and `@deepseek-ai/schemastery >= 3.18.4`. The manifest
declares no `engines.dsh` range because the required API predates no single clear release line;
a host that cannot serve `configForms` simply shows no settings page.

## License

MIT. See [LICENSE](LICENSE).

---

## 简体中文

让 DeepSeek Harness 无论你用哪种语言提问都用简体中文思考，并且允许你用自己写的提示词完全替换这条指令。
指令以系统提示词 section 的形式加入，所以对已有对话的下一步和之后的新对话都生效。

### 安装

```sh
dsh plugin --profile <profile> add github:ChendarCe/dsh-thinking-language
```

桌面版可以在 **设置 → 插件** 里安装同一个 Git 源。

### 设置

打开 **设置 → 中文思考**：

| 配置 | 默认值 | 行为 |
| --- | --- | --- |
| 启用中文思考 | 开 | 开启时向系统提示词加入指令；关闭时不加入任何内容。 |
| 自定义提示词（完全覆盖内置） | 空 | 留空使用内置的中文思考指令；非空文本完全替换它。 |

页面里还可以查看内置指令、字数统计，以及恢复内置。写入被宿主拒绝时会保留草稿并显示原因。

两个值都是实时配置，保存在当前 profile 的 `cordis.patch.yml`（Loader 条目 id `thinking-language`），
重启后保留，并在下一次系统提示词组装时生效。浏览器端通过 DSH 的 `configForms` 服务读写，没有私有通道。

### 内置指令要求

- 无论用户使用哪种语言、无论对话历史用什么语言，思考都用简体中文；
- 代码、命令、路径、标识符、API 名称和用户原文保持原样；
- 回复仍然跟随用户的语言；
- 不向用户解释这条规则。

模型遵守程度是请求而非保证；插件不会翻译已有的思考文本，也不会改写对话历史。

### 实现

- `index.js` 导出带两个 `volatile` 字段（`enabled`、`prompt`）的 `Config`，并在 order `10400`
  注册一个 `systemPrompt.section`（位于全部内置 section 之后）。section 的 `text` 在每次
  `assemble()` 时重新求值，读取当前配置；关闭时返回空串，组装时会被丢弃。
- `client.js` 把页面注册进 `settings.section`，通过 `configForms` 绑定 `thinking-language`
  命名空间；开关和文本框用主题 token 自行实现，没有引入客户端 primitives。
- Host 半不发起任何网络请求。

### 兼容性

在 DSH `0.2.1-rc.2`、Node 24 上验证。需要能把 volatile 配置提供给 `configForms` 的 DSH 配置 API、
Cordis 4，以及 `@deepseek-ai/schemastery >= 3.18.4`。没有声明 `engines.dsh` 范围，因为所需 API
没有一条清晰的版本分界；无法提供 `configForms` 的宿主只会不显示设置页。

### 许可

MIT，见 [LICENSE](LICENSE)。
