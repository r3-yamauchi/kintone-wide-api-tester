/**
 * kintone JavaScript API ブリッジスクリプト
 * 
 * このスクリプトはWebページのメインワールド（ページのJavaScriptコンテキスト）で実行され、
 * ブラウザ拡張機能のコンテンツスクリプトからのリクエストを受けて、
 * kintone JavaScript APIを実際に呼び出します。
 * 
 * 技術的な背景：
 * - ブラウザ拡張機能のコンテンツスクリプトは分離されたワールドで実行されるため、
 *   ページ上のkintoneオブジェクトに直接アクセスできません
 * - そのため、このスクリプトをメインワールドに注入し、
 *   window.postMessageを使用してコンテキスト間の通信を行います
 */
(function () {

  /**
   * デバッグモードフラグ
   * 
   * true: 詳細なデバッグログを出力
   * false: kintone JavaScript API実行結果のみを出力（推奨）
   * 
   * 注意：content.tsのデバッグモードと同期して設定してください
   * デバッグが必要な場合は、config/debug.tsのDEBUG_MODEをtrueに設定し、
   * このファイルのDEBUG_MODEもtrueに変更してください
   */
  const DEBUG_MODE = false;

  /**
   * デバッグ用ログ出力関数
   * DEBUG_MODEがfalseの場合は何も出力しない
   */
  function debugLog(message, data) {
    if (DEBUG_MODE) {
      if (data !== undefined) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * デバッグ用エラーログ出力関数
   * エラーは重要なので、DEBUG_MODEに関係なく常に出力
   */
  function debugError(message, data) {
    if (data !== undefined) {
      console.error(message, data);
    } else {
      console.error(message);
    }
  }

  /**
   * kintone JavaScript API実行結果専用ログ
   * 常に出力される（メインの機能ログ）
   */
  function apiLog(message, data) {
    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }

  /**
   * ログ出力用の結果フォーマット関数
   * 
   * @param {any} data - フォーマットするデータ
   * @returns {string} - フォーマット済みの文字列
   */
  function formatResultForLog(data) {
    if (data === null) return 'null';
    if (data === undefined) return 'undefined';
    if (typeof data === 'string') return '"' + data + '"';
    if (typeof data === 'number' || typeof data === 'boolean') return String(data);
    if (typeof data === 'object') {
      try {
        return JSON.stringify(data, null, 2);
      } catch (error) {
        return '[Object - シリアライゼーション失敗]';
      }
    }
    return String(data);
  }

  /**
   * kintoneメソッドを安全に呼び出すヘルパー関数
   * 
   * @param {string} methodName - 呼び出すkintoneメソッド名（例：'getDomain', 'app.get'）
   * @param {any} args - メソッドの引数（現在は未使用）
   * @param {string|number} appId - 現在のアプリID（利用可能な場合）
   * @returns {Promise<any>} - メソッドの実行結果を含むPromise
   * @throws {Error} - kintoneオブジェクトが見つからない場合やメソッドが存在しない場合
   */
  function callKintoneMethod(methodName, args, appId) {
    // kintoneオブジェクトの存在確認
    debugLog('🔍 kintoneオブジェクトの確認中...');
    debugLog('window.kintone:', typeof window.kintone);
    debugLog('URL:', window.location.href);
    if (appId) {
      debugLog('📋 利用可能なアプリID:', appId);
    }

    if (typeof window.kintone === 'undefined') {
      const errorMsg = `kintoneオブジェクトが見つかりません。

現在のURL: ${window.location.href}
考えられる原因:
1. kintoneアプリページではない
2. ページの読み込みが完了していない
3. JavaScriptが無効になっている

解決方法:
- kintoneアプリページ（例: https://yoursubdomain.cybozu.com/k/123/）でお試しください
- ページを再読み込みしてから再度実行してください`;
      debugError('❌', errorMsg);
      throw new Error(errorMsg);
    }

    debugLog('✅ kintoneオブジェクトを確認しました');


    // 特別なメソッド：実行完了統計を表示
    if (methodName === 'showExecutionSummary') {
      const stats = args && args[0];
      if (stats) {
        console.log('====================================');
        console.log('🎉 kintone Wide API Tester 実行完了');
        console.log('✅ 成功: ' + stats.success + '件');
        console.log('❌ エラー: ' + stats.error + '件');
        console.log('📊 合計: ' + stats.total + '件');
        console.log('====================================');
      }
      return Promise.resolve('終了します。');
    }

    // ログ出力用の特別なメソッド群
    if (methodName === 'logInitialSetup') {
      console.log('🔧 初期設定: アプリID取得中...');
      return Promise.resolve('ログ出力完了');
    }

    if (methodName === 'logAppIdSuccess') {
      const appId = args && args[0];
      console.log('✅ アプリID取得成功: ' + appId);
      return Promise.resolve('ログ出力完了');
    }

    if (methodName === 'logAppIdFailure') {
      const error = args && args[0];
      console.log('⚠️ アプリID取得失敗: ' + error);
      console.log('   アプリページではない可能性があります。一般的なメソッドのみ実行します');
      return Promise.resolve('ログ出力完了');
    }

    if (methodName === 'logAppIdError') {
      const error = args && args[0];
      console.log('⚠️ アプリID取得でエラー: ' + error);
      console.log('   アプリページではない可能性があります。一般的なメソッドのみ実行します');
      return Promise.resolve('ログ出力完了');
    }

    if (methodName === 'logIconsStart') {
      console.log('🔧 実行: kintone.app.getIcons() でアプリアイコン取得中...');
      return Promise.resolve('ログ出力完了');
    }

    // 特別なメソッド：kintone.api()を実行
    if (methodName === 'api') {
      debugLog('🌐 kintone.api() 実行中...', args);
      
      if (!args || args.length < 2) {
        throw new Error('kintone.api() には URL と HTTP メソッドが必要です');
      }
      
      const url = args[0];
      const method = args[1];
      const requestData = args[2] || {};
      
      // kintone.api.url()でフルURLを生成
      const fullUrl = window.kintone.api.url(url);
      debugLog('📍 生成されたURL:', fullUrl);
      
      // kintone.api()を実行
      return window.kintone.api(fullUrl, method, requestData);
    }

    // 通常のメソッド：動的にkintoneメソッドを実行
    try {
      // メソッド名をドット記法で分割（例：'app.get' -> ['app', 'get']）
      const parts = methodName.split('.');
      let obj = window.kintone;

      // 最終メソッドまでオブジェクトパスをたどる
      for (let i = 0; i < parts.length - 1; i++) {
        if (obj[parts[i]]) {
          obj = obj[parts[i]];
        } else {
          throw new Error('Method path not found: ' + parts.slice(0, i + 1).join('.'));
        }
      }

      // 最終的に実行するメソッド名を取得
      const finalMethod = parts[parts.length - 1];

      if (typeof obj[finalMethod] === 'function') {
        // メソッドを実行（現在は引数なしで実行）
        const result = obj[finalMethod].apply(obj, args || []);

        // 結果がPromiseの場合はそのまま返し、そうでなければPromiseでラップ
        if (result && typeof result.then === 'function') {
          return result;
        } else {
          return Promise.resolve(result);
        }
      } else {
        throw new Error('Method not found or not a function: ' + methodName);
      }
    } catch (error) {
      // より詳細なエラー情報を記録して処理を継続
      const errorInfo = {
        method: methodName,
        errorType: error.name || 'UnknownError',
        message: error.message || 'Unknown error occurred',
        status: error.status || null,
        code: error.code || null
      };

      // HTTPエラー（403, 401, 500など）の詳細情報を追加
      if (error.response) {
        errorInfo.httpStatus = error.response.status;
        errorInfo.httpStatusText = error.response.statusText;
      }

      console.warn('⚠️ kintoneメソッド実行エラー（処理継続）:', errorInfo);

      // エラーをthrowせずにPromise.rejectで返すことで、上位レイヤーでハンドリング可能にする
      return Promise.reject({
        method: methodName,
        message: error.message || 'メソッド実行に失敗しました',
        details: errorInfo
      });
    }
  }

  /**
   * コンテンツスクリプトからのメッセージを受信するイベントリスナー
   * window.postMessageを使用したクロスコンテキスト通信
   * セキュリティ強化：origin検証とデータ検証を実装
   */
  window.addEventListener('message', function (event) {
    // セキュリティチェック1: 自分のウィンドウからのメッセージかチェック
    if (event.source !== window) {
      return;
    }

    // セキュリティチェック2: メッセージ形式の検証
    if (!event.data || typeof event.data !== 'object' ||
      event.data.type !== 'KINTONE_METHOD_REQUEST') {
      return;
    }

    // セキュリティチェック3: 必要なプロパティの存在確認
    if (typeof event.data.method !== 'string') {
      debugLog('無効なメソッド名:', event.data.method);
      return;
    }

    const methodName = event.data.method;

    // 内部メソッドかどうかを判定
    const isInternalMethod = methodName.startsWith('log') || methodName === 'showExecutionSummary';

    try {

      // 実行開始ログをkintoneページのコンソールに出力（内部メソッド以外）
      if (methodName !== 'listMethods' && !isInternalMethod) {
        if (methodName === 'api') {
          // APIのURLに応じてメッセージを変更
          const apiUrl = event.data.args && event.data.args[0];
          if (apiUrl === '/k/v1/apps/statistics.json') {
            console.log('📝 アプリの使用状況を取得 /k/v1/apps/statistics.json 実行中...');
          } else if (apiUrl === '/k/v1/spaces/statistics.json') {
            console.log('📝 スペースの使用状況を取得 /k/v1/spaces/statistics.json 実行中...');
          } else {
            console.log(`📝 kintone.api(${apiUrl}) 実行中...`);
          }
        } else {
          console.log(`📝 kintone.${methodName}() 実行中...`);
        }
      } else if (isInternalMethod && DEBUG_MODE) {
        debugLog(`📝 [内部メソッド] ${methodName}() 実行中...`);
      }

      // kintoneメソッドを実行（アプリIDも渡す）
      const result = callKintoneMethod(methodName, event.data.args, event.data.appId);

      if (result && typeof result.then === 'function') {
        // Promise型の結果の場合
        result
          .then(function (data) {
            // 特殊なケースの処理：DOM要素は文字列に変換
            let displayData = data;
            if (data && typeof data === 'object' && data.nodeType) {
              // DOM要素をHTML文字列に変換
              displayData = data.outerHTML || data.toString();
            }

            // 成功ログをkintoneページのコンソールに出力（内部メソッド以外）
            if (methodName !== 'listMethods' && !isInternalMethod) {
              const formattedResult = formatResultForLog(displayData);
              if (methodName === 'api') {
                // APIのURLに応じてメッセージを変更
                const apiUrl = event.data.args && event.data.args[0];
                if (apiUrl === '/k/v1/apps/statistics.json') {
                  console.log('✅ アプリの使用状況を取得 /k/v1/apps/statistics.json 結果:');
                } else if (apiUrl === '/k/v1/spaces/statistics.json') {
                  console.log('✅ スペースの使用状況を取得 /k/v1/spaces/statistics.json 結果:');
                } else {
                  console.log(`✅ kintone.api(${apiUrl}) 結果:`);
                }
              } else {
                console.log(`✅ kintone.${methodName}() 結果:`);
              }
              console.log(`   ${formattedResult}`);
            } else if (isInternalMethod && DEBUG_MODE) {
              const formattedResult = formatResultForLog(displayData);
              debugLog(`✅ [内部メソッド] ${methodName}() 結果:`);
              debugLog(`   ${formattedResult}`);
            }

            // 成功結果をコンテンツスクリプトに返送
            window.postMessage({
              type: 'KINTONE_METHOD_RESPONSE',
              success: true,
              data: displayData
            }, '*');
          })
          .catch(function (error) {
            // エラーの詳細情報を構築
            let errorMessage = error.message || 'Unknown error';
            let errorDetails = '';

            // HTTPエラーコードの特別な処理
            if (error.status || (error.details && error.details.httpStatus)) {
              const status = error.status || error.details.httpStatus;
              switch (status) {
                case 403:
                  errorDetails = ' (権限エラー: このAPIにアクセスする権限がありません)';
                  break;
                case 401:
                  errorDetails = ' (認証エラー: ログインが必要です)';
                  break;
                case 404:
                  errorDetails = ' (見つかりません: 指定されたリソースが存在しません)';
                  break;
                case 500:
                  errorDetails = ' (サーバーエラー: kintoneサーバー側で問題が発生しました)';
                  break;
                default:
                  errorDetails = ` (HTTPエラー: ${status})`;
              }
            }

            // エラーログをkintoneページのコンソールに出力（内部メソッド以外）
            if (!isInternalMethod) {
              if (methodName === 'api') {
                // APIのURLに応じてメッセージを変更
                const apiUrl = event.data.args && event.data.args[0];
                if (apiUrl === '/k/v1/apps/statistics.json') {
                  console.log(`❌ アプリの使用状況を取得 /k/v1/apps/statistics.json エラー: ${errorMessage + errorDetails}`);
                } else if (apiUrl === '/k/v1/spaces/statistics.json') {
                  console.log(`❌ スペースの使用状況を取得 /k/v1/spaces/statistics.json エラー: ${errorMessage + errorDetails}`);
                } else {
                  console.log(`❌ kintone.api(${apiUrl}) エラー: ${errorMessage + errorDetails}`);
                }
              } else {
                console.log(`❌ kintone.${methodName}() エラー: ${errorMessage + errorDetails}`);
              }
            } else if (DEBUG_MODE) {
              debugLog(`❌ [内部メソッド] ${methodName}() エラー: ${errorMessage + errorDetails}`);
            }

            // デバッグ情報を出力（処理は継続）
            console.warn(`⚠️ ${methodName} 実行エラー（処理継続）:`, {
              message: errorMessage,
              details: error.details || error,
              継続: 'このエラーは記録されましたが、他のメソッドの実行は継続されます'
            });

            // エラー結果をコンテンツスクリプトに返送
            window.postMessage({
              type: 'KINTONE_METHOD_RESPONSE',
              success: false,
              error: errorMessage + errorDetails
            }, '*');
          });
      } else {
        // 同期型の結果の場合
        let displayData = result;
        if (result && typeof result === 'object' && result.nodeType) {
          // DOM要素をHTML文字列に変換
          displayData = result.outerHTML || result.toString();
        }

        // 成功ログをkintoneページのコンソールに出力（内部メソッド以外）
        if (methodName !== 'listMethods' && !isInternalMethod) {
          const formattedResult = formatResultForLog(displayData);
          if (methodName === 'api') {
            // APIのURLに応じてメッセージを変更
            const apiUrl = event.data.args && event.data.args[0];
            if (apiUrl === '/k/v1/apps/statistics.json') {
              console.log('✅ アプリの使用状況を取得 /k/v1/apps/statistics.json 結果:');
            } else if (apiUrl === '/k/v1/spaces/statistics.json') {
              console.log('✅ スペースの使用状況を取得 /k/v1/spaces/statistics.json 結果:');
            } else {
              console.log(`✅ kintone.api(${apiUrl}) 結果:`);
            }
          } else {
            console.log(`✅ kintone.${methodName}() 結果:`);
          }
          console.log(`   ${formattedResult}`);
        } else if (isInternalMethod && DEBUG_MODE) {
          const formattedResult = formatResultForLog(displayData);
          debugLog(`✅ [内部メソッド] ${methodName}() 結果:`);
          debugLog(`   ${formattedResult}`);
        }

        // 成功結果をコンテンツスクリプトに返送
        window.postMessage({
          type: 'KINTONE_METHOD_RESPONSE',
          success: true,
          data: displayData
        }, '*');
      }
    } catch (error) {
      // 予期しないエラーの詳細情報を記録
      const unexpectedError = {
        method: methodName,
        type: 'UnexpectedError',
        message: error.message || 'Unknown unexpected error',
        stack: error.stack,
        timestamp: new Date().toISOString()
      };

      console.error('🚨 予期しないエラーが発生しましたが、処理を継続します:', unexpectedError);

      // エラーメッセージを返送（処理は継続）
      let errorMsg = `予期しないエラー: ${error.message || 'Unknown error'} (処理は継続されます)`;
      if (!isInternalMethod) {
        if (methodName === 'api') {
          // APIのURLに応じてメッセージを変更
          const apiUrl = event.data.args && event.data.args[0];
          if (apiUrl === '/k/v1/apps/statistics.json') {
            console.log(`❌ アプリの使用状況を取得 /k/v1/apps/statistics.json 予期しないエラー: ${error.message || 'Unknown error'}`);
          } else if (apiUrl === '/k/v1/spaces/statistics.json') {
            console.log(`❌ スペースの使用状況を取得 /k/v1/spaces/statistics.json 予期しないエラー: ${error.message || 'Unknown error'}`);
          } else {
            console.log(`❌ kintone.api(${apiUrl}) 予期しないエラー: ${error.message || 'Unknown error'}`);
          }
        } else {
          console.log(`❌ kintone.${methodName}() 予期しないエラー: ${error.message || 'Unknown error'}`);
        }
      } else if (DEBUG_MODE) {
        debugLog(`❌ [内部メソッド] ${methodName}() 予期しないエラー: ${error.message || 'Unknown error'}`);
      }

      window.postMessage({
        type: 'KINTONE_METHOD_RESPONSE',
        success: false,
        error: errorMsg
      }, '*');
    }
  });
})();