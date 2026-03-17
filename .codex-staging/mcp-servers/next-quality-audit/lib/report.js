function sectionList(items) {
  if (!items || items.length === 0) {
    return ['- none'];
  }

  return items.map((item) => '- ' + item);
}

function buildSummary(report) {
  const summary = [];
  const styling = [
    report.project.styling.tailwind ? 'Tailwind' : null,
    report.project.styling.sass ? 'Sass' : null,
    report.project.styling.cssModules ? 'CSS Modules' : null,
    report.project.styling.styledComponents ? 'styled-components' : null,
    report.project.styling.globalCss ? 'Global CSS' : null
  ].filter(Boolean).join(', ');

  summary.push('Project: ' + report.project.projectPath);
  summary.push('Package manager: ' + report.project.packageManager);
  summary.push('Router: ' + report.project.router.mode);
  summary.push('Styling: ' + (styling || 'No styling clues detected'));
  summary.push('Safe first actions: ' + report.safeFirstActions.length);
  summary.push('Needs review: ' + report.actionsRequiringHumanReview.length);
  return summary;
}

function toMarkdown(report) {
  const lines = [];
  lines.push('# Next Quality Audit Report');
  lines.push('');
  lines.push('## Summary');
  lines.push(...buildSummary(report).map((line) => '- ' + line));
  lines.push('');
  lines.push('## Unused Dependencies');
  lines.push(...sectionList(report.findings.unusedDependencies.map((item) => item.name + ' (' + item.reason + ')')));
  lines.push('');
  lines.push('## Unused Files');
  lines.push(...sectionList(report.findings.unusedFiles.map((item) => item.file)));
  lines.push('');
  lines.push('## Unused Exports');
  lines.push(...sectionList(report.findings.unusedExports.map((item) => item.file + ' :: ' + item.exportName)));
  lines.push('');
  lines.push('## Risky CSS Cleanup Candidates');
  lines.push(...sectionList(report.findings.riskyCssCleanupCandidates.map((item) => item.file + ' (' + item.reason + ')')));
  lines.push('');
  lines.push('## Large JS Bundles');
  lines.push(...sectionList(report.findings.largeJsBundles.map((item) => item.file + ' (' + item.bytes + ' B)')));
  lines.push('');
  lines.push('## Recommended Package Upgrades');
  lines.push(...sectionList(report.findings.recommendedPackageUpgrades.map((item) => item.name + ': ' + item.current + ' -> ' + item.target + ' [' + item.risk + ']')));
  lines.push('');
  lines.push('## Safe First Actions');
  lines.push(...sectionList(report.safeFirstActions));
  lines.push('');
  lines.push('## Medium-Risk Actions');
  lines.push(...sectionList(report.mediumRiskActions));
  lines.push('');
  lines.push('## Actions Requiring Human Review');
  lines.push(...sectionList(report.actionsRequiringHumanReview));
  lines.push('');
  lines.push('## Commands Used');
  lines.push(...sectionList(report.commandsUsed));
  lines.push('');
  lines.push('## Files Touched');
  lines.push(...sectionList(report.filesTouched));
  lines.push('');
  lines.push('## Rollback Guidance');
  lines.push(...sectionList(report.rollbackGuidance));
  return lines.join('\n');
}

module.exports = {
  buildSummary,
  toMarkdown
};
