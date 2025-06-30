/**
 * デバッグ設定管理
 * 
 * kintoneワイドコースAPIテスターのデバッグモードを一元管理します。
 * 本番環境では不要なログ出力を制御し、開発時のみ詳細情報を表示します。
 */

/**
 * デバッグモードフラグ
 * 
 * true: 詳細なデバッグログを出力（開発時）
 * false: kintoneワイドコースAPI実行結果のみを出力（本番推奨）
 * 
 * 注意：このフラグを変更した場合は、public/kintone-bridge.js内の
 * DEBUG_MODEフラグも同じ値に手動で変更してください。
 * 両ファイルで設定を同期する必要があります。
 */
export const DEBUG_MODE = false;

/**
 * デバッグ用ログ出力関数
 * 
 * 開発時のデバッグ情報を出力します。
 * DEBUG_MODEがfalseの場合は何も出力されません。
 * 
 * @param message - ログメッセージ
 * @param data - 追加データ（オプション）
 */
export function debugLog(message: string, data?: any): void {
  if (DEBUG_MODE) {
    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}

/**
 * デバッグ用警告ログ出力関数
 * 
 * 開発時の警告情報を出力します。
 * DEBUG_MODEがfalseの場合は何も出力されません。
 * 
 * @param message - 警告メッセージ
 * @param data - 追加データ（オプション）
 */
export function debugWarn(message: string, data?: any): void {
  if (DEBUG_MODE) {
    if (data !== undefined) {
      console.warn(message, data);
    } else {
      console.warn(message);
    }
  }
}

/**
 * デバッグ用エラーログ出力関数
 * 
 * エラー情報を出力します。
 * エラーは重要なので、DEBUG_MODEの設定に関係なく常に出力されます。
 * 
 * @param message - エラーメッセージ
 * @param data - 追加データ（オプション）
 */
export function debugError(message: string, data?: any): void {
  if (data !== undefined) {
    console.error(message, data);
  } else {
    console.error(message);
  }
}

/**
 * kintoneワイドコースAPI実行結果専用ログ出力関数
 * 
 * ワイドコースAPIの実行結果を出力します。
 * これはメインの機能ログなので、DEBUG_MODEの設定に関係なく常に出力されます。
 * 
 * @param message - メッセージ
 * @param data - 追加データ（オプション）
 */
export function apiLog(message: string, data?: any): void {
  if (data !== undefined) {
    console.log(message, data);
  } else {
    console.log(message);
  }
}