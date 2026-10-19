/**
 * Thinking-language bundle 的 Host 半。
 *
 * 唯一职责：往系统提示词里加一个 section。section 的文本在每次模型请求前
 * 重新求值（agent-loop 的 preStep 每步都会 assemble），所以开关和自定义
 * 提示词的修改会立刻作用于当前对话的下一步，也会作用于之后新建的对话。
 *
 * 两个配置字段都标记为 volatile：Settings 服务只把 volatile 字段投影成
 * 可编辑表单，并且会把值以 Volatile box（带 .get()）的形式交给 apply，
 * 因此这里每次求值都重新读取，而不是在 apply 时缓存。
 */
import z from '@deepseek-ai/schemastery'

/** 宿主必须提供系统提示词注册表。 */
export const inject = ['systemPrompt']

/** 内置的中文思考指令；自定义提示词为空时使用它。 */
export const DEFAULT_PROMPT = `## 思考语言（强制）

- 无论用户使用哪种语言提问，也无论对话历史使用哪种语言，你的内部思考（thinking / reasoning）必须始终使用简体中文。
- 代码、命令、文件路径、标识符、专有名词、API 名称和用户原文保持原样，不要为了「中文思考」而翻译它们。
- 最终回复仍然使用与用户相同的语言；除非用户明确要求你用中文回复，不要因为这条规则改变回复语言。
- 不要在回复里说明这条规则，也不要解释你的思考语言；把注意力放在任务本身。`

/** 旧版 schemastery 没有 .volatile()：降级为普通字段，插件仍能加载。 */
function live(schema) {
  return typeof schema.volatile === 'function' ? schema.volatile() : schema
}

/**
 * 插件配置。enabled 是总开关，prompt 是「完全覆盖内置指令」的自定义文本；
 * 两者都写入 profile patch，因此重启后保留。
 */
export const Config = z.object({
  enabled: live(z.boolean().default(true).description('开启后模型始终用简体中文思考。')),
  prompt: live(z.string().default('').description('非空时完全替换内置的中文思考指令。')),
})

/**
 * 读取可能是 Volatile box 的字段值。
 * @param value - 配置字段（Volatile box、普通值或 undefined）。
 * @param fallback - 字段缺失时的默认值。
 * @returns 当前值。
 */
function current(value, fallback) {
  if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
    const next = value.get()
    return next === undefined ? fallback : next
  }
  return value === undefined ? fallback : value
}

/**
 * 注册提示词 section，并把设置面板的自动页面关掉（本插件自带页面）。
 * @param ctx - 插件上下文。
 * @param config - 行配置；volatile 字段是实时引用。
 */
export function apply(ctx, config = {}) {
  // 自带设置页面，避免 Settings 再生成一个只有 schema 的自动页面。
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber), 'thinking-language: settings presentation')
  })

  ctx.effect(
    () =>
      ctx.systemPrompt.section({
        name: 'thinking-language:instruction',
        // 放在所有内置 section 之后（persona suffix 是 10200），靠近请求末尾，
        // 对思考语言这种行为约束更稳；同时也是稳定的尾部，不破坏前缀缓存。
        order: 10400,
        // 用户文本必须原样保留：不要因为 {{...}} 之类的内容让组装失败。
        interpolate: false,
        text: () => {
          if (current(config.enabled, true) !== true) return ''
          const custom = current(config.prompt, '')
          const text = typeof custom === 'string' ? custom.trim() : ''
          return text.length > 0 ? text : DEFAULT_PROMPT
        },
      }),
    'thinking-language: instruction section',
  )
}
