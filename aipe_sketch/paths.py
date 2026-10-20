"""Canonical file locations.

The master sheet is the one authoritative graphical source.  Everything under
``assets/generated_symbols`` is derived from it and may be regenerated at any
time; nothing there is edited by hand as the primary workflow.

The master is found, in order, at ``$AIPE_SKETCHER_SYMBOLS`` (an explicit
override), in the source checkout's ``assets/master``, and in the copy that an
installed wheel carries as package data.  Rendering therefore works from any
working directory, inside or outside the repository.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER_DIR = os.path.join(ROOT, 'assets', 'master')
MASTER_NAME = 'Inkscape_Symbols_All.svg'
# Where an installed wheel keeps its copy of the master (see pyproject.toml).
PACKAGED_MASTER = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               '_data', MASTER_NAME)


def master_path():
    """Locate the master symbol sheet; raise with every location tried."""
    override = os.environ.get('AIPE_SKETCHER_SYMBOLS')
    if override:
        if os.path.isfile(override):
            return override
        raise FileNotFoundError(
            f'AIPE_SKETCHER_SYMBOLS points to a missing file: {override}')
    candidates = [os.path.join(MASTER_DIR, MASTER_NAME), PACKAGED_MASTER]
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    raise FileNotFoundError(
        'master symbol sheet not found; looked in: ' + ', '.join(candidates))


def _default_master():
    try:
        return master_path()
    except FileNotFoundError:
        # Keep importing cheap and side-effect free; the error is raised
        # again, with the locations tried, when a schematic is built.
        return os.path.join(MASTER_DIR, MASTER_NAME)


MASTER = _default_master()
# Previews of the kinds the renderer actually supports, one file per kind.
GENERATED = os.path.join(ROOT, 'assets', 'generated_symbols')
# The full sheet extraction, organised by the sheet's own sections.
EXTRACTED = os.path.join(ROOT, 'assets', 'extracted_library')
REGISTRY_JSON = os.path.join(ROOT, 'assets', 'symbol_registry.json')
OUT = os.path.join(ROOT, 'out')
