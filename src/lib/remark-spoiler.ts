import type { Root, RootContent, Text } from "mdast"
import type { Plugin } from "unified"
import { visit } from "unist-util-visit"

// ||text|| reveals inline on click, no questions asked.
// ??text?? is for actual solutions: clicking asks for confirmation first.
type Delimiter = "||" | "??"

interface Open {
  index: number
  delimiter: Delimiter
}

interface Close {
  nodeIndex: number
  offset: number
}

function findOpen(value: string): Open | null {
  const pipeIndex = value.indexOf("||")
  const questionIndex = value.indexOf("??")

  if (pipeIndex === -1 && questionIndex === -1) return null
  if (pipeIndex === -1) return { index: questionIndex, delimiter: "??" }
  if (questionIndex === -1) return { index: pipeIndex, delimiter: "||" }

  return pipeIndex < questionIndex
    ? { index: pipeIndex, delimiter: "||" }
    : { index: questionIndex, delimiter: "??" }
}

/** Looks for the matching closing delimiter, starting in the same text node
 * right after the opening mark, then across any following sibling nodes
 * (formatting like `**bold**` or `[links](...)` in between is just carried
 * along, not matched against). */
function findClose(
  items: RootContent[],
  openIndex: number,
  openEnd: number,
  delimiter: Delimiter
): Close | null {
  const openNode = items[openIndex] as Text
  const sameNodeOffset = openNode.value.indexOf(delimiter, openEnd)
  if (sameNodeOffset !== -1) return { nodeIndex: openIndex, offset: sameNodeOffset }

  for (let i = openIndex + 1; i < items.length; i++) {
    const item = items[i]
    if (item.type !== "text") continue
    const offset = item.value.indexOf(delimiter)
    if (offset !== -1) return { nodeIndex: i, offset }
  }

  return null
}

/** Collects everything between the opening and closing delimiter — plain
 * text plus whatever inline nodes (emphasis, strong, links, ...) sit between
 * them — so nested markdown formatting survives inside a spoiler/solution. */
function collectInner(
  items: RootContent[],
  openIndex: number,
  openEnd: number,
  close: Close
): RootContent[] {
  const openNode = items[openIndex] as Text

  if (openIndex === close.nodeIndex) {
    const text = openNode.value.slice(openEnd, close.offset)
    return text ? [{ type: "text", value: text }] : []
  }

  const inner: RootContent[] = []
  const firstText = openNode.value.slice(openEnd)
  if (firstText) inner.push({ type: "text", value: firstText })

  for (let i = openIndex + 1; i < close.nodeIndex; i++) {
    inner.push(items[i])
  }

  const closeNode = items[close.nodeIndex] as Text
  const lastText = closeNode.value.slice(0, close.offset)
  if (lastText) inner.push({ type: "text", value: lastText })

  return inner
}

const BLOCK_OPEN = "??>"
// Not `<??`: CommonMark treats a line starting with `<?` as the start of an
// HTML processing-instruction block, which swallows everything up to the
// next `?>` (or, absent one, the rest of the document) as raw HTML before
// this plugin ever sees it. Both markers start with `??` instead so neither
// can collide with a block-level start condition (blockquote, HTML, etc).
const BLOCK_CLOSE = "??<"

/** A paragraph consisting of nothing but the marker text, e.g. `??>` on its
 * own line (surrounded by blank lines, as CommonMark requires for it to be
 * its own paragraph). */
function isBlockMarker(node: RootContent, marker: string): boolean {
  if (node.type !== "paragraph" || node.children.length !== 1) return false
  const child = node.children[0]
  return child.type === "text" && child.value.trim() === marker
}

/**
 * Turns a `??>` ... `<??` marker pair (each on its own line) into a
 * `<solution-block>` node wrapping everything in between — multiple
 * paragraphs, images, lists, and so on — for solutions too long for a single
 * `??text??` span. Only scans top-level document content, not inside
 * blockquotes/list items.
 */
function transformBlockSolutions(tree: Root): void {
  const children = tree.children
  let start = -1

  for (let i = 0; i < children.length; i++) {
    if (start === -1) {
      if (isBlockMarker(children[i], BLOCK_OPEN)) start = i
      continue
    }

    if (isBlockMarker(children[i], BLOCK_CLOSE)) {
      const block: RootContent = {
        type: "solutionBlock",
        data: { hName: "solution-block" },
        children: children.slice(start + 1, i),
      } as unknown as RootContent

      children.splice(start, i - start + 1, block)
      i = start
      start = -1
    }
  }
}

/**
 * Turns `||text||` into a `<spoiler>` node and `??text??` into a `<solution>`
 * node, scanning across a whole run of sibling inline nodes (not just one
 * text node at a time) so formatting like `**bold**` or `[links](...)`
 * between the delimiters is kept intact instead of breaking the match.
 * Handled via `data.hName` so `mdast-util-to-hast`'s default unknown-node
 * handling picks them up without a custom remark-rehype handler. Rendered
 * by the `spoiler` / `solution` / `solution-block` entries in ReactMarkdown's
 * `components`.
 */
export const remarkSpoiler: Plugin<[], Root> = () => (tree) => {
  transformBlockSolutions(tree)

  visit(tree, (node) => {
    if (!("children" in node) || !Array.isArray(node.children)) return
    node.children = transformChildren(node.children as RootContent[])
  })
}

function transformChildren(children: RootContent[]): RootContent[] {
  const items = [...children]
  const output: RootContent[] = []
  let i = 0

  while (i < items.length) {
    const node = items[i]

    if (node.type !== "text") {
      output.push(node)
      i++
      continue
    }

    const open = findOpen(node.value)
    if (!open) {
      output.push(node)
      i++
      continue
    }

    const openEnd = open.index + open.delimiter.length
    const close = findClose(items, i, openEnd, open.delimiter)
    if (!close) {
      output.push(node)
      i++
      continue
    }

    const before = node.value.slice(0, open.index)
    if (before) output.push({ type: "text", value: before })

    const hName = open.delimiter === "||" ? "spoiler" : "solution"
    output.push({
      type: hName,
      data: { hName },
      children: collectInner(items, i, openEnd, close),
    } as unknown as RootContent)

    const closeNode = items[close.nodeIndex] as Text
    const suffix = closeNode.value.slice(close.offset + open.delimiter.length)

    // Replace the consumed range with just the leftover suffix (if any), so
    // it gets rescanned for any further pair right after this one.
    items.splice(i, close.nodeIndex - i + 1, ...(suffix ? [{ type: "text", value: suffix } as Text] : []))
  }

  return output
}
