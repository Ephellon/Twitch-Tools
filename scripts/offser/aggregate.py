import os
WORK=os.environ.get('OFFSER_WORK','.offser')
os.makedirs(WORK,exist_ok=True)
import json, re, os, collections
DOCS='docs'
chunks=json.load(open(f'{WORK}/chunks.json')); settings=json.load(open(f'{WORK}/settings.json'))
os.makedirs(f'{DOCS}/sections',exist_ok=True); os.makedirs(f'{DOCS}/triage',exist_ok=True)
def digest(c):
    p=f"{WORK}/out2/{c['slug']}.md"
    return open(p).read().strip() if os.path.exists(p) else None
def split(md):
    parts=re.split(r'(?m)^###\s+',md); d={}
    for x in parts[1:]:
        h,_,b=x.partition('\n'); d[h.strip().lower()]=b.strip()
    return d
anchor=lambda c: f"{c['file'].replace('.js','')}-{c['start']}"
# settings key -> chunks
key2chunks=collections.defaultdict(list)
ids={i['id'] for s in settings for i in s['inputs']}
src={}
for c in chunks:
    L=src.setdefault(c['file'],open('src/'+c['file'],encoding='utf8').read().split('\n'))
    text='\n'.join(L[c['start']-1:c['end']])
    keys=set(c['facts']['Settings keys'])|{k for k in ids if '_' in k and re.search(r'\b'+re.escape(k)+r'\b',text)}
    if c['file']=='settings.js': continue
    for k in sorted(keys): key2chunks[k].append(c)
missing=[]; bugs=[]
byfile=collections.defaultdict(list)
for c in chunks: byfile[c['file']].append(c)
for f,cs in byfile.items():
    out=[f"# `{f}` — section digests\n","> Generated in Phase 1 from Offser (`gemma4:31b-cloud`) digests plus facts extracted by script. Digests are summaries, not specs — verify against the code before relying on a detail.\n"]
    for c in cs:
        out.append(f"\n<a id=\"{anchor(c)}\"></a>\n\n## {c['title']} — L{c['start']}–{c['end']}\n")
        fx=c['facts']; rows=[f"- **{k}:** " + ', '.join(f'`{v}`' for v in vals) for k,vals in fx.items() if vals]
        if rows: out.append('\n'.join(rows)+'\n')
        md=digest(c)
        if md is None: missing.append(c['slug']); out.append('\n_Digest pending._\n'); continue
        d=split(md)
        for h in ['purpose','runs when','defines','depends on','twitch coupling','storage & messaging']:
            v=d.get(h,'').strip()
            if v and v not in('—','-'): out.append(f"\n**{h.capitalize()}**\n\n{v}\n")
        b=d.get('suspected bugs','').strip()
        if b and b not in('—','-'): bugs.append((c,b))
    open(f"{DOCS}/sections/{f.replace('.js','')}.md",'w').write(''.join(out))
# FEATURES.md index
F=["# Feature catalog\n","\nOne row per option on the Settings page, mapped to the code that reads it. Generated in Phase 1 (see `REVAMP.md`); section links go to the per-file digests in `docs/sections/`.\n"]
group=None
for s in settings:
    if s['group'] in ('About TTV Tools',): continue
    if s['group']!=group:
        group=s['group']; F.append(f"\n## {group}\n\n| Feature | Settings | Code |\n|---|---|---|\n")
    ids=[i['id'] for i in s['inputs'] if not i['id'].endswith('-input')]
    locs=[]
    for k in ids:
        for c in key2chunks.get(k,[]):
            l=f"[{c['file']} L{c['start']}](sections/{c['file'].replace('.js','')}.md#{anchor(c)})"
            if l not in locs: locs.append(l)
    title=re.sub(r'\s+',' ',s['title']).strip() or '(untitled)'
    new=f" <sub>since {s['new']}</sub>" if s['new'] else ''
    keys=', '.join(f'`{k}`' for k in ids[:6])+(' …' if len(ids)>6 else '')
    F.append(f"| {title}{new} | {keys} | {'<br>'.join(locs[:5]) or '—'} |\n")
html_ids={i['id'] for s in settings for i in s['inputs']}
orphans=sorted(k for k in key2chunks if k not in html_ids and not k in('get','set','json','assignValue','extractValue','onInstalledReason'))
F.append("\n## Settings read in code with no control on the Settings page\n\n"+(', '.join(f'`{k}`' for k in orphans) or '—')+"\n")
open(f'{DOCS}/FEATURES.md','w').write(''.join(F))
# bug candidates
B=["# Offser bug candidates (unverified)\n","\nRaw \"suspected bugs\" from the Phase 1 digests. **None of these are verified.** Phase 2 checks each against the code; false positives get struck, real ones become fixes.\n"]
for c,b in bugs:
    B.append(f"\n## `{c['file']}` › {c['title']} (L{c['start']}–{c['end']})\n\n{b}\n")
open(f'{DOCS}/triage/offser-bug-candidates.md','w').write(''.join(B))
print('missing',len(missing),'bug sections',len(bugs),'orphans',orphans)
