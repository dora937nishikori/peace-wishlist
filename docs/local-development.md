# ローカル動作確認

AWSへデプロイせずに、グループ作成から詳細の編集・削除まで確認できます。

## 起動方法

ターミナルを2つ開きます。

1つ目のターミナルで、メモリ保存のローカルAPIを起動します。

```bash
cd backend
npm run dev:local
```

2つ目のターミナルで、ローカルAPIへ接続するFrontendを起動します。

```bash
cd frontend
npm run dev:local
```

ブラウザで`http://localhost:5173`を開きます。

## ローカルAPIの特徴

- AWSの認証情報やDynamoDBは不要です。
- グループ、共有URL、一覧、詳細、コメント、URL、編集、削除を確認できます。
- 入力検証とURLの`https://`補完には本番と同じドメインロジックを使います。
- データはメモリにだけ保存され、Backendのプロセスを終了すると消えます。
- 通常の`npm run dev`は、これまでどおり`.env.local`で指定されたAPIへ接続します。

ローカルAPIのポートを変更する場合は、Backend起動時に`LOCAL_API_PORT`を指定してください。その場合、Frontendの`vite.config.ts`にあるローカルAPI URLも同じポートへ変更します。
