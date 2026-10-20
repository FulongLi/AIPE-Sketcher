#!/usr/bin/env python3
"""Run the AIPE Sketcher command line from the plugin, with nothing to install.

The engine is pure Python standard library and ships in the plugin root
(three directories above this file), together with its symbol sheet.  If the
plugin copy is missing, an installed ``aipe-sketcher`` package is used.

    python3 <skill-dir>/scripts/aipe_sketcher.py --help
"""
import os
import sys

if sys.version_info < (3, 9):
    sys.exit('AIPE Sketcher needs Python 3.9 or newer; this is Python '
             + sys.version.split()[0])

PLUGIN_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__),
                                           os.pardir, os.pardir, os.pardir))
if os.path.isfile(os.path.join(PLUGIN_ROOT, 'aipe_sketch', 'cli.py')):
    sys.path.insert(0, PLUGIN_ROOT)

try:
    from aipe_sketch.cli import main
except ImportError as exc:
    sys.exit('AIPE Sketcher engine not found next to this skill '
             f'({PLUGIN_ROOT}) and not installed ({exc}). Reinstall the '
             'plugin, or run: python3 -m pip install '
             '"git+https://github.com/FulongLi/AIPE-Sketcher"')

if __name__ == '__main__':
    sys.exit(main())
