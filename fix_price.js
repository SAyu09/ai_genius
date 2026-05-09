const fs = require('fs');

const files = [
  'src/app/(frontend)/(dashboard)/admin/page.tsx',
  'src/app/(frontend)/(dashboard)/billing/page.tsx',
  'src/app/(frontend)/(dashboard)/dashboard/page.tsx',
  'src/app/(frontend)/(dashboard)/dashboard/seller/page.tsx',
  'src/app/(frontend)/marketplace/[agentId]/page.tsx',
  'src/app/(frontend)/marketplace/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/agent\.price \/ 100/g, '(agent.monthlyPricePaise || 0) / 100');
  content = content.replace(/agents\.price/g, 'agents.monthlyPricePaise');
  fs.writeFileSync(file, content, 'utf8');
}
