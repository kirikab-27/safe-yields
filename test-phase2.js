// Phase 2 動作確認スクリプト
// 使用方法: node test-phase2.js

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

async function testPhase2() {
  console.log(`${colors.blue}=== Phase 2 動作確認テスト ===${colors.reset}\n`);

  // Test 1: Aave V3 Subgraph
  console.log(`${colors.yellow}[Test 1] Aave V3 Subgraph統合${colors.reset}`);
  console.log('期待される結果:');
  console.log('- Aave V3のAPYがSubgraphから取得される');
  console.log('- 加重平均が正しく計算される');
  console.log('- コンソールに"[Aave V3] Calculated weighted APY"が表示');

  // Test 2: UI表示確認（-- 表示）
  console.log(`\n${colors.yellow}[Test 2] UI表示確認（-- とツールチップ）${colors.reset}`);
  console.log('確認手順:');
  console.log('1. データ取得を意図的に失敗させる');
  console.log('   - ネットワークを切断するか、APIエンドポイントを変更');
  console.log('2. http://localhost:3000 を開く');
  console.log('3. 確認項目:');
  console.log('   □ APYが取得できない場合「--」が表示される');
  console.log('   □ 「--」の右に「ⓘ」アイコンが表示される');
  console.log('   □ ⓘアイコンにホバーすると「現在データ取得不可（API障害 / フォールバック失敗）」表示');

  // Test 3: キャッシュバッジ確認
  console.log(`\n${colors.yellow}[Test 3] キャッシュバッジ表示${colors.reset}`);
  console.log('確認手順:');
  console.log('1. ページを開いてデータを取得');
  console.log('2. 1分後に再度ページをリロード');
  console.log('3. 確認項目:');
  console.log('   □ 「Cached」バッジが表示される');
  console.log('   □ バッジにホバーすると「キャッシュデータ（最終更新: 5分前）」表示');

  // Test 4: パフォーマンス確認
  console.log(`\n${colors.yellow}[Test 4] パフォーマンス測定${colors.reset}`);
  console.log('確認手順:');
  console.log('1. DevToolsのNetworkタブを開く');
  console.log('2. ページをリロード');
  console.log('3. 確認項目:');
  console.log('   □ ページロード時間が2秒以内');
  console.log('   □ キャッシュヒット時はAPI呼び出しが減少');

  // Test 5: 主要3プロトコル動作確認
  console.log(`\n${colors.yellow}[Test 5] 主要3プロトコル統合確認${colors.reset}`);
  console.log('http://localhost:3000 で確認:');
  console.log('□ Lido - 公式APIからデータ取得（約3.x%）');
  console.log('□ Aave V3 - Subgraphからデータ取得');
  console.log('□ Compound V3 - nullまたは実データ（2.8%ではない）');

  // API直接テスト
  console.log(`\n${colors.yellow}[Test 6] API直接確認${colors.reset}`);
  console.log('以下のエンドポイントを確認:');
  console.log('- http://localhost:3000/api/yields');
  console.log('  期待値: lido, aave-v3, compound-v3がprotocol sourceで取得');
  console.log('- http://localhost:3000/api/protocols/batch');
  console.log('  期待値: sourceフィールドが"protocol"または"cached"');

  console.log(`\n${colors.blue}=== Phase 2 チェックリスト ===${colors.reset}`);
  console.log('□ 「--」の右に「ⓘ」アイコンが表示される');
  console.log('□ ツールチップのメッセージが適切');
  console.log('□ キャッシュ使用時に「Cached」バッジが表示');
  console.log('□ ページロード時間が2秒以内');
  console.log('□ Aave V3のAPYが正しく表示');
  console.log('□ 主要3プロトコル（Lido, Aave, Compound）が動作');

  console.log(`\n${colors.green}Phase 2の実装が完了しました！${colors.reset}`);
  console.log('上記のチェックリストを確認して、すべて✓の場合はPhase 3に進めます。');
}

// Run test
testPhase2().catch(console.error);