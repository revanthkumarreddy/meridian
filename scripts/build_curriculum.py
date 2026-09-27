#!/usr/bin/env python3
"""Build the shared curriculum JSON and the Meridian workbook."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import DoughnutChart, Reference
from openpyxl.chart.series import DataPoint
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.fill import PatternFillProperties, ColorChoice
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.chart.legend import Legend
from openpyxl.chart.label import DataLabelList

from curriculum.days import WEEKS
from curriculum.reference import CHEATS, COMPANIES, PATHS, PROJECTS, RULES, STORIES, TOPICS

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "src" / "data" / "curriculum.json"
XLSX_PATH = ROOT / "public" / "Meridian-SDE2-AI-Roadmap.xlsx"

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

INK = "1A1814"
NAVY = "1E2A32"
PAPER = "F7F1E6"
CREAM = "FBF8F2"
SAFFRON = "C56A12"
TEAL = "0F6E6B"
CLAY = "9C4034"
INDIGO = "2C4068"
SAGE = "2F6B4F"
GOLD = "8C6A2F"
SLATE = "5E584E"
LINE = "E4D9C8"
WHITE = "FFFcf7"

TRACK_FILL = {
    "DSA": "F8E4DE",
    "CS": "E3E8F2",
    "Design": "E7EEF5",
    "Behavioral": "F8F0DC",
    "AI": "E3F2F0",
    "Foundations": "F3EBDF",
    "Interview": "F8E7D2",
    "Interview ops": "F8E7D2",
}
TRACK_HEADER = {
    "DSA": CLAY,
    "CS": INDIGO,
    "Design": INDIGO,
    "Behavioral": GOLD,
    "AI": TEAL,
    "Foundations": "6B5344",
    "Interview": SAFFRON,
    "Interview ops": SAFFRON,
}

THIN = Border(
    left=Side(style="thin", color=LINE),
    right=Side(style="thin", color=LINE),
    top=Side(style="thin", color=LINE),
    bottom=Side(style="thin", color=LINE),
)
MED = Border(
    left=Side(style="medium", color=NAVY),
    right=Side(style="medium", color=NAVY),
    top=Side(style="medium", color=NAVY),
    bottom=Side(style="medium", color=NAVY),
)


def solid(hex_color: str) -> PatternFill:
    return PatternFill("solid", fgColor=hex_color)


def font(size=11, bold=False, color=INK, name="Calibri", italic=False) -> Font:
    return Font(name=name, size=size, bold=bold, color=color, italic=italic)


def wrap(horizontal="left", vertical="center") -> Alignment:
    return Alignment(wrap_text=True, horizontal=horizontal, vertical=vertical)


def paint(cell, text, *, size=11, bold=False, color=INK, fill=None, horizontal="left", vertical="center", italic=False):
    cell.value = text
    cell.font = font(size, bold, color, italic=italic)
    cell.alignment = wrap(horizontal, vertical)
    if fill:
        cell.fill = solid(fill)
    return cell


def set_widths(ws, widths):
    for col, width in widths.items():
        ws.column_dimensions[col].width = width


def header_row(ws, row, labels, fill_color=NAVY):
    for col, label in enumerate(labels, start=1):
        cell = ws.cell(row, col, label)
        cell.font = font(11, True, WHITE)
        cell.fill = solid(fill_color)
        cell.alignment = wrap("center", "center")
        cell.border = THIN
    ws.row_dimensions[row].height = 32
    ws.auto_filter.ref = f"A{row}:{get_column_letter(len(labels))}{row}"
    ws.freeze_panes = f"A{row + 1}"
    ws.auto_filter.ref = None  # set later once data exists


def style_data_cell(cell, fill_color=None):
    cell.font = font(10, color=INK)
    cell.alignment = wrap("left", "top")
    cell.border = THIN
    if fill_color:
        cell.fill = solid(fill_color)
    else:
        cell.fill = solid(CREAM)


def status_validation(ws, cell_range):
    dv = DataValidation(
        type="list",
        formula1='"Not started,Light,In progress,Done,Redo,Skipped"',
        allow_blank=False,
    )
    dv.error = "Pick a status from the list."
    dv.errorTitle = "Status"
    dv.prompt = "Not started, Light, In progress, Done, Redo, or Skipped"
    dv.promptTitle = "Status"
    ws.add_data_validation(dv)
    dv.add(cell_range)
    return dv


def confidence_validation(ws, cell_range):
    dv = DataValidation(type="whole", operator="between", formula1="1", formula2="5", allow_blank=True)
    dv.error = "Use 1 (shaky) through 5 (could teach it)."
    dv.errorTitle = "Confidence"
    dv.prompt = "1 shaky · 5 could teach it"
    dv.promptTitle = "Confidence"
    ws.add_data_validation(dv)
    dv.add(cell_range)


def status_rules(ws, cell_range):
    rules = [
        ("Done", "D9EFE3", SAGE),
        ("In progress", "FDE7C7", "8A5A12"),
        ("Light", "E7F0FA", INDIGO),
        ("Redo", "F8D6D1", CLAY),
        ("Skipped", "EEEAE4", SLATE),
    ]
    for value, bg, fg in rules:
        ws.conditional_formatting.add(
            cell_range,
            CellIsRule(operator="equal", formula=[f'"{value}"'], fill=solid(bg), font=font(10, True, fg)),
        )


def flatten_days():
    days = []
    number = 1
    for week in WEEKS:
        for index, day in enumerate(week["days"], start=1):
            days.append(
                {
                    "day": number,
                    "week": week["week"],
                    "weekday": WEEKDAYS[index - 1],
                    "phase": week["phase"],
                    "week_title": week["title"],
                    "optional_week": week["optional"],
                    **day,
                }
            )
            number += 1
    return days


def build_payload(days):
    weeks = []
    for week in WEEKS:
        copy = {k: v for k, v in week.items() if k != "days"}
        copy["days"] = [
            d for d in days if d["week"] == week["week"]
        ]
        weeks.append(copy)
    return {
        "meta": {
            "name": "Meridian",
            "title": "SDE-2 and applied AI preparation desk",
            "horizon": "Week 0 optional, then 16 weeks",
            "hours": "About 12–18 hours a week. Use the 60-minute cut when life is smaller, and the 3-hour cut when you can go deep.",
            "level_note": "SDE-2 usually sits near Google L4, Meta E4, Amazon L5, and Microsoft 62. Ladders move. Confirm the requisition.",
            "updated": str(date.today()),
        },
        "paths": PATHS,
        "rules": RULES,
        "weeks": weeks,
        "days": days,
        "topics": [{**t, "id": i + 1} for i, t in enumerate(TOPICS)],
        "companies": COMPANIES,
        "projects": PROJECTS,
        "cheats": CHEATS,
        "stories": [
            {"id": s[0], "prompt": s[1], "signal": s[2], "themes": s[3]} for s in STORIES
        ],
    }


def sheet_setup(ws, tab_color, paper=PAPER):
    ws.sheet_properties.tabColor = tab_color
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.page_setup.paperSize = ws.PAPERSIZE_TABLOID
    ws.sheet_view.showGridLines = False
    ws.sheet_view.zoomScale = 110
    ws.page_setup.horizontalCentered = True
    ws.oddHeader.left.text = "Meridian  ·  SDE-2 + applied AI"
    ws.oddFooter.right.text = "Page &P"
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.freeze_panes = "A1"
    # paint a wide paper background lightly via columns later
    ws.sheet_format.defaultRowHeight = 18
    ws.oddHeader.center.text = ""
    _ = paper


def build_start(wb, days):
    ws = wb.active
    ws.title = "Start Here"
    sheet_setup(ws, SAFFRON)
    ws.sheet_view.zoomScale = 120
    ws.freeze_panes = "A8"
    set_widths(ws, {
        "A": 3, "B": 28, "C": 22, "D": 22, "E": 22, "F": 22, "G": 22, "H": 22, "I": 18, "J": 18, "K": 3,
    })
    for col in range(1, 12):
        for row in range(1, 78):
            ws.cell(row, col).fill = solid(PAPER)

    ws.merge_cells("B2:J2")
    paint(ws["B2"], "MERIDIAN", size=36, bold=True, color=WHITE, fill=NAVY, horizontal="left", vertical="center")
    for col in range(2, 11):
        ws.cell(2, col).fill = solid(NAVY)
    ws.row_dimensions[2].height = 48

    ws.merge_cells("B3:J3")
    paint(
        ws["B3"],
        "SDE-2  ·  Google L4 and the loops beside it  ·  plus the AI you actually have to build",
        size=14,
        bold=True,
        color=NAVY,
        fill="F3E2C8",
        horizontal="left",
    )
    for col in range(2, 11):
        ws.cell(3, col).fill = solid("F3E2C8")
    ws.row_dimensions[3].height = 24

    ws.merge_cells("B4:J4")
    paint(
        ws["B4"],
        "A sixteen-week desk for coding, system design, stories, and applied AI: embeddings, RAG, vector search, LangChain, LangGraph, evals. Week 0 is the on-ramp if the language is not fluent yet.",
        size=11,
        color=SLATE,
        fill=CREAM,
    )
    for col in range(2, 11):
        ws.cell(4, col).fill = solid(CREAM)
    ws.row_dimensions[4].height = 36

    # How to use
    ws.merge_cells("B6:D6")
    paint(ws["B6"], "HOW TO USE THIS BOOK", size=12, bold=True, color=WHITE, fill=SAFFRON)
    for col in range(2, 5):
        ws.cell(6, col).fill = solid(SAFFRON)
    steps = [
        ("1", "Pick a path", "On the Paths sheet, choose General SDE-2, AI-product SDE-2, or Applied AI engineer. The daily rule for that path decides what you cut when time shrinks."),
        ("2", "Set a start date", "Put a Monday in the gold box on this sheet. The desk will point at today's row."),
        ("3", "Work the Daily Plan", "One row a day. Status and confidence are yours to edit. Everything else is the plan."),
        ("4", "Mark the library", "When a topic feels teachable, mark it Done in Topic Library. That is a second scoreboard, slower than the daily one."),
        ("5", "Tell stories on Sundays", "The Story Bank is empty on purpose. True stories only."),
        ("6", "Mock from Week 7", "A mock without a retro does not count. Repairs replace new topics."),
    ]
    for i, (n, title, body) in enumerate(steps):
        row = 7 + i
        paint(ws.cell(row, 2), n, size=16, bold=True, color=SAFFRON, fill=CREAM, horizontal="center")
        paint(ws.cell(row, 3), title, size=12, bold=True, color=NAVY, fill=CREAM)
        ws.merge_cells(start_row=row, start_column=4, end_row=row, end_column=7)
        paint(ws.cell(row, 4), body, size=10, color=INK, fill=CREAM)
        for col in range(4, 8):
            ws.cell(row, col).fill = solid(CREAM)
            ws.cell(row, col).border = THIN
        ws.cell(row, 2).border = THIN
        ws.cell(row, 3).border = THIN
        ws.row_dimensions[row].height = 32

    # Today
    ws.merge_cells("H6:J6")
    paint(ws["H6"], "TODAY", size=12, bold=True, color=WHITE, fill=TEAL, horizontal="left")
    for col in range(8, 11):
        ws.cell(6, col).fill = solid(TEAL)

    labels = [
        (7, "Start Monday", date.today()),
        (8, "Day number", '=IF(I7="","Set the Monday",MIN(MAX(TODAY()-I7+1,1),MAX(\'Daily Plan\'!A:A)))'),
        (9, "Week", '=IF(I8="","",INDEX(\'Daily Plan\'!B:B,MATCH(I8,\'Daily Plan\'!A:A,0)))'),
        (10, "Theme", '=IF(I8="","",INDEX(\'Daily Plan\'!G:G,MATCH(I8,\'Daily Plan\'!A:A,0)))'),
        (11, "60-minute cut", '=IF(I8="","",INDEX(\'Daily Plan\'!O:O,MATCH(I8,\'Daily Plan\'!A:A,0)))'),
        (12, "Pattern", '=IF(I8="","",INDEX(\'Daily Plan\'!H:H,MATCH(I8,\'Daily Plan\'!A:A,0)))'),
    ]
    paint(ws.cell(7, 8), "Start Monday", size=10, bold=True, color=WHITE, fill=GOLD, horizontal="left")
    start_cell = ws.cell(7, 9, date.today())
    start_cell.font = font(12, True, NAVY)
    start_cell.fill = solid("F6E3B8")
    start_cell.alignment = wrap("left", "center")
    start_cell.number_format = "DD MMM YYYY"
    start_cell.border = MED
    ws.merge_cells("I7:J7")
    ws["J7"].fill = solid("F6E3B8")
    ws["J7"].border = MED

    for row, label, formula in labels[1:]:
        paint(ws.cell(row, 8), label, size=10, bold=True, color=TEAL, fill="E3F2F0")
        ws.merge_cells(start_row=row, start_column=9, end_row=row, end_column=10)
        cell = ws.cell(row, 9, formula)
        cell.font = font(10, True, NAVY)
        cell.alignment = wrap("left", "center")
        cell.fill = solid(WHITE)
        cell.border = THIN
        ws.cell(row, 10).border = THIN
        ws.cell(row, 10).fill = solid(WHITE)
        ws.row_dimensions[row].height = 28
    ws.row_dimensions[10].height = 36
    ws.row_dimensions[11].height = 48

    # Scoreboard
    ws.merge_cells("B14:D14")
    paint(ws["B14"], "SCOREBOARD", size=12, bold=True, color=WHITE, fill=NAVY)
    for col in range(2, 5):
        ws.cell(14, col).fill = solid(NAVY)

    stats = [
        (15, "Days in the plan", f"=COUNTA('Daily Plan'!A6:A{5+len(days)})"),
        (16, "Done", f"=COUNTIF('Daily Plan'!S6:S{5+len(days)},\"Done\")"),
        (17, "In progress or light", f"=COUNTIF('Daily Plan'!S6:S{5+len(days)},\"In progress\")+COUNTIF('Daily Plan'!S6:S{5+len(days)},\"Light\")"),
        (18, "Need a redo", f"=COUNTIF('Daily Plan'!S6:S{5+len(days)},\"Redo\")"),
        (19, "Topics marked done", f"=COUNTIF('Topic Library'!P6:P{5+len(TOPICS)},\"Done\")"),
        (20, "Stories drafted", f"=COUNTIF('Story Bank'!J6:J15,\"Done\")+COUNTIF('Story Bank'!J6:J15,\"In progress\")"),
    ]
    for row, label, formula in stats:
        paint(ws.cell(row, 2), label, size=11, bold=True, color=INK, fill=CREAM)
        ws.merge_cells(start_row=row, start_column=3, end_row=row, end_column=4)
        cell = ws.cell(row, 3, formula)
        cell.font = font(16, True, NAVY)
        cell.alignment = wrap("left", "center")
        cell.fill = solid(WHITE)
        cell.border = THIN
        ws.cell(row, 4).border = THIN
        ws.cell(row, 2).border = THIN
        ws.row_dimensions[row].height = 26

    ws.merge_cells("B22:D22")
    paint(ws["B22"], "PROGRESS BAR", size=10, bold=True, color=SLATE, fill=PAPER)
    ws.merge_cells("B23:G23")
    bar = ws["B23"]
    last = 5 + len(days)
    bar.value = f'=REPT("▓",ROUND(IF(B16=0,0,C16/C15)*24,0))&REPT("░",24-ROUND(IF(C15=0,0,C16/C15)*24,0))&"  "&TEXT(IF(C15=0,0,C16/C15),"0%")'
    # Wait I used B16 as label row. Stats: row 15 is days count in C15, row 16 done in C16.
    bar.value = f'=REPT("▓",ROUND(IF(C15=0,0,C16/C15)*24,0))&REPT("░",24-ROUND(IF(C15=0,0,C16/C15)*24,0))&"   "&TEXT(IF(C15=0,0,C16/C15),"0%")'
    bar.font = font(16, True, TEAL)
    bar.alignment = wrap("left", "center")
    ws.row_dimensions[23].height = 28

    # Chart data (hidden-ish to the right of the used range, still on sheet)
    ws["B25"] = "Done"
    ws["C25"] = f"=C16"
    ws["B26"] = "Remaining"
    ws["C26"] = "=MAX(C15-C16-C17-C18,0)"
    ws["B27"] = "Open"
    ws["C27"] = "=C17"
    ws["B28"] = "Redo"
    ws["C28"] = "=C18"
    for row in range(25, 29):
        ws.cell(row, 2).font = font(9, color=SLATE)
        ws.cell(row, 3).font = font(9, color=SLATE)

    chart = DoughnutChart()
    chart.title = "Days"
    labels = Reference(ws, min_col=2, min_row=25, max_row=28)
    data = Reference(ws, min_col=3, min_row=24, max_row=28)
    # Need a header for data reference. Put header.
    ws["C24"] = "Days"
    ws["C24"].font = font(9, color=SLATE)
    chart.add_data(data, titles_from_data=True)
    chart.set_categories(labels)
    chart.style = 10
    chart.holeSize = 62
    chart.width = 12
    chart.height = 6
    series = chart.series[0]
    colors = ["2F6B4F", "E4D9C8", "C56A12", "9C4034"]
    pts = []
    for i, color in enumerate(colors):
        pt = DataPoint(idx=i)
        pt.graphicalProperties.solidFill = color
        pts.append(pt)
    series.data_points = pts
    chart.legend.position = "b"
    ws.add_chart(chart, "E14")

    # Map of sheets
    ws.merge_cells("B31:G31")
    paint(ws["B31"], "WHAT LIVES WHERE", size=12, bold=True, color=WHITE, fill=NAVY)
    for col in range(2, 8):
        ws.cell(31, col).fill = solid(NAVY)
    sheets = [
        ("Paths", "Three ways to weight the same calendar. Read this before you skip an AI day or a coding day."),
        ("Roadmap", "Week-by-week intent, exit criteria, and the resources that belong to that week."),
        ("Daily Plan", "The page you open every day. Filter by week or emphasis. Edit status, confidence, and notes."),
        ("Topic Library", "Every SDE-2 and AI topic, with depth, mistakes, and the week it appears."),
        ("Company Loops", "Google, Meta, Amazon, Microsoft, Apple, Netflix, Uber, Stripe, Airbnb, and AI labs."),
        ("AI Builds", "Four projects. Search, RAG, a tool graph, and a production pass."),
        ("Cheat Sheets", "Coding card, design agenda, RAG checklist, framework judgment, estimation anchors."),
        ("Story Bank", "Ten prompts. You write the STAR. The sheet tells you what signal each one proves."),
        ("Weekly Review", "A Sunday page. Pulls counts from the daily plan."),
        ("Applications", "Companies you actually contacted. A tracker, not a wish list."),
    ]
    for i, (name, blurb) in enumerate(sheets):
        row = 32 + i
        paint(ws.cell(row, 2), name, size=11, bold=True, color=NAVY, fill=CREAM)
        ws.merge_cells(start_row=row, start_column=3, end_row=row, end_column=7)
        paint(ws.cell(row, 3), blurb, size=10, color=INK, fill=WHITE)
        for col in range(3, 8):
            ws.cell(row, col).fill = solid(WHITE)
            ws.cell(row, col).border = THIN
        ws.cell(row, 2).border = THIN
        ws.row_dimensions[row].height = 22

    ws.merge_cells("B43:G43")
    paint(ws["B43"], "RULES THAT KEEP THE PLAN HONEST", size=12, bold=True, color=WHITE, fill=CLAY)
    for col in range(2, 8):
        ws.cell(43, col).fill = solid(CLAY)
    for i, rule in enumerate(RULES):
        row = 44 + i
        ws.merge_cells(start_row=row, start_column=2, end_row=row, end_column=7)
        paint(ws.cell(row, 2), f"{i + 1}.  {rule}", size=10, color=INK, fill=CREAM if i % 2 == 0 else WHITE)
        for col in range(2, 8):
            ws.cell(row, col).fill = solid(CREAM if i % 2 == 0 else WHITE)
            ws.cell(row, col).border = THIN
            ws.cell(row, col).alignment = wrap("left", "center")
        ws.row_dimensions[row].height = 32

    note_row = 44 + len(RULES) + 1
    ws.merge_cells(start_row=note_row, start_column=2, end_row=note_row, end_column=7)
    paint(
        ws.cell(note_row, 2),
        "Levels, loops, and pay bands change. Use the company sheet as a prior and confirm the loop with your recruiter. This desk prepares you. It does not promise an offer.",
        size=10,
        italic=True,
        color=SLATE,
        fill=PAPER,
    )
    ws.row_dimensions[note_row].height = 32
    ws.auto_filter.ref = None
    ws.print_title_rows = "1:4"
    ws.page_setup.orientation = "landscape"
    ws.oddHeader.left.text = "&B Meridian"
    return ws


def build_paths(wb):
    ws = wb.create_sheet("Paths")
    sheet_setup(ws, INDIGO)
    set_widths(ws, {"A": 28, "B": 55, "C": 55, "D": 62, "E": 55})
    ws.merge_cells("A1:E1")
    paint(ws["A1"], "CHOOSE A PATH, THEN KEEP THE SAME CALENDAR", size=20, bold=True, color=WHITE, fill=INDIGO, horizontal="left")
    for col in range(1, 6):
        ws.cell(1, col).fill = solid(INDIGO)
    ws.row_dimensions[1].height = 36
    ws.merge_cells("A2:E2")
    paint(
        ws["A2"],
        "The days do not change. The cut does. General SDE-2 protects coding. AI-product SDE-2 does both blocks. Applied AI engineers still do Weeks 1–8 in full, then spend the extra hours on the builds.",
        size=11,
        color=INK,
        fill="E3E8F2",
    )
    for col in range(1, 6):
        ws.cell(2, col).fill = solid("E3E8F2")
    ws.row_dimensions[2].height = 36
    headers = ["Path", "Who it is for", "Weekly shape", "When the day is short", "The way this path fails"]
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(4, col), label, size=11, bold=True, color=WHITE, fill=NAVY, horizontal="center")
        ws.cell(4, col).border = THIN
    ws.row_dimensions[4].height = 24
    colors = ["F8E4DE", "E3F2F0", "F8F0DC"]
    for i, path in enumerate(PATHS):
        row = 5 + i
        values = [path["name"], path["for"], path["weekly_shape"], path["daily_rule"], path["risk"]]
        for col, value in enumerate(values, start=1):
            cell = ws.cell(row, col, value)
            style_data_cell(cell, colors[i])
            cell.font = font(12 if col == 1 else 11, col == 1, NAVY if col == 1 else INK)
        ws.row_dimensions[row].height = 96
    ws.merge_cells("A9:E9")
    paint(
        ws["A9"],
        "Emphasis column on the Daily Plan: Core means everyone does it. Coding means general SDE-2 should not skip it. AI means an AI-bound candidate should not skip it. If you are general and the row says AI, do the 60-minute cut and add a second problem.",
        size=11,
        color=INK,
        fill=CREAM,
    )
    for col in range(1, 6):
        ws.cell(9, col).fill = solid(CREAM)
        ws.cell(9, col).alignment = wrap()
    ws.row_dimensions[9].height = 48
    ws.freeze_panes = "A5"
    ws.auto_filter.ref = "A4:E7"


def build_roadmap(wb):
    ws = wb.create_sheet("Roadmap")
    sheet_setup(ws, NAVY)
    headers = [
        "Week", "Phase", "Title", "Optional?", "Intent", "Hours", "You can leave the week when…",
        "Coding focus", "Systems focus", "AI focus", "Behavioral", "Daily rhythm", "Resources", "Status",
    ]
    ws.merge_cells("A1:N1")
    paint(ws["A1"], "SIXTEEN WEEKS, PLUS AN ON-RAMP", size=20, bold=True, color=WHITE, fill=NAVY)
    for col in range(1, 15):
        ws.cell(1, col).fill = solid(NAVY)
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:N2")
    paint(
        ws["A2"],
        "Read the exit column before you add extra problems. Leaving a week clean beats collecting one more unsolved hard.",
        size=11,
        color=INK,
        fill="E7EEF5",
    )
    for col in range(1, 15):
        ws.cell(2, col).fill = solid("E7EEF5")
    ws.row_dimensions[2].height = 22
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(4, col), label, size=10, bold=True, color=WHITE, fill=NAVY, horizontal="center")
        ws.cell(4, col).border = THIN
    ws.row_dimensions[4].height = 30
    phase_fill = {
        "On-ramp": "F3EBDF",
        "Coding core": "F8E4DE",
        "Computer science core": "E3E8F2",
        "System design": "E7EEF5",
        "Applied AI": "E3F2F0",
        "Loops": "F8F0DC",
        "Performance": "F8E7D2",
    }
    for i, week in enumerate(WEEKS):
        row = 5 + i
        values = [
            week["week"],
            week["phase"],
            week["title"],
            "Yes — skip if fluent" if week["optional"] else "No",
            week["intent"],
            week["hours"],
            week["exit"],
            week["dsa"],
            week["systems"],
            week["ai"],
            week["behavior"],
            week["rhythm"],
            week["resources"],
            "Not started",
        ]
        bg = phase_fill.get(week["phase"], CREAM)
        for col, value in enumerate(values, start=1):
            cell = ws.cell(row, col, value)
            style_data_cell(cell, bg)
            if col in (1, 2, 14):
                cell.alignment = wrap("center", "center")
                cell.font = font(11, True, NAVY)
        ws.row_dimensions[row].height = 88
    last = 4 + len(WEEKS)
    status_validation(ws, f"N5:N{last}")
    status_rules(ws, f"N5:N{last}")
    ws.auto_filter.ref = f"A4:N{last}"
    ws.freeze_panes = "D5"
    ws.auto_filter.ref = f"A4:N{last}"
    widths = {
        "A": 10, "B": 22, "C": 36, "D": 18, "E": 42, "F": 14, "G": 42,
        "H": 32, "I": 32, "J": 36, "K": 32, "L": 32, "M": 40, "N": 16,
    }
    set_widths(ws, widths)
    ws.auto_filter.ref = f"A4:N{last}"


def build_daily(wb, days):
    ws = wb.create_sheet("Daily Plan")
    sheet_setup(ws, CLAY)
    ws.sheet_view.zoomScale = 110
    headers = [
        "Day", "Week", "Weekday", "Phase", "Emphasis", "Track", "Theme", "Pattern",
        "Coding block", "Problems", "Second block", "Concept", "Drill", "Review",
        "If you only have 60 minutes", "If you have 3 hours", "Minutes", "Priority",
        "Status", "Confidence", "Notes",
    ]
    ws.merge_cells("A1:U1")
    paint(ws["A1"], "DAILY PLAN  ·  ONE ROW IS ONE DECISION", size=20, bold=True, color=WHITE, fill=CLAY)
    for col in range(1, 22):
        ws.cell(1, col).fill = solid(CLAY)
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:U2")
    paint(
        ws["A2"],
        "Set status when you finish. Light means you did the 60-minute cut on purpose. Redo means confidence was 1 or 2 and tomorrow starts here. Filter Emphasis to Core if you are overwhelmed: those rows are the spine.",
        size=11,
        color=WHITE,
        fill=NAVY,
    )
    for col in range(1, 22):
        ws.cell(2, col).fill = solid(NAVY)
        ws.cell(2, col).font = font(11, color=WHITE)
    ws.row_dimensions[2].height = 32
    ws.row_dimensions[3].height = 8
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(5, col), label, size=10, bold=True, color=WHITE, fill=NAVY, horizontal="center")
        ws.cell(5, col).border = THIN
    ws.row_dimensions[5].height = 30

    keys = [
        "day", "week", "weekday", "phase", "emphasis", "track", "theme", "pattern",
        "coding", "problems", "second", "concept", "drill", "review",
        "min60", "hrs3", "minutes", "priority",
    ]
    for i, day in enumerate(days):
        row = 6 + i
        bg = TRACK_FILL.get(day["track"], CREAM)
        if day["weekday"] == "Sunday":
            bg = "F8F0DC"
        for col, key in enumerate(keys, start=1):
            cell = ws.cell(row, col, day[key])
            style_data_cell(cell, bg)
            if col in (1, 2, 17, 18):
                cell.alignment = wrap("center", "center")
                cell.font = font(11, True, NAVY)
            if col == 7:
                cell.font = font(11, True, INK)
        status = ws.cell(row, 19, "Not started")
        style_data_cell(status, WHITE)
        status.alignment = wrap("center", "center")
        status.font = font(10, True, SLATE)
        conf = ws.cell(row, 20, None)
        style_data_cell(conf, WHITE)
        conf.alignment = wrap("center", "center")
        notes = ws.cell(row, 21, "")
        style_data_cell(notes, WHITE)
        ws.row_dimensions[row].height = 78

    last = 5 + len(days)
    status_validation(ws, f"S6:S{last}")
    confidence_validation(ws, f"T6:T{last}")
    status_rules(ws, f"S6:S{last}")
    ws.conditional_formatting.add(
        f"T6:T{last}",
        CellIsRule(operator="lessThanOrEqual", formula=["2"], fill=solid("F8D6D1"), font=font(10, True, CLAY)),
    )
    ws.conditional_formatting.add(
        f"T6:T{last}",
        CellIsRule(operator="greaterThanOrEqual", formula=["4"], fill=solid("D9EFE3"), font=font(10, True, SAGE)),
    )
    ws.auto_filter.ref = f"A5:U{last}"
    ws.freeze_panes = "H6"
    ws.auto_filter.ref = f"A5:U{last}"
    widths = {
        "A": 8, "B": 10, "C": 14, "D": 22, "E": 12, "F": 14, "G": 36, "H": 24,
        "I": 46, "J": 36, "K": 46, "L": 28, "M": 36, "N": 36, "O": 40, "P": 40,
        "Q": 12, "R": 12, "S": 16, "T": 14, "U": 28,
    }
    set_widths(ws, widths)
    ws.auto_filter.ref = f"A5:U{last}"
    ws.page_setup.fitToWidth = 1
    ws.print_title_rows = "1:5"
    ws.page_setup.orientation = "landscape"


def build_topics(wb):
    ws = wb.create_sheet("Topic Library")
    sheet_setup(ws, TEAL)
    headers = [
        "ID", "Track", "Topic", "Subtopic", "Why it matters", "What good looks like", "Depth",
        "Companies", "Hours", "Prerequisites", "How to practice", "Resources", "Common mistakes",
        "Week", "Paths", "Status", "Confidence", "Notes",
    ]
    ws.merge_cells("A1:R1")
    paint(ws["A1"], "TOPIC LIBRARY  ·  SDE-2 AND APPLIED AI", size=20, bold=True, color=WHITE, fill=TEAL)
    for col in range(1, 19):
        ws.cell(1, col).fill = solid(TEAL)
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:R2")
    paint(
        ws["A2"],
        "Depth: Must is the bar for this cycle. Should is the next pass if mocks are clean. Stretch is a name you can define, not a project you start in Week 16. Filter Track to AI when you want only that lane.",
        size=11,
        color=INK,
        fill="E3F2F0",
    )
    for col in range(1, 19):
        ws.cell(2, col).fill = solid("E3F2F0")
    ws.row_dimensions[2].height = 30
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(5, col), label, size=10, bold=True, color=WHITE, fill=NAVY, horizontal="center")
    ws.row_dimensions[5].height = 30
    fields = [
        "id", "track", "topic", "subtopic", "why", "good", "depth", "companies", "hours",
        "prereq", "practice", "resources", "mistakes", "week", "paths",
    ]
    topics = [{**t, "id": i + 1} for i, t in enumerate(TOPICS)]
    for i, item in enumerate(topics):
        row = 6 + i
        bg = TRACK_FILL.get(item["track"], CREAM)
        for col, key in enumerate(fields, start=1):
            cell = ws.cell(row, col, item[key])
            style_data_cell(cell, bg)
            if col in (1, 7, 9, 14):
                cell.alignment = wrap("center", "center")
                cell.font = font(10, True, NAVY)
        if item["depth"] == "Must":
            ws.cell(row, 7).fill = solid("F6D7A8")
        elif item["depth"] == "Stretch":
            ws.cell(row, 7).fill = solid("E7E5E4")
        status = ws.cell(row, 16, "Not started")
        style_data_cell(status, WHITE)
        status.alignment = wrap("center", "center")
        conf = ws.cell(row, 17, None)
        style_data_cell(conf, WHITE)
        conf.alignment = wrap("center", "center")
        notes = ws.cell(row, 18, "")
        style_data_cell(notes, WHITE)
        ws.row_dimensions[row].height = 64
    last = 5 + len(topics)
    status_validation(ws, f"P6:P{last}")
    confidence_validation(ws, f"Q6:Q{last}")
    status_rules(ws, f"P6:P{last}")
    ws.auto_filter.ref = f"A5:R{last}"
    ws.freeze_panes = "E6"
    widths = {
        "A": 6, "B": 16, "C": 28, "D": 36, "E": 40, "F": 40, "G": 12, "H": 28,
        "I": 10, "J": 24, "K": 36, "L": 36, "M": 36, "N": 10, "O": 24, "P": 16, "Q": 14, "R": 24,
    }
    set_widths(ws, widths)


def build_companies(wb):
    ws = wb.create_sheet("Company Loops")
    sheet_setup(ws, GOLD)
    headers = [
        "Company", "Level map", "Loop shape", "Coding", "Design", "Behavioral",
        "AI angle", "What surprises people", "How to bias your prep",
    ]
    ws.merge_cells("A1:I1")
    paint(ws["A1"], "COMPANY LOOPS  ·  A PRIOR, NOT A CONTRACT", size=20, bold=True, color=WHITE, fill=GOLD)
    for col in range(1, 10):
        ws.cell(1, col).fill = solid("6E5224")
        ws.cell(1, col).font = font(20, True, WHITE)
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:I2")
    paint(
        ws["A2"],
        "Ask the recruiter, the week you schedule, what your loop contains. Blogs lag. The patterns below are the stable ones: Amazon stories, Google committee and team match, Meta pace, Stripe practicality, AI teams asking what you measured.",
        size=11,
        color=INK,
        fill="F8F0DC",
    )
    for col in range(1, 10):
        ws.cell(2, col).fill = solid("F8F0DC")
    ws.row_dimensions[2].height = 32
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(4, col), label, size=10, bold=True, color=WHITE, fill=NAVY, horizontal="center")
    fields = ["company", "level", "loop", "coding", "design", "behavior", "ai", "surprise", "delta"]
    for i, company in enumerate(COMPANIES):
        row = 5 + i
        bg = CREAM if i % 2 == 0 else WHITE
        for col, key in enumerate(fields, start=1):
            cell = ws.cell(row, col, company[key])
            style_data_cell(cell, bg)
            if col == 1:
                cell.font = font(14, True, NAVY)
                cell.fill = solid("F8F0DC")
        ws.row_dimensions[row].height = 130
    last = 4 + len(COMPANIES)
    ws.auto_filter.ref = f"A4:I{last}"
    ws.freeze_panes = "B5"
    widths = {"A": 28, "B": 36, "C": 42, "D": 36, "E": 36, "F": 36, "G": 40, "H": 36, "I": 40}
    set_widths(ws, widths)


def build_projects(wb):
    ws = wb.create_sheet("AI Builds")
    sheet_setup(ws, TEAL)
    ws.merge_cells("A1:F1")
    paint(ws["A1"], "FOUR BUILDS  ·  THE AI TRACK IN ARTIFACTS", size=20, bold=True, color=WHITE, fill=TEAL)
    for col in range(1, 7):
        ws.cell(1, col).fill = solid(TEAL)
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:F2")
    paint(
        ws["A2"],
        "Notes without a runnable slice do not count after Week 12. Each build extends the last one. If you have no API key, use a local embedding model or a documented bag-of-words fallback and keep the eval anyway.",
        size=11,
        color=INK,
        fill="E3F2F0",
    )
    for col in range(1, 7):
        ws.cell(2, col).fill = solid("E3F2F0")
    ws.row_dimensions[2].height = 32
    headers = ["Build", "Week", "Outcome", "Done when", "Steps", "Status"]
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(4, col), label, size=10, bold=True, color=WHITE, fill=NAVY, horizontal="center")
    for i, project in enumerate(PROJECTS):
        row = 5 + i
        values = [project["name"], project["week"], project["outcome"], project["done_when"], project["steps"], "Not started"]
        for col, value in enumerate(values, start=1):
            cell = ws.cell(row, col, value)
            style_data_cell(cell, "E3F2F0" if i % 2 == 0 else WHITE)
            if col == 1:
                cell.font = font(13, True, TEAL)
            if col in (2, 6):
                cell.alignment = wrap("center", "center")
        ws.row_dimensions[row].height = 78
    status_validation(ws, "F5:F8")
    status_rules(ws, "F5:F8")
    ws.freeze_panes = "A5"
    set_widths(ws, {"A": 42, "B": 12, "C": 55, "D": 55, "E": 70, "F": 16})


def build_cheats(wb):
    ws = wb.create_sheet("Cheat Sheets")
    sheet_setup(ws, SAGE)
    ws.sheet_view.zoomScale = 120
    set_widths(ws, {"A": 38, "B": 120, "C": 3})
    ws.merge_cells("A1:B1")
    paint(ws["A1"], "CHEAT SHEETS  ·  THE PAGES YOU REHEARSE", size=20, bold=True, color=WHITE, fill=SAGE)
    ws["B1"].fill = solid(SAGE)
    ws.row_dimensions[1].height = 36
    ws.merge_cells("A2:B2")
    paint(
        ws["A2"],
        "Read these out loud. A cheat sheet you have not spoken is a document, not a skill. Print the coding card and the design agenda.",
        size=11,
        color=INK,
        fill="E5F2EA",
    )
    ws["B2"].fill = solid("E5F2EA")
    ws.row_dimensions[2].height = 24
    row = 4
    for i, cheat in enumerate(CHEATS):
        paint(ws.cell(row, 1), cheat["title"], size=14, bold=True, color=WHITE, fill=NAVY if i % 2 == 0 else TEAL, vertical="center")
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=2)
        ws.cell(row, 2).fill = solid(NAVY if i % 2 == 0 else TEAL)
        ws.row_dimensions[row].height = 26
        row += 1
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=2)
        cell = ws.cell(row, 1, cheat["body"])
        cell.font = font(11, color=INK)
        cell.alignment = Alignment(wrap_text=True, vertical="top")
        bg = CREAM if i % 2 == 0 else WHITE
        cell.fill = solid(bg)
        ws.cell(row, 2).fill = solid(bg)
        ws.cell(row, 1).border = THIN
        ws.cell(row, 2).border = THIN
        lines = cheat["body"].count("\n") + 1
        ws.row_dimensions[row].height = min(220, 18 * lines + 12)
        row += 2
    ws.freeze_panes = "A4"
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToWidth = 1


def build_stories(wb):
    ws = wb.create_sheet("Story Bank")
    sheet_setup(ws, GOLD)
    ws.merge_cells("A1:J1")
    paint(ws["A1"], "STORY BANK  ·  TEN TRUE STORIES", size=20, bold=True, color=WHITE, fill="6E5224")
    for col in range(1, 11):
        ws.cell(1, col).fill = solid("6E5224")
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:J2")
    paint(
        ws["A2"],
        "Leave these blank until they are yours. A two-minute telling: short situation, your decision, concrete result, one-sentence lesson. SDE-2 listeners are checking for scope beyond a solo ticket. Do not invent employers, metrics, or incidents.",
        size=11,
        color=INK,
        fill="F8F0DC",
    )
    for col in range(1, 11):
        ws.cell(2, col).fill = solid("F8F0DC")
    ws.row_dimensions[2].height = 34
    headers = ["#", "Prompt", "Signal it should prove", "Themes it can map to", "Situation", "Task", "Action", "Result", "Lesson", "Status"]
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(5, col), label, size=10, bold=True, color=WHITE, fill=NAVY, horizontal="center")
    for i, (num, prompt, signal, themes) in enumerate(STORIES):
        row = 6 + i
        values = [num, prompt, signal, themes, "", "", "", "", "", "Not started"]
        bg = "FBF8F2" if i % 2 == 0 else "F8F0DC"
        for col, value in enumerate(values, start=1):
            cell = ws.cell(row, col, value)
            style_data_cell(cell, bg)
            if col == 1:
                cell.font = font(16, True, GOLD)
                cell.alignment = wrap("center", "center")
            if col in (2, 3):
                cell.font = font(11, True, NAVY)
        ws.row_dimensions[row].height = 72
    status_validation(ws, "J6:J15")
    status_rules(ws, "J6:J15")
    ws.freeze_panes = "E6"
    ws.auto_filter.ref = "A5:J15"
    set_widths(ws, {
        "A": 6, "B": 36, "C": 40, "D": 36, "E": 28, "F": 28, "G": 36, "H": 28, "I": 28, "J": 16,
    })


def build_weekly(wb):
    ws = wb.create_sheet("Weekly Review")
    sheet_setup(ws, INDIGO)
    ws.merge_cells("A1:H1")
    paint(ws["A1"], "SUNDAY REVIEW", size=20, bold=True, color=WHITE, fill=INDIGO)
    for col in range(1, 9):
        ws.cell(1, col).fill = solid(INDIGO)
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:H2")
    paint(
        ws["A2"],
        "Counts come from the Daily Plan. You only type the two reflection columns. If Done + Light is under four, the next week repeats the shaky pattern instead of adding topics.",
        size=11,
        color=INK,
        fill="E3E8F2",
    )
    for col in range(1, 9):
        ws.cell(2, col).fill = solid("E3E8F2")
    ws.row_dimensions[2].height = 30
    headers = ["Week", "Title", "Days marked done", "Light days", "Redos", "Avg confidence", "What actually broke", "What I will repeat before adding anything"]
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(4, col), label, size=10, bold=True, color=WHITE, fill=NAVY, horizontal="center")
    for i, week in enumerate(WEEKS):
        row = 5 + i
        ws.cell(row, 1, week["week"])
        ws.cell(row, 2, week["title"])
        ws.cell(row, 3, f'=COUNTIFS(\'Daily Plan\'!$B:$B,A{row},\'Daily Plan\'!$S:$S,"Done")')
        ws.cell(row, 4, f'=COUNTIFS(\'Daily Plan\'!$B:$B,A{row},\'Daily Plan\'!$S:$S,"Light")')
        ws.cell(row, 5, f'=COUNTIFS(\'Daily Plan\'!$B:$B,A{row},\'Daily Plan\'!$S:$S,"Redo")')
        ws.cell(row, 6, f'=IFERROR(ROUND(AVERAGEIFS(\'Daily Plan\'!$T:$T,\'Daily Plan\'!$B:$B,A{row},\'Daily Plan\'!$T:$T,">0"),1),"")')
        ws.cell(row, 7, "")
        ws.cell(row, 8, "")
        bg = "E3E8F2" if i % 2 == 0 else WHITE
        for col in range(1, 9):
            style_data_cell(ws.cell(row, col), bg)
            if col <= 2:
                ws.cell(row, col).font = font(11, True, NAVY)
            if col in (1, 3, 4, 5, 6):
                ws.cell(row, col).alignment = wrap("center", "center")
        ws.row_dimensions[row].height = 36
    ws.freeze_panes = "C5"
    set_widths(ws, {"A": 10, "B": 48, "C": 18, "D": 14, "E": 12, "F": 18, "G": 42, "H": 48})


def build_apps(wb):
    ws = wb.create_sheet("Applications")
    sheet_setup(ws, SAFFRON)
    ws.merge_cells("A1:L1")
    paint(ws["A1"], "APPLICATION TRACKER", size=20, bold=True, color=WHITE, fill=SAFFRON)
    for col in range(1, 13):
        ws.cell(1, col).fill = solid(SAFFRON)
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:L2")
    paint(
        ws["A2"],
        "A company is real here only after you have a next action. Referrals help and are not required. Record what the recruiter said the loop contains; that note beats this workbook when they differ.",
        size=11,
        color=INK,
        fill="F8E7D2",
    )
    for col in range(1, 13):
        ws.cell(2, col).fill = solid("F8E7D2")
    ws.row_dimensions[2].height = 30
    headers = [
        "Company", "Role", "Level you are targeting", "Source", "Date applied", "Stage",
        "Next action", "Next date", "Loop notes from recruiter", "Story you will lead with", "Referral name", "Status",
    ]
    for col, label in enumerate(headers, start=1):
        paint(ws.cell(4, col), label, size=10, bold=True, color=WHITE, fill=NAVY, horizontal="center")
    stages = DataValidation(
        type="list",
        formula1='"Not started,Researching,Referral asked,Applied,Recruiter screen,Coding screen,Loop scheduled,Loop done,Team match,Offer,Declined,Rejected"',
        allow_blank=True,
    )
    ws.add_data_validation(stages)
    for row in range(5, 25):
        for col in range(1, 13):
            cell = ws.cell(row, col, "")
            style_data_cell(cell, CREAM if row % 2 == 0 else WHITE)
        ws.row_dimensions[row].height = 28
    stages.add("F5:F24")
    status_validation(ws, "L5:L24")
    status_rules(ws, "L5:L24")
    ws.freeze_panes = "C5"
    ws.auto_filter.ref = "A4:L24"
    set_widths(ws, {
        "A": 22, "B": 28, "C": 24, "D": 16, "E": 16, "F": 20,
        "G": 28, "H": 14, "I": 36, "J": 28, "K": 20, "L": 16,
    })


def main():
    days = flatten_days()
    payload = build_payload(days)
    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    XLSX_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    wb = Workbook()
    build_start(wb, days)
    build_paths(wb)
    build_roadmap(wb)
    build_daily(wb, days)
    build_topics(wb)
    build_companies(wb)
    build_projects(wb)
    build_cheats(wb)
    build_stories(wb)
    build_weekly(wb)
    build_apps(wb)
    wb.properties.title = "Meridian — SDE-2 and Applied AI preparation"
    wb.properties.creator = "Meridian desk"
    wb.properties.subject = "Sixteen-week SDE-2 and applied AI roadmap"
    wb.properties.description = "Daily plan, topic library, company loops, AI builds, and story bank."
    # Lead with the desk, not a random sheet order surprise
    wb.active = wb["Start Here"]
    wb.save(XLSX_PATH)
    print(f"days={len(days)} topics={len(TOPICS)} companies={len(COMPANIES)}")
    print(JSON_PATH)
    print(XLSX_PATH)


if __name__ == "__main__":
    main()
