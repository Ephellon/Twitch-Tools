import os
WORK=os.environ.get('OFFSER_WORK','.offser')
os.makedirs(WORK,exist_ok=True)
import re, json, os
ROOT='ttv-tools'
FILES=['core.js','tools.js','chat.js','player.js','clips.js','settings.js','background.js']
TARGET, MAX, MIN = 550, 800, 40
marker=re.compile(r'^\s*/\*\*\* (.*)')
cut=re.compile(r'^\s{0,4}(Handlers\.|Unhandlers\.|Timers\.|__\w+__\s*:|//|/\*\*|let |const |var |function |async function |class |[A-Za-z_$][\w$]*\s*=)')
chunks=[]
for f in FILES:
    L=open(os.path.join(ROOT,f),encoding='utf8').read().split('\n')
    # sections by marker
    starts=[(i,marker.match(l).group(1).strip()) for i,l in enumerate(L) if marker.match(l)]
    if not starts or starts[0][0]!=0: starts.insert(0,(0,'(file start)'))
    secs=[]
    for k,(s,t) in enumerate(starts):
        e=starts[k+1][0] if k+1<len(starts) else len(L)
        secs.append([s,e,t])
    # merge tiny sections (group banners) into the next
    merged=[]; carry=None
    for s,e,t in secs:
        if carry: s,t=carry[0],carry[2]+' › '+t; carry=None
        if e-s<MIN and (s,e,t)!=tuple(secs[-1]): carry=[s,e,t]; continue
        merged.append([s,e,t])
    if carry: merged.append(carry)
    for s,e,t in merged:
        t=re.sub(r'\s+',' ',t)[:90]
        while e-s>MAX:
            # best cut near s+TARGET: a blank line followed by a statement-ish line
            best=None
            for j in range(s+TARGET-200, min(s+MAX,e-MIN)):
                if L[j-1].strip()=='' and cut.match(L[j]):
                    if best is None or abs(j-(s+TARGET))<abs(best-(s+TARGET)): best=j
            if best is None: best=s+TARGET
            chunks.append(dict(file=f,start=s+1,end=best,title=t)); s=best; t=t.split(' (cont.)')[0]+' (cont.)'
        chunks.append(dict(file=f,start=s+1,end=e,title=t))
json.dump(chunks,open(WORK+'/chunks.json','w'),indent=1)
print(len(chunks), sum(c['end']-c['start']+1 for c in chunks), max(c['end']-c['start']+1 for c in chunks))
for c in chunks[:12]: print(c)
