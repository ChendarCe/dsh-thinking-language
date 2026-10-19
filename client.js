/**
 * Thinking-language bundle 的浏览器半：在设置面板里注册「思考语言」页面。
 *
 * 页面读写的是 Host 插件的 volatile 配置（profile 条目 id 为
 * `thinking-language`）：`configForms` 服务负责读取、修订号和串行写入，
 * 因此这里不自己发 RPC，也不缓存权威值。开关直接写入，提示词先存草稿，
 * 点保存才写入，减少无谓的 patch 写入。
 */
window.__ModuleLoader__.load({
  id: 'dsh-thinking-language',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** 页面文案的词典命名空间。 */
    const NS = 'thinking-language.page'
    /** Host 插件在 profile patch 里的条目 id，也就是 Settings 的命名空间。 */
    const ENTRY = 'thinking-language'

    /** 与 index.js 保持一致的说明，仅用于页面里预览。 */
    const BUILTIN_PROMPT = `## 思考语言（强制）

- 无论用户使用哪种语言提问，也无论对话历史使用哪种语言，你的内部思考（thinking / reasoning）必须始终使用简体中文。
- 代码、命令、文件路径、标识符、专有名词、API 名称和用户原文保持原样，不要为了「中文思考」而翻译它们。
- 最终回复仍然使用与用户相同的语言；除非用户明确要求你用中文回复，不要因为这条规则改变回复语言。
- 不要在回复里说明这条规则，也不要解释你的思考语言；把注意力放在任务本身。`

    const zh = {
      nav: '中文思考',
      title: '中文思考',
      intro: '让模型在任何语言下都用中文思考。指令写入系统提示词，对所有会话——包括已经存在的对话和之后的新对话——的下一步生效。',
      toggleTitle: '启用中文思考',
      toggleDesc: '开启后模型在思考（reasoning）时始终使用简体中文；回复语言仍然跟随你。',
      promptTitle: '自定义提示词（完全覆盖内置）',
      promptHint: '留空时使用内置指令；填写后完全替换它。可以在这里写更细的思考要求，保存后当前对话与新对话都会在下一步使用。',
      promptPlaceholder: '例如：始终用简体中文思考；代码、命令和专有名词保持原样……',
      builtinSummary: '查看内置指令',
      reset: '恢复内置',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      unsaved: '有未保存的修改',
      readOnly: '当前部署的设置为只读。',
      unavailable: '宿主没有提供这个插件的设置，插件可能未加载。',
      loading: '正在读取设置…',
      toggleFailed: '开关未能保存，请重试。',
      saveFailed: '提示词未能保存，请重试。',
      modeBuiltin: '当前生效：内置指令',
      modeCustom: '当前生效：自定义提示词',
      chars: '{n} 字',
    }

    const en = {
      nav: 'Thinking language',
      title: 'Thinking language',
      intro: 'Make the model think in Chinese whatever language you use. The instruction joins the system prompt, so it applies to every conversation — existing ones and new ones alike — from the next step.',
      toggleTitle: 'Think in Chinese',
      toggleDesc: 'While on, the model reasons in Simplified Chinese; replies still follow your language.',
      promptTitle: 'Custom prompt (fully overrides the built-in)',
      promptHint: 'Leave empty to use the built-in instruction; non-empty text replaces it completely. It takes effect on the next step of the current conversation and of every new one.',
      promptPlaceholder: 'For example: always reason in Simplified Chinese; keep code, commands and proper nouns unchanged…',
      builtinSummary: 'Show the built-in instruction',
      reset: 'Use built-in',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved',
      unsaved: 'Unsaved changes',
      readOnly: 'This deployment stores settings read-only.',
      unavailable: 'The host does not serve this plugin’s settings; the plugin may not be loaded.',
      loading: 'Reading settings…',
      toggleFailed: 'The switch was not saved. Try again.',
      saveFailed: 'The prompt was not saved. Try again.',
      modeBuiltin: 'Active: built-in instruction',
      modeCustom: 'Active: custom prompt',
      chars: '{n} chars',
    }

    /* 只使用 --dsw-alias-* 主题 token；开关轨道用 label-primary + bg-base 保证
       明暗两套主题下都有对比度。 */
    const CSS = `
.tl-page{max-width:720px;display:flex;flex-direction:column;gap:4px;padding:4px 0 24px;color:var(--dsw-alias-label-primary)}
.tl-title{margin:0;font-size:16px;font-weight:500;line-height:24px;color:var(--dsw-alias-label-primary)}
.tl-intro{margin:6px 0 0;font-size:14px;line-height:22px;color:var(--dsw-alias-label-secondary)}
.tl-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.tl-row-main{min-width:0}
.tl-row-title{font-size:14px;line-height:20px}
.tl-row-desc{margin-top:4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.tl-field{display:flex;flex-direction:column;gap:8px;padding:16px 0 0}
.tl-label-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.tl-label{font-size:14px;line-height:20px}
.tl-count{flex:none;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.tl-hint{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.tl-error{margin:8px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-state-error-primary)}
.tl-textarea{box-sizing:border-box;width:100%;min-height:170px;resize:vertical;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;outline:none}
.tl-textarea::placeholder{color:var(--dsw-alias-label-secondary);opacity:.8}
.tl-textarea:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}
.tl-textarea:disabled{opacity:.6;cursor:default}
.tl-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px}
.tl-status{margin-right:auto;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.tl-status-dirty{color:var(--dsw-alias-state-warn-primary)}
.tl-btn{box-sizing:border-box;height:32px;padding:0 12px;border-radius:6px;font:inherit;font-size:13px;line-height:18px;cursor:pointer;white-space:nowrap}
.tl-btn:disabled{opacity:.5;cursor:default}
.tl-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.tl-btn-secondary{border:.5px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary)}
.tl-btn-secondary:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.tl-btn-primary{border:.5px solid transparent;background:var(--dsw-alias-brand-primary);color:#fff}
.tl-btn-primary:hover:not(:disabled){filter:brightness(1.08)}
.tl-builtin{margin-top:12px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:8px}
.tl-builtin summary{cursor:pointer;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);outline:none}
.tl-builtin summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;border-radius:4px}
.tl-builtin pre{white-space:pre-wrap;margin:8px 0 0;font:inherit;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.tl-switch{position:relative;flex:none;box-sizing:border-box;width:36px;height:20px;padding:0;border:.5px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;transition:background .15s ease,border-color .15s ease}
.tl-switch:disabled{opacity:.5;cursor:default}
.tl-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.tl-switch[aria-checked="true"]{background:var(--dsw-alias-label-primary);border-color:transparent}
.tl-switch-knob{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:var(--dsw-alias-label-secondary);transition:transform .15s ease,background .15s ease}
.tl-switch[aria-checked="true"] .tl-switch-knob{transform:translateX(16px);background:var(--dsw-alias-bg-base)}
@media (prefers-reduced-motion:reduce){.tl-switch,.tl-switch-knob{transition:none}}
`

    /**
     * 一个外观与宿主一致、可用键盘操作的开关。
     * @param props - checked、disabled、label 与 onChange。
     * @returns 开关按钮。
     */
    function Switch(props) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': props.checked ? 'true' : 'false',
          'aria-label': props.label,
          disabled: props.disabled === true,
          className: 'tl-switch',
          onClick: () => {
            if (props.disabled !== true) props.onChange(!props.checked)
          },
        },
        h('span', { className: 'tl-switch-knob', 'aria-hidden': 'true' }),
      )
    }

    /**
     * 设置页面本体。
     * @param props - 注入的 form（ConfigForm）、t 与关闭函数。
     * @returns 页面元素。
     */
    function ThinkingLanguagePage(props) {
      const { form, t } = props
      const textareaId = React.useId()
      const subscribe = React.useCallback((listener) => form.subscribe(listener), [form])
      const getSnapshot = React.useCallback(() => form.getSnapshot(), [form])
      const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

      const value = snapshot.value ?? {}
      const writable = snapshot.writable === true && snapshot.status === 'ready'
      const enabled = value.enabled !== false
      const savedPrompt = typeof value.prompt === 'string' ? value.prompt : ''

      const [draft, setDraft] = React.useState(savedPrompt)
      const [dirty, setDirty] = React.useState(false)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState('')

      // 宿主值变化时同步草稿；用户有未保存修改时不覆盖。
      React.useEffect(() => {
        if (!dirty) setDraft(savedPrompt)
      }, [savedPrompt, dirty])

      /**
       * 串行执行一次写入，并把失败转成页面上的错误文案。
       * @param operation - 返回 false 表示宿主拒绝。
       * @param message - 失败时显示给用户的文案。
       * @returns 是否成功。
       */
      const write = async (operation, message) => {
        setBusy(true)
        setError('')
        try {
          const accepted = await operation()
          if (accepted === false) {
            setError(message)
            return false
          }
          return true
        } catch (cause) {
          const detail = cause instanceof Error ? cause.message : String(cause)
          setError(detail.length > 0 ? `${message}（${detail}）` : message)
          return false
        } finally {
          setBusy(false)
        }
      }

      const onToggle = (next) => {
        write(() => form.set('enabled', next), t('toggleFailed'))
      }

      const onSave = async () => {
        const text = draft.trim()
        const accepted =
          text.length === 0
            ? await write(() => form.unset('prompt'), t('saveFailed'))
            : await write(() => form.set('prompt', text), t('saveFailed'))
        if (accepted) {
          setDraft(text)
          setDirty(false)
        }
      }

      const onReset = async () => {
        const accepted = await write(() => form.unset('prompt'), t('saveFailed'))
        if (accepted) {
          setDraft('')
          setDirty(false)
        }
      }

      if (snapshot.status === 'loading' || snapshot.status === 'idle') {
        return h('div', { className: 'tl-page' }, h('p', { className: 'tl-hint' }, t('loading')))
      }
      if (snapshot.status === 'unavailable') {
        return h('div', { className: 'tl-page' }, h('p', { className: 'tl-hint' }, t('unavailable')))
      }

      const statusText = busy
        ? t('saving')
        : dirty
          ? t('unsaved')
          : savedPrompt.trim().length > 0
            ? t('modeCustom')
            : t('modeBuiltin')

      return h(
        'div',
        { className: 'tl-page' },
        h('style', null, CSS),
        h('h2', { className: 'tl-title' }, t('title')),
        h('p', { className: 'tl-intro' }, t('intro')),
        h(
          'div',
          { className: 'tl-row' },
          h(
            'div',
            { className: 'tl-row-main' },
            h('div', { className: 'tl-row-title' }, t('toggleTitle')),
            h('div', { className: 'tl-row-desc' }, t('toggleDesc')),
          ),
          h(Switch, {
            checked: enabled,
            disabled: !writable || busy,
            label: t('toggleTitle'),
            onChange: onToggle,
          }),
        ),
        h(
          'div',
          { className: 'tl-field' },
          h(
            'div',
            { className: 'tl-label-row' },
            h('label', { className: 'tl-label', htmlFor: textareaId }, t('promptTitle')),
            h('span', { className: 'tl-count' }, t('chars', { n: draft.length })),
          ),
          h('p', { className: 'tl-hint' }, t('promptHint')),
          h('textarea', {
            id: textareaId,
            className: 'tl-textarea',
            value: draft,
            placeholder: t('promptPlaceholder'),
            spellCheck: false,
            disabled: !writable || busy,
            onChange: (event) => {
              setDraft(event.target.value)
              setDirty(true)
            },
          }),
          h(
            'div',
            { className: 'tl-actions' },
            h('span', { className: `tl-status${dirty ? ' tl-status-dirty' : ''}` }, statusText),
            h(
              'button',
              {
                type: 'button',
                className: 'tl-btn tl-btn-secondary',
                disabled: !writable || busy || (savedPrompt.length === 0 && draft.length === 0),
                onClick: onReset,
              },
              t('reset'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'tl-btn tl-btn-primary',
                disabled: !writable || busy || !dirty,
                onClick: onSave,
              },
              dirty ? t('save') : t('saved'),
            ),
          ),
          error.length > 0 ? h('p', { className: 'tl-error', role: 'alert' }, error) : null,
          !writable ? h('p', { className: 'tl-hint' }, t('readOnly')) : null,
        ),
        h(
          'details',
          { className: 'tl-builtin' },
          h('summary', null, t('builtinSummary')),
          h('pre', null, BUILTIN_PROMPT),
        ),
      )
    }

    return {
      inject: ['slots', 'locale', 'configForms'],
      /**
       * 注册词典与设置页面；宿主没有提供该命名空间时不注册页面。
       * @param ctx - 浏览器插件上下文。
       */
      apply(ctx) {
        const t = ctx.locale.bind(NS)
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'thinking-language: dictionaries')
        ctx.effect(
          () =>
            ctx.configForms.whileServed([ENTRY], () =>
              ctx.slots.inject('settings.section', () =>
                ctx.slots.register(
                  {
                    name: 'settings.section',
                    id: 'thinking-language',
                    order: 900,
                    label: () => t('nav'),
                    locale: NS,
                    inject: () => ({ form: ctx.configForms.get(ENTRY), t }),
                  },
                  ThinkingLanguagePage,
                ),
              ),
            ),
          'thinking-language: settings page',
        )
      },
    }
  },
})
