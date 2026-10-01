'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const markerStart = '<!-- mansur-mentor:begin -->';
const markerEnd = '<!-- mansur-mentor:end -->';
const loader = `${markerStart}\n## Действующий договор Мансур\nДля работы с Мансур по frontend и обучению сначала прочитай следующий skill.\nТекущий запрос выше истории. Новый пример по умолчанию JSX + MUI; существующий\nили явно выбранный TS/Tailwind/Redux/Zustand/Jotai сохраняется. Отвечай на простом\nразговорном таджикском Душанбе, если Мансур не запросил другой язык.\nНаличие этих ссылок не доказывает runtime загрузку: проверять в новом AI запросе.\n@config/skills/mansur-frontend-mentor/SKILL.md\n${markerEnd}\n`;

function managedBlock(text, block) {
  const start = text.indexOf(markerStart);
  const end = text.indexOf(markerEnd);
  if ((start < 0) !== (end < 0) || (start >= 0 && end < start)) {
    throw new Error('Broken managed marker; preserve file and repair manually.');
  }
  if (start >= 0) {
    return text.slice(0, start) + block.trimEnd() + text.slice(end + markerEnd.length);
  }
  return block + '\n' + text;
}

function patchGemini(text) {
  return managedBlock(text, loader).replaceAll('- React TypeScript style is auto-active', '- Apply the current/requested project stack; do not infer TypeScript from a branch name');
}

function patchRule02(text) {
  const start = text.indexOf('## Stack, files and TypeScript');
  const end = text.indexOf('## Design and browser verification', start);
  if (start < 0 || end < 0) {
    if (text.includes('## Stack: current agreement')) return text;
    throw new Error('Unknown mansur-02 layout; no overwrite. Review the stack section manually.');
  }
  const stack = `## Stack: current agreement\n- Current explicit request first; inspect package.json and existing files.\n- New examples default to React + JSX + Vite + MUI + React Router + Axios; install only needed dependencies.\n- Keep existing/requested TypeScript, Tailwind, Redux Toolkit, Zustand or Jotai. Do not migrate working projects or mix managers without a task.\n- JSX projects use .jsx for components and .js for non-JSX logic. TS projects use .tsx/.ts and real, simple types; no any/@ts-ignore/unsafe assertions to hide errors.\n- MUI + sx is the new-example default. Tailwind className remains for existing or explicitly selected Tailwind projects.\n- No unsolicited Next.js, React Query, Framer Motion, class components, custom hooks, useReducer/useRef/useMemo/useCallback/memo, forwardRef/useImperativeHandle/useLayoutEffect. Preserve existing working usage.\n- Simple named handlers, immutable updates, real API fields/id types, no unnecessary abstraction or dependency.\n- Convert projects or remove dependencies only when explicitly requested and after checking usages.\n\n`;
  return (text.slice(0, start) + stack + text.slice(end))
    .replace('project, assets, Tailwind and style.', 'project, assets and its actual styling system.')
    .replace('Implement native TSX + Tailwind, connect', 'Use the existing or explicitly requested stack, connect')
    .replace('Use a short 3–5 sentence "ЗАПИШИ В ТЕТРАДЬ" note only for a new topic.', 'Use a short 3–5 sentence "📓 ДАР ДАФТАР НАВИС" note only for a new topic or explicit notebook request.');
}

function patchRule01(text) {
  return text
    .replace('When the user writes primarily in Russian, reply in simple, clear, concise Russian without bureaucratic language.', 'Reply in conversational Dushanbe Tajik by default; use Russian when explicitly requested.')
    .replace('When the user writes in English, reply in English.', 'Use English replies only when explicitly requested; preserve English technical names.')
    .replace('if 90% is clear from context', 'if the missing facts do not materially change the result');
}

function patchPractice(text) {
  const start = text.indexOf('## Code style in practice context');
  const end = text.indexOf('## Practice Git commands', start);
  if (start < 0 || end < 0) throw new Error('Unknown practice skill layout; no overwrite.');
  const style = `## Code style in practice context\n\n- Apply mansur-frontend-mentor and the current explicit request before older practice defaults.\n- New examples default to React + JSX + MUI. Preserve existing/requested .tsx/.ts + Tailwind and other working project choices.\n- Branch name signals learning only; it does not select a programming language or styling library.\n- Keep simple readable handlers and the chosen state manager. No unsolicited service layers, custom hooks or performance patterns.\n- In TS projects keep meaningful real types; do not hide errors with any/@ts-ignore.\n\n`;
  return (text.slice(0, start) + style + text.slice(end))
    .replaceAll('beginner React TypeScript coding exercises', 'beginner React coding exercises in the existing or requested stack')
    .replaceAll('All other AI rules (React, TypeScript, teaching mode) are auto-active inside practice branches.', 'Apply relevant React and teaching rules when practice context is detected; metadata alone does not prove runtime loading.')
    .replaceAll('Everything else is auto-active once inside any practice-context branch.', 'Apply teaching rules in practice context; verify actual loader consumption separately.')
    .replaceAll('These are the ONLY things requiring manual commands.', 'These commands cover Git actions; installation/authentication can still require manual setup.');
}

function walk(dir, relative = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) throw new Error('Symbolic links are not supported: ' + entry.name);
    const name = path.join(relative, entry.name);
    return entry.isDirectory() ? walk(path.join(dir, entry.name), name) : [name];
  });
}

function guardPath(target, base) {
  const relative = path.relative(base, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Target must stay inside selected home.');
  let current = base;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Refusing linked target: ' + current);
  }
}

function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + '.' + crypto.randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temp, content);
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function planInstall(options = {}) {
  const home = path.resolve(options.home || os.homedir());
  const source = path.join(options.sourceRoot || path.resolve(__dirname, '..'), 'skills', 'mansur-frontend-mentor');
  const plans = [];
  const roots = [path.join(home, '.gemini', 'config', 'skills', 'mansur-frontend-mentor')];
  if (options.shared) roots.push(path.join(home, '.agents', 'skills', 'mansur-frontend-mentor'));
  for (const root of roots) {
    for (const relative of walk(source)) {
      plans.push({ target: path.join(root, relative), content: fs.readFileSync(path.join(source, relative)) });
    }
  }
  const configFiles = [
    ['.gemini/GEMINI.md', patchGemini, true],
    ['.gemini/config/rules/mansur-01.md', patchRule01, false],
    ['.gemini/config/rules/mansur-02.md', patchRule02, false],
    ['.gemini/config/skills/mansur-practice/SKILL.md', patchPractice, false],
  ];
  for (const [relative, patch, create] of configFiles) {
    const target = path.join(home, relative);
    if (!create && !fs.existsSync(target)) continue;
    const original = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    plans.push({ target, content: Buffer.from(patch(original)) });
  }
  for (const plan of plans) guardPath(plan.target, home);
  return plans.filter((plan) => !fs.existsSync(plan.target) || !fs.readFileSync(plan.target).equals(plan.content));
}

function install(options = {}) {
  const home = path.resolve(options.home || os.homedir());
  const plans = planInstall(options);
  if (options.dryRun || plans.length === 0) return { changed: plans.map((plan) => plan.target), dryRun: !!options.dryRun, backup: null };
  const backup = path.join(home, '.gemini', 'backups', 'mansur-mentor-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 8));
  guardPath(backup, home);
  fs.mkdirSync(backup, { recursive: true });
  const records = plans.map((plan, index) => {
    const existed = fs.existsSync(plan.target);
    const file = `${index}.bak`;
    if (existed) fs.copyFileSync(plan.target, path.join(backup, file));
    return { target: plan.target, existed, file, installedHash: crypto.createHash('sha256').update(plan.content).digest('hex') };
  });
  fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify({ home, records }, null, 2));
  let written = 0;
  try {
    for (const plan of plans) {
      atomicWrite(plan.target, plan.content);
      written++;
    }
  } catch (error) {
    for (let index = written - 1; index >= 0; index--) {
      const record = records[index];
      if (record.existed) atomicWrite(record.target, fs.readFileSync(path.join(backup, record.file)));
      else fs.unlinkSync(record.target);
    }
    throw error;
  }
  return { changed: plans.map((plan) => plan.target), backup, dryRun: false };
}

function restore(backup) {
  const directory = path.resolve(backup);
  const data = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  for (const record of data.records) {
    guardPath(record.target, data.home);
    if (record.file !== path.basename(record.file)) throw new Error('Invalid backup filename.');
    if (!fs.existsSync(record.target)) throw new Error('Restore conflict: target missing.');
    const hash = crypto.createHash('sha256').update(fs.readFileSync(record.target)).digest('hex');
    if (hash !== record.installedHash) throw new Error('Restore conflict: file edited since installation; no overwrite.');
    if (record.existed && !fs.existsSync(path.join(directory, record.file))) throw new Error('Backup file missing.');
  }
  for (const record of data.records) {
    if (record.existed) atomicWrite(record.target, fs.readFileSync(path.join(directory, record.file)));
    else fs.unlinkSync(record.target);
  }
  return { restored: data.records.length };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const options = {};
    let backup;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === '--dry-run') options.dryRun = true;
      else if (arg === '--shared') options.shared = true;
      else if (arg === '--home' || arg === '--restore') {
        const value = args[++index];
        if (!value || value.startsWith('--')) throw new Error('Missing value: ' + arg);
        if (arg === '--home') options.home = value;
        else backup = value;
      } else throw new Error('Unknown argument: ' + arg);
    }
    if (backup && args.length !== 2) throw new Error('--restore cannot be combined with other options.');
    console.log(JSON.stringify(backup ? restore(backup) : install(options), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { install, planInstall, restore, patchGemini, patchPractice, patchRule01, patchRule02, managedBlock };
