// Script to update all protocol card components to accept live APY
const fs = require('fs');
const path = require('path');

const cards = [
  { file: 'RocketPoolCard.tsx', protocolId: 'rocket-pool' },
  { file: 'AaveCard.tsx', protocolId: 'aave-v3' },
  { file: 'CompoundCard.tsx', protocolId: 'compound-v3' },
  { file: 'CurveCard.tsx', protocolId: 'curve' }
];

cards.forEach(({ file, protocolId }) => {
  const filePath = path.join(__dirname, '..', 'components', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add interface if not exists
  if (!content.includes('interface') || !content.includes('Props')) {
    // Add interface after imports
    content = content.replace(
      /import { useProtocolData } from '@\/hooks\/useProtocolData';\n/,
      `import { useProtocolData } from '@/hooks/useProtocolData';\n\ninterface ${file.replace('.tsx', '')}Props {\n  liveApy?: number;\n}\n`
    );

    // Update function signature
    const componentName = file.replace('.tsx', '');
    content = content.replace(
      new RegExp(`export default function ${componentName}\\(\\) {`),
      `export default function ${componentName}({ liveApy }: ${componentName}Props) {`
    );
  }

  // Update APY calculation to use live data
  content = content.replace(
    /const apy = data \? data\.apy\.toFixed\(1\) : staticData\.apy;/,
    `const apy = liveApy !== undefined ? liveApy.toFixed(1) : data ? data.apy.toFixed(1) : staticData.apy;`
  );

  // Add live indicator to APY display
  content = content.replace(
    /<div className="text-xs text-gray-500 uppercase tracking-wider">APY<\/div>/g,
    `<div className="text-xs text-gray-500 uppercase tracking-wider">\n              APY {liveApy !== undefined && <span className="text-green-400">(Live)</span>}\n            </div>`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated ${file}`);
});

console.log('All cards updated!');