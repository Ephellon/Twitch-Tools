import os
WORK=os.environ.get('OFFSER_WORK','.offser')
os.makedirs(WORK,exist_ok=True)
import json, os, sys, time, urllib.request
B='https://agent.ephellon.duckdns.org'; TOK=os.environ['OFFSER_TOKEN']
OUT=WORK+'/out2'; os.makedirs(OUT,exist_ok=True)
PREFIX=sys.argv[1] if len(sys.argv)>1 else 'ttv-p1b-'
TOTAL=int(sys.argv[2]) if len(sys.argv)>2 else 110
deadline=time.time()+float(sys.argv[3] if len(sys.argv)>3 else 14000)
get=lambda path: json.load(urllib.request.urlopen(urllib.request.Request(B+path,headers={'Authorization':'Bearer '+TOK}),timeout=60))
while time.time()<deadline:
    try:
        done=[x['id'].split('.')[0] for x in get('/jobs?scope=done')['jobs'] if x['id'].startswith(PREFIX)]
        for s in done:
            if not os.path.exists(f'{OUT}/{s}.md'):
                d=get(f'/jobs/{s}?read=true')
                if d.get('ready'): open(f'{OUT}/{s}.md','w').write(d.get('content',''))
    except Exception as e: print(e,file=sys.stderr)
    n=len([f for f in os.listdir(OUT) if f.startswith(PREFIX)])
    if n>=TOTAL: print('done',n); break
    time.sleep(30)
else: print('timeout',n)
