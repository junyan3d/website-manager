#!/usr/bin/env python3
"""Portable UTF-8 ZIP with POSIX modes and relative symlinks, without Finder metadata."""
import os,stat,sys,zipfile,pathlib
source=pathlib.Path(sys.argv[1]);destination=pathlib.Path(sys.argv[2])
with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for folder,dirs,files in os.walk(source,followlinks=False):
  dirs[:]=[n for n in dirs if n not in ['.git','__MACOSX']]
  for name in sorted(dirs+files):
   p=pathlib.Path(folder)/name
   if name in ['.DS_Store','.eslintcache']:continue
   relative=str(pathlib.Path(source.name)/p.relative_to(source))
   if p.is_symlink():
    target=os.readlink(p)
    if os.path.isabs(target):raise SystemExit('Absolute link refused: '+relative)
    info=zipfile.ZipInfo(relative);info.create_system=3;info.external_attr=(stat.S_IFLNK|0o777)<<16
    z.writestr(info,target)
   elif p.is_file():z.write(p,relative)
