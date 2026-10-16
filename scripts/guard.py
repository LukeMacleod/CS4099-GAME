#!/usr/bin/env python3
"""Studio guardrails. Fails CLOSED (exit 2 blocks). Role 18 extends and tests; nobody weakens.
pretool: block git push, production deploys, publishing, outbound writes, sweeping `git add`,
  bare `git commit`, and any checkout/switch/push/merge/rebase that names `main` in product-repo
  context.
taskcompleted: refuse to complete a document task unless its interrogation record says ACCEPTED.

Known limitation: this is a command-string heuristic, not a shell parser. It can be fooled by
creative quoting. That is a reason to keep patterns broad and fail closed, not a reason to relax
them -- see CLAUDE.md 7.7.6 (no agent may disable or weaken a guardrail)."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Simple, context-free command patterns. Any match blocks outright.
BLOCK = [
    r"\bgit\s+push\b",
    r"\bfirebase\s+deploy\b",
    r"\bfirebase\s+hosting:channel:deploy\b",
    r"\bnpx\s+firebase\s+deploy\b",
    r"\bwrangler\b",                                   # any wrangler subcommand, not just publish/deploy
    r"\bnpm\s+publish\b",
    r"\bgh\s+(pr|release|repo)\s+create\b",
    r"\bsendmail\b",
    r"\bmail\s+-s\b",
    r"\bopen\s+['\"]?mailto:",
    r"osascript.*\b(Mail|Messages)\b",
    r"curl\b.*-X\s*POST.*(slack|discord|mailgun|sendgrid|twilio)",
]

# git add forms that sweep up other agents' staged work (CLAUDE.md: "Commit named paths;
# a bare commit sweeps other agents' staged work" -- the same logic bans a sweeping `add`).
ADD_SWEEP = re.compile(r"\bgit\s+add\b[^\n|;&]*(?:(?<![.\w/-])-A\b|--all\b|(?<!\S)\.(?:\s|$))")

# Any `git commit` must name paths after a literal `--`. `--amend` alone (no `--`) is still bare.
COMMIT = re.compile(r"\bgit\s+commit\b")
COMMIT_HAS_PATHS = re.compile(r"\bgit\s+commit\b.*\s--(\s|$)")

# checkout/switch/merge/rebase/push naming `main`, scoped to product-repo context.
MAIN_OP = re.compile(r"\b(checkout|switch|merge|rebase)\b[^\n|;&]*\bmain\b|\bpush\b[^\n|;&]*\bmain\b", re.I)

# curl/wget doing a write (POST/PUT/PATCH-shaped) to a host that is not localhost/127.0.0.1.
# GET fetches of public pages are left alone: research needs them.
HTTP_TOOL = re.compile(r"\b(curl|wget)\b", re.I)
HTTP_WRITE_LIKE = re.compile(
    r"(-X|--request)\s*=?\s*['\"]?(POST|PUT|PATCH)\b"
    r"|(?:^|\s)(-d|--data(?:-raw|-binary|-urlencode)?|-F|--form|--post-data|--post-file)\b",
    re.I,
)
HTTP_LOCAL = re.compile(r"://(localhost|127\.0\.0\.1)\b", re.I)

# 7.7.6: the guardrails themselves. No agent may write these by any route; the Director changes
# them by hand and the Board ratifies. Matched against Bash command text and Write/Edit file paths.
PROTECTED = [r"scripts/guard\.py", r"scripts/test_guard\.sh", r"\.claude/settings(\.local)?\.json",
             r"(^|[\s/])CLAUDE\.md", r"\.claude/skills/", r"\.claude/agents/", r"init\.sh",
             r"studio/governance/interrogation-matrix\.json", r"studio/governance/org-chart\.json"]
PROTECTED_RE = re.compile("(" + "|".join(PROTECTED) + ")", re.I)
# shell constructs that write: redirection, in-place sed/perl, tee, mv/cp onto, rm, chmod, truncate, python -c writing
SHELL_WRITE = re.compile(r"(>>?|\btee\b|\bsed\b[^\n|;&]*\s-i|\bperl\b[^\n|;&]*\s-p?i|\bmv\b|\bcp\b|\brm\b|\bchmod\b|\btruncate\b|\bpatch\b|\bgit\s+checkout\b[^\n|;&]*--|\bgit\s+restore\b)", re.I)


def _is_product_repo_context(cmd: str, payload: dict) -> bool:
    """True when the command plausibly runs against the public product repo (CS4099-GAME) or
    one of its worktrees, where `main` is founder-only and deploys on push. Ambiguous input is
    treated as product-repo context (fail closed) unless it is clearly the private studio repo."""
    cwd = str(payload.get("cwd", "") or "")
    hay = f"{cwd} {cmd}".lower()
    if "cs4099-game" in hay or "scotling-worktrees" in hay or "scotling-v2" in hay:
        return True
    if "scotling-studio" in hay:
        return False
    return True  # unknown context: fail closed


def _git_add_sweep(cmd: str) -> bool:
    return bool(ADD_SWEEP.search(cmd))


def _bare_git_commit(cmd: str) -> bool:
    return bool(COMMIT.search(cmd)) and not bool(COMMIT_HAS_PATHS.search(cmd))


def _main_branch_op(cmd: str, payload: dict) -> bool:
    return bool(MAIN_OP.search(cmd)) and _is_product_repo_context(cmd, payload)


def _writes_protected(cmd: str) -> bool:
    """A Bash command that both names a protected guardrail file and contains a writing construct."""
    return bool(PROTECTED_RE.search(cmd)) and bool(SHELL_WRITE.search(cmd))


def _non_local_http_write(cmd: str) -> bool:
    if not HTTP_TOOL.search(cmd):
        return False
    if not HTTP_WRITE_LIKE.search(cmd):
        return False
    return not HTTP_LOCAL.search(cmd)


def pretool():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print("guard: unreadable payload, failing closed")
        sys.exit(2)
    tool = str(payload.get("tool_name") or payload.get("tool") or "")
    ti = payload.get("tool_input") or {}
    cmd = ti.get("command", "")

    # Write/Edit/MultiEdit/NotebookEdit path: block any edit of a protected guardrail file (7.7.6).
    target = str(ti.get("file_path") or ti.get("path") or ti.get("notebook_path") or "")
    if tool and tool.lower() != "bash":
        if target and PROTECTED_RE.search(target):
            print(f"guard: BLOCKED by 7.7.6: '{target}' is a guardrail file. No agent may change it; "
                  f"propose the change in your hand-back for the Director and the Board.")
            sys.exit(2)
        sys.exit(0)

    if _writes_protected(cmd):
        print("guard: BLOCKED by 7.7.6: this command writes to a guardrail file "
              "(guard.py, test_guard.sh, settings.json, CLAUDE.md, skills, agents, init.sh, matrix, org chart). "
              "Propose the change; the Director applies it and the Board ratifies.")
        sys.exit(2)

    for pat in BLOCK:
        if re.search(pat, cmd, re.I):
            print(f"guard: BLOCKED by entrenched article 7.7 (external/irreversible action): {pat}. "
                  f"Prepare it; put it on the Founder Card.")
            sys.exit(2)

    if _git_add_sweep(cmd):
        print("guard: BLOCKED: `git add -A`/`.`/`--all` sweeps other agents' staged work. "
              "Add named paths only.")
        sys.exit(2)

    if _bare_git_commit(cmd):
        print("guard: BLOCKED: bare `git commit` with no `-- <paths>`. "
              "Use `git commit -- <paths>` (or `-m ... -- <paths>`).")
        sys.exit(2)

    if _main_branch_op(cmd, payload):
        print("guard: BLOCKED: this names `main` of the public product repo. "
              "`main` is founder-only and deploys on push (7.7.3). Work on a studio/* branch.")
        sys.exit(2)

    if _non_local_http_write(cmd):
        print("guard: BLOCKED: outbound write (POST/PUT/PATCH-shaped curl/wget) to a non-local "
              "host. Contacting people/services is prepared, never executed (7.7.3).")
        sys.exit(2)

    sys.exit(0)


def _extract_doc_name(payload: dict):
    """Robust doc-name extraction: an explicit `doc:`/`document:` token first, else a filename
    under studio/pods/<pod>/... Returns None when no document task can be identified."""
    blob = json.dumps(payload)
    m = re.search(r'\b(?:doc|document)\s*[:=]\s*"?([a-z0-9][a-z0-9/_-]*)', blob, re.I)
    if m:
        return m.group(1).strip('"').lower().split("/")[-1]
    m = re.search(r"studio/pods/[a-z0-9_-]+/([a-z0-9_-]+?)(?:-v\d+)?\.md", blob, re.I)
    if m:
        return m.group(1).lower()
    return None


def taskcompleted():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print("guard: unreadable payload, failing closed")
        sys.exit(2)
    doc = _extract_doc_name(payload)
    if not doc:
        blob = json.dumps(payload).lower()
        if re.search(r"\b(finish|complete|done|merge|ship|ratif)\w*\b", blob) and re.search(r"\b(feature|document|slice|doc)\b", blob):
            print("guard: completion claimed for an unnamed document/feature. Name it (doc: <id>) so the "
                  "interrogation record can be checked (7.7 art. 7).")
            sys.exit(2)
        sys.exit(0)  # not identifiable as a document-completion task
    idir = ROOT / "studio/governance/interrogations"
    hits = list(idir.glob(f"{doc}-*.md")) + list(idir.glob(f"{doc}.md"))
    RECHECK_OK = re.compile(r"^##\s*Recheck:\s*ACCEPTED\s*$", re.M)
    RECHECK_ESC = re.compile(r"^##\s*Recheck:\s*ESCALATED\s*$", re.M)
    accepted = 0
    for h in hits:
        t = h.read_text()
        if RECHECK_ESC.search(t):
            print(f"guard: cannot complete '{doc}': {h.name} records an ESCALATED recheck; the Board decides.")
            sys.exit(2)
        if RECHECK_OK.search(t):
            accepted += 1
    if accepted == 0:
        print(f"guard: cannot complete '{doc}': no interrogation file has a line reading exactly "
              f"'## Recheck: ACCEPTED' (the template's 'ACCEPTED | ESCALATED' line does not count) (7.7 art. 5, 7).")
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    {"pretool": pretool, "taskcompleted": taskcompleted}.get(
        sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(2)
    )()
