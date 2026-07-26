import { describe, expect, it } from "vitest"
import { findPage } from "./content"

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
