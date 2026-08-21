import re
from pathlib import Path

script = Path(r'd:\f1soft\dev\react\haccp-cloud\backend\DATABASE\migrate_postgresql_alter_electronic_approval_main_add_work_link.sql').read_text(encoding='utf-8')

statements=[]
current=[]
inLiteral=False
inLineComment=False
inBlockComment=False
inDollarQuotedString=False
dollarTag=None

for index, ch in enumerate(script):
    next_ch = script[index+1] if index + 1 < len(script) else '\0'
    if inLineComment:
        if ch == '\n':
            inLineComment = False
            current.append(ch)
        continue
    if inBlockComment:
        if ch == '*' and next_ch == '/':
            inBlockComment = False
        continue
    if inDollarQuotedString:
        if ch == '$' and dollarTag is not None and script.startswith(dollarTag, index):
            current.append(dollarTag)
            dollarTag = None
            inDollarQuotedString = False
            continue
        current.append(ch)
        continue
    if not inLiteral and ch == '$':
        match = re.search(r'\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$', script[index:])
        if match and match.start() == 0:
            candidate = match.group(0)
            dollarTag = candidate
            inDollarQuotedString = True
            current.append(candidate)
            continue
    if not inLiteral and ch == '-' and next_ch == '-':
        inLineComment = True
        continue
    if not inLiteral and ch == '/' and next_ch == '*':
        inBlockComment = True
        continue
    if ch == "'":
        inLiteral = not inLiteral
        current.append(ch)
        continue
    if not inLiteral and ch == ';':
        stmt = ''.join(current).strip()
        if stmt and stmt.upper() not in {'BEGIN','COMMIT','ROLLBACK','END','START TRANSACTION'}:
            statements.append(stmt)
        current = []
        continue
    current.append(ch)

stmt = ''.join(current).strip()
if stmt and stmt.upper() not in {'BEGIN','COMMIT','ROLLBACK','END','START TRANSACTION'}:
    statements.append(stmt)

print('count=', len(statements))
for i, stmt in enumerate(statements):
    print('---', i, '---')
    print(stmt[:180])
