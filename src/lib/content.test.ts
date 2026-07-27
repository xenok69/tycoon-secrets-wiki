import { describe, expect, it } from "vitest"
import { findPage, tagsWithDifficulty, visibleChildren, type WikiPage } from "./content"

function page(
  title: string,
  overrides: Partial<WikiPage> = {}
): WikiPage {
  return {
    path: [title],
    slug: title,
    sourcePath: [title],
    title,
    hasContent: true,
    content: "",
    tags: [],
    visible: true,
    children: [],
    ...overrides,
  }
}

function parentWith(children: WikiPage[]): WikiPage {
  return page("Parent", { hasContent: false, children })
}

describe("difficulty folder hoisting", () => {
  it("hoists a page directly under its grandparent, skipping the difficulty folder", () => {
    const page = findPage(["white-palace", "Deeper"])
    expect(page).toBeDefined()
    expect(page?.difficultyLevel).toBe(1)
  })

  it("makes the raw difficulty-folder path unreachable", () => {
    expect(findPage(["white-palace", "1-stud-difficulty"])).toBeUndefined()
    expect(findPage(["white-palace", "1-stud-difficulty", "Deeper"])).toBeUndefined()
  })

  it("injects the difficulty tag first, ignoring any manual one in meta.json", () => {
    const page = findPage(["white-palace", "Deeper"])
    expect(page?.tags[0]).toBe("1 stud")
    expect(page?.tags.filter((t) => t === "1 stud")).toHaveLength(1)
  })

  it("does not list the difficulty folder as a child", () => {
    const whitePalace = findPage(["white-palace"])
    const childSegments = whitePalace?.children.map((c) => c.path.at(-1))
    expect(childSegments).toContain("Deeper")
    expect(childSegments).not.toContain("1-stud-difficulty")
  })

  it("keeps the real on-disk path separately for asset resolution", () => {
    const page = findPage(["white-palace", "Deeper"])
    expect(page?.sourcePath).toEqual(["white-palace", "1-stud-difficulty", "Deeper"])
  })

  it("hoists pages with punctuation in their folder name", () => {
    const page = findPage(["greenhouse", "Have a good water!"])
    expect(page).toBeDefined()
    expect(page?.difficultyLevel).toBe(1)
  })

  it("leaves pages outside a difficulty folder without a difficultyLevel", () => {
    const whitePalace = findPage(["white-palace"])
    expect(whitePalace?.difficultyLevel).toBeUndefined()
  })
})

describe("tagsWithDifficulty", () => {
  it("prepends the derived tag and strips any manual difficulty tag", () => {
    expect(tagsWithDifficulty(1, ["1 stud", "secret"])).toEqual(["1 stud", "secret"])
  })

  it("prepends the derived tag even when there is no manual one", () => {
    expect(tagsWithDifficulty(3, ["secret"])).toEqual(["3 stud", "secret"])
  })

  it("strips a mismatched manual tag in favor of the derived one", () => {
    expect(tagsWithDifficulty(2, ["5 stud", "secret"])).toEqual(["2 stud", "secret"])
  })

  it("returns tags unchanged when there is no difficulty level", () => {
    expect(tagsWithDifficulty(undefined, ["secret", "easy"])).toEqual(["secret", "easy"])
  })
})

describe("visibleChildren", () => {
  it("orders leveled pages hardest to easiest", () => {
    const parent = parentWith([
      page("Easy", { difficultyLevel: 1 }),
      page("Hard", { difficultyLevel: 4 }),
      page("Medium", { difficultyLevel: 2 }),
    ])
    expect(visibleChildren(parent).map((p) => p.title)).toEqual([
      "Hard",
      "Medium",
      "Easy",
    ])
  })

  it("breaks ties within the same level alphabetically", () => {
    const parent = parentWith([
      page("Zebra", { difficultyLevel: 3 }),
      page("Apple", { difficultyLevel: 3 }),
    ])
    expect(visibleChildren(parent).map((p) => p.title)).toEqual(["Apple", "Zebra"])
  })

  it("puts all leveled pages before unleveled pages/folders, regardless of title", () => {
    const parent = parentWith([
      page("Aardvark"),
      page("Zzz", { difficultyLevel: 1 }),
    ])
    expect(visibleChildren(parent).map((p) => p.title)).toEqual(["Zzz", "Aardvark"])
  })

  it("keeps pages before folders among unleveled children, alphabetical within each", () => {
    const parent = parentWith([
      page("Beta Folder", { hasContent: false, children: [page("Child")] }),
      page("Zed Page"),
      page("Alpha Page"),
    ])
    expect(visibleChildren(parent).map((p) => p.title)).toEqual([
      "Alpha Page",
      "Zed Page",
      "Beta Folder",
    ])
  })

  it("excludes invisible children", () => {
    const parent = parentWith([page("Visible"), page("Hidden", { visible: false })])
    expect(visibleChildren(parent).map((p) => p.title)).toEqual(["Visible"])
  })
})
