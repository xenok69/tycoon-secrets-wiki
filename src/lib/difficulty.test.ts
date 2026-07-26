import { describe, expect, it } from "vitest"
import { DIFFICULTY_COLORS, parseDifficultyTag, sortDifficultyFirst } from "./difficulty"

describe("parseDifficultyTag", () => {
  it.each([
    ["1 stud", 1],
    ["2 stud", 2],
    ["7 stud", 7],
  ])("parses %s as level %d", (tag, level) => {
    expect(parseDifficultyTag(tag)).toBe(level)
  })

  it("is case-insensitive", () => {
    expect(parseDifficultyTag("3 Stud")).toBe(3)
  })

  it("ignores levels above 7", () => {
    expect(parseDifficultyTag("8 stud")).toBeUndefined()
  })

  it("ignores levels below 1", () => {
    expect(parseDifficultyTag("0 stud")).toBeUndefined()
  })

  it("ignores unrelated tags", () => {
    expect(parseDifficultyTag("secret")).toBeUndefined()
  })
})

describe("sortDifficultyFirst", () => {
  it("moves the difficulty tag to the front", () => {
    expect(
      sortDifficultyFirst(["secret", "easy", "1 stud", "plain text"])
    ).toEqual(["1 stud", "secret", "easy", "plain text"])
  })

  it("leaves order unchanged when there is no difficulty tag", () => {
    expect(sortDifficultyFirst(["secret", "easy"])).toEqual(["secret", "easy"])
  })

  it("leaves order unchanged when the difficulty tag is already first", () => {
    expect(sortDifficultyFirst(["1 stud", "secret"])).toEqual(["1 stud", "secret"])
  })
})

describe("DIFFICULTY_COLORS", () => {
  it("has an entry for every level 1-7", () => {
    for (let level = 1; level <= 7; level++) {
      expect(DIFFICULTY_COLORS[level]).toBeDefined()
    }
  })
})
