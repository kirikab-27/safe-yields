// Phase 1 動作確認スクリプト
// 使用方法: node test-phase1.js

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

async function testPhase1() {
  console.log(`${colors.blue}=== Phase 1 動作確認テスト ===${colors.reset}\n`);

  // Test 1: Lido API直接テスト
  console.log(`${colors.yellow}[Test 1] Lido公式API直接アクセス${colors.reset}`);
  try {
    const lidoRes = await fetch('https://stake.lido.fi/api/steth-apr');
    const lidoData = await lidoRes.json();
    if (lidoData?.data?.apr) {
      console.log(`${colors.green}✓ Lido API: ${lidoData.data.apr.toFixed(2)}% APR${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Lido API失敗${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Lido APIエラー: ${error.message}${colors.reset}`);
  }

  // Test 2: /api/yields エンドポイント
  console.log(`\n${colors.yellow}[Test 2] /api/yields エンドポイント${colors.reset}`);
  console.log('http://localhost:3000/api/yields を確認してください');
  console.log('期待される結果:');
  console.log('- lido: 実際のAPY値（3.x%）');
  console.log('- compound-v3: null（2.8%ではない）');

  // Test 3: /api/protocols/batch エンドポイント
  console.log(`\n${colors.yellow}[Test 3] /api/protocols/batch エンドポイント${colors.reset}`);
  console.log('http://localhost:3000/api/protocols/batch を確認してください');
  console.log('期待される結果:');
  console.log('- Compound V3のAPYがnull');
  console.log('- sourceが"protocol"または"defillama"');

  // Test 4: ホームページ表示確認
  console.log(`\n${colors.yellow}[Test 4] ホームページ表示確認${colors.reset}`);
  console.log('http://localhost:3000 を開いてください');
  console.log('確認項目:');
  console.log('□ Compound V3カードのAPY表示が「--」または「0.0%」');
  console.log('□ 2.8%が表示されていない');
  console.log('□ LidoのAPYが実際の値（約3.x%）');
  console.log('□ コンソールにエラーログが出力されている');

  // Test 5: キャッシュ動作
  console.log(`\n${colors.yellow}[Test 5] キャッシュ動作確認${colors.reset}`);
  console.log('ページを2回リロードしてください');
  console.log('期待される結果:');
  console.log('- 2回目のロードが速い');
  console.log('- コンソールに"Using cached data"が表示');

  console.log(`\n${colors.blue}=== テスト項目チェックリスト ===${colors.reset}`);
  console.log('□ Compound V3で2.8%が表示されなくなった');
  console.log('□ データ取得失敗時にnullが返される');
  console.log('□ LidoのAPIデータが表示される');
  console.log('□ コンソールにエラーログが出力される');
  console.log('□ 既存機能に影響がない');

  console.log(`\n${colors.green}Phase 1の実装が完了しました！${colors.reset}`);
  console.log('上記のチェックリストを確認して、すべて✓の場合はPhase 2に進めます。');
}

// Run test
testPhase1().catch(console.error);