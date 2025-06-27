/**
 * デバッグ設定管理
 * 
 * デバッグモードの有効/無効を一元管理し、
 * 本番環境では不要なログ出力を制御します。
 */

/**
 * デバッグモードフラグ
 * 
 * true: 詳細なデバッグログを出力
 * false: kintone JavaScript API実行結果のみを出力（推奨）
 * 
 * 注意：このフラグを変更した場合は、public/kintone-bridge.js内の
 * DEBUG_MODEも同じ値に手動で変更してください
 */
export const DEBUG_MODE = false;

/**
 * デバッグ用ログ出力関数
 * DEBUG_MODEがfalseの場合は何も出力しない
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
 * DEBUG_MODEがfalseの場合は何も出力しない
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
 * エラーは重要なので、DEBUG_MODEに関係なく常に出力
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
 * kintone JavaScript API実行結果専用ログ
 * 常に出力される（メインの機能ログ）
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