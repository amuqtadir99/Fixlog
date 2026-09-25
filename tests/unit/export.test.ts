import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";
import { icsEscape, toIcs } from "@/lib/ics";

describe("csv", () => {
  it("neutralises spreadsheet formulas", () => {
    for (const bad of ["=HYPERLINK(1)", "+1", "-2", "@SUM(A1)", "\tx"]) {
      expect(csvCell(bad).replace(/^"/, "").startsWith("'")).toBe(true);
    }
  });

  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell(null)).toBe("");
    expect(toCsv(["a", "b"], [[1, "x"]])).toBe("a,b\r\n1,x\r\n");
  });
});

describe("ics", () => {
  it("escapes text and emits all-day events", () => {
    expect(icsEscape("a,b;c\nd\\")).toBe("a\\,b\\;c\\nd\\\\");
    const out = toIcs([{ uid: "1", date: "2026-12-31", summary: "Oil, filter" }], new Date("2026-09-25T00:00:00Z"));
    expect(out).toContain("DTSTART;VALUE=DATE:20261231");
    expect(out).toContain("DTEND;VALUE=DATE:20270101");
    expect(out).toContain("SUMMARY:Oil\\, filter");
    expect(toIcs([{ uid: "2", date: "2026-12-31", summary: "a;b" }])).toContain("SUMMARY:a\\;b");
    expect(out.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
