#!/usr/bin/env python3
"""Inventory user-supplied ZIPs without running their code or importing their Git config.

Usage: python scripts/inventory-unified-sources.py ARCHIVE OUTPUT_DIR REVIEW_DIR
Original selected sources are preserved in REVIEW_DIR, never in the distributable package.
The generated maps describe file/section inventory, not complete semantic coverage.
"""
import collections
import csv
import hashlib
import io
import json
import pathlib
import re
import sys
import zipfile


def selected(name):
    name = name.lower()
    if 'muse' in name or '/.git/' in name:
        return False
    return ('/claude-design/' in name
            or any(x in name for x in ['claude-fable-5.1', 'claude-opus-5.5', 'claude-sonnet-5.5',
                                      'fable-5.1', 'gpt-6-astra', 'gpt-6.1-sol'])
            or name.endswith(('chatgpt-personality-instructions.md', 'codex-full.md'))
            or any('/claude-code/skills/' + x + '/' in name for x in
                   ['frontend-design', 'security-review', 'verify', 'simplify', 'code-review', 'feature-dev']))


def inventory(archive, output, review):
    output.mkdir(parents=True, exist_ok=True)
    review.mkdir(parents=True, exist_ok=True)
    entries, sections, seen = [], [], collections.defaultdict(list)

    def visit(data, prefix='', depth=0):
        if depth > 4:
            raise ValueError('Nested archive limit exceeded')
        with zipfile.ZipFile(io.BytesIO(data)) as zipped:
            for entry in zipped.infolist():
                if entry.is_dir():
                    continue
                pure = pathlib.PurePosixPath(entry.filename)
                if pure.is_absolute() or '..' in pure.parts or '\\' in entry.filename:
                    raise ValueError('Unsafe archive path: ' + entry.filename)
                content = zipped.read(entry)
                name = prefix + entry.filename
                digest = hashlib.sha256(content).hexdigest()
                text = None
                try:
                    text = content.decode('utf-8-sig')
                    if '\x00' in text:
                        text = None
                except UnicodeError:
                    pass
                is_archive = zipfile.is_zipfile(io.BytesIO(content))
                metadata = '/.git/' in name
                chosen = selected(name)
                status = ('excluded_muse_preserved' if 'muse' in name.lower() else
                          'git_metadata_not_imported' if metadata else
                          'selected_source_preserved' if chosen else 'inventory_only')
                entries.append({'path': name, 'bytes': len(content), 'sha256': digest,
                                'depth': depth, 'kind': 'archive' if is_archive else 'text' if text is not None else 'binary',
                                'selection': status, 'duplicate_of': seen[digest][0] if seen[digest] else '',
                                'review_status': 'detailed_clause_audit_pending' if chosen else 'not_active'})
                seen[digest].append(name)
                if chosen:
                    target = review.joinpath(*pure.parts) if not prefix else review / 'nested' / digest / pure.name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(content)
                if text is not None and not metadata:
                    for index, line in enumerate(text.splitlines(), 1):
                        if re.match(r'^\s*#{1,6}\s+\S', line) or re.match(r'^\s*<[A-Za-z][\w-]*>\s*$', line):
                            sections.append({'path': name, 'line': index, 'section': line.strip(),
                                             'selection': status, 'review_status': 'detailed_clause_audit_pending' if chosen else 'not_active'})
                if is_archive:
                    visit(content, name + '!/', depth + 1)

    data = archive.read_bytes()
    visit(data)
    for filename, rows, keys in [
        ('source-coverage.csv', entries, ['path', 'bytes', 'sha256', 'depth', 'kind', 'selection', 'duplicate_of', 'review_status']),
        ('source-sections.csv', sections, ['path', 'line', 'section', 'selection', 'review_status']),
    ]:
        with (output / filename).open('w', encoding='utf-8', newline='') as stream:
            writer = csv.DictWriter(stream, fieldnames=keys, lineterminator='\n')
            writer.writeheader()
            writer.writerows(rows)
    manifest = {
        'schema': 1, 'contract': 'mansur-unified-v1', 'archive': archive.name,
        'archive_sha256': hashlib.sha256(data).hexdigest(),
        'outer_files': sum(x['depth'] == 0 for x in entries),
        'nested_files': sum(x['depth'] > 0 for x in entries), 'total_files': len(entries),
        'selected_files': sum(x['selection'] == 'selected_source_preserved' for x in entries),
        'sections': len(sections), 'kinds': dict(collections.Counter(x['kind'] for x in entries)),
        'duplicate_files': sum(bool(x['duplicate_of']) for x in entries),
        'originals_distribution': 'Not committed or installed. Preserved separately for local review.',
        'prepared_windows_outputs': 'Not present in supplied ZIP; new rules are authored adaptations, not recovered copies.',
        'historical_counts': {'selected': 103, 'outer': 654, 'nested': 26, 'sections': 3735,
                              'status': 'User-reported prior run; not substituted for this inventory.'},
        'semantic_coverage': 'detailed_clause_audit_pending; inventory is not proof of every sentence being implemented',
        'source_names_are_runtime_allowlist': False,
        'excluded_active_sources': ['Muse'],
    }
    (output / 'source-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    inventory(*(pathlib.Path(x).resolve() for x in sys.argv[1:]))
