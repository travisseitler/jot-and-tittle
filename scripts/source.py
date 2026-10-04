from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parent.parent
with ZipFile(root/'dist/jot-and-tittle-source.zip','w',ZIP_DEFLATED) as z:
    files=[root/p for p in ['package.json','package-lock.json','tsconfig.json','index.html','README.md','LICENSE','CONTRIBUTING.md','.gitignore']]
    files+=list((root/'src').rglob('*'))+list((root/'scripts').rglob('*'))
    for p in files:
        if p.is_file(): z.write(p,'jot-and-tittle/'+str(p.relative_to(root)))
