# デプロイと運用

このドキュメントでは、Peace WishlistのAWS CDKスタック、GitHub ActionsによるCI/CD、OIDC認証、監視、初回セットアップについて説明します。

[READMEへ戻る](../README.md)

## AWS構成

| 分類 | AWSリソース | 用途 |
| --- | --- | --- |
| Frontend | S3, CloudFront | 静的ファイルの保存とHTTPS配信 |
| API | API Gateway HTTP API, Lambda | HTTP APIの公開と処理 |
| Database | DynamoDB | グループとやりたいことの保存 |
| Monitoring | CloudWatch Logs, CloudWatch Alarms, SNS | ログ保存、異常検知、メール通知 |
| Infrastructure as Code | AWS CDK, CloudFormation | AWSリソースの定義とデプロイ |

S3バケットのPublic Accessは無効化し、CloudFrontからS3へのアクセスにはOrigin Access Controlを使用しています。HTTPアクセスはHTTPSへリダイレクトします。

FrontendはSPAとして動作するため、CloudFrontがS3から403または404を受け取った場合は`index.html`を返します。

## CDKスタック

| Stack | 管理する内容 | デプロイ方法 |
| --- | --- | --- |
| `PeaceWishlistGitHubActionsIdentityStack` | GitHub OIDC Provider、GitHub Actions用IAM Role | 初回または認証設定変更時にローカルから手動デプロイ |
| `PeaceWishlistStack` | Lambda、API Gateway、DynamoDB、S3、CloudFront、CloudWatch、SNS | `main`へのpush後にGitHub Actionsから自動デプロイ |

認証基盤とアプリケーションを分離し、通常のアプリケーションデプロイではOIDC Providerやデプロイ用IAM Roleを変更しない構成にしています。

## CI/CD

### 実行条件

| イベント | 実行内容 |
| --- | --- |
| `main`ブランチを対象とするpull request | CIのみ |
| `main`ブランチへのpush | CI成功後に本番環境へ自動デプロイ |

### CI

| Job | 検証内容 |
| --- | --- |
| Backend | Vitestによるテスト、TypeScriptの型チェック |
| Frontend | TypeScriptの型チェックを含むproduction build |
| Infrastructure | Frontend build、Infrastructure build、CDK synth |

InfrastructureのCIでは、LambdaのbundleとFrontendのS3 Assetを含め、クリーンな環境からCloudFormationテンプレートを生成できることを確認します。

### CD

`main`へのpush時は、Backend、Frontend、InfrastructureのCIがすべて成功した場合だけ`Deploy` Jobを実行します。

```text
mainへpush
  → Backend・Frontend・InfrastructureのCI
  → GitHub Actions OIDCでAWSのIAM Roleを引き受ける
  → CloudFormation Outputから本番API URLを取得
  → Frontendを本番API URLでbuild
  → cdk deploy PeaceWishlistStack
  → Lambda、API Gateway、S3、CloudFrontへ反映
```

同時に複数のデプロイがAWS環境を更新しないよう、GitHub Actionsの`concurrency`で本番デプロイを直列化しています。現在はファイルパスによる除外を設けていないため、READMEのみの変更を含め、`main`へのすべてのpushでCI/CDを実行します。

## GitHub Actions OIDC

GitHub ActionsからAWSへの認証にはOIDCを使用しています。固定のAWSアクセスキーをGitHubへ保存せず、Workflow実行時だけ有効な一時認証情報でデプロイします。

IAM Roleの信頼ポリシーは、次の条件に限定しています。

- AudienceがAWS STSの`sts.amazonaws.com`であること
- 対象が`dora937nishikori/peace-wishlist`であること
- GitHubの不変なOwner IDとRepository IDが一致すること
- `main`ブランチからのWorkflow実行であること

GitHub Actions用IAM Roleには、CDK Bootstrapが作成したRoleのうち、`deploy`、`file-publishing`、`image-publishing`、`lookup`のタグを持つRoleを引き受ける権限を付与しています。また、Frontendのbuildに必要なAPI URLを取得するため、`PeaceWishlistStack`に対する`cloudformation:DescribeStacks`を許可しています。

### Repository Secrets

| Secret | 用途 |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | GitHub Actionsが引き受けるIAM RoleのARN |
| `ALARM_EMAIL` | CloudWatch Alarmの通知先メールアドレス |

AWSアカウントID、Role ARN、通知先メールアドレスはWorkflowへ直接記述しません。

## 初回セットアップ

### 1. 依存関係とFrontend Assetの準備

CDKアプリはLambdaのbundleと`frontend/dist`を参照するため、各ディレクトリの依存関係をインストールし、Frontendをbuildします。

```bash
cd backend
npm ci

cd ../frontend
npm ci
VITE_API_BASE_URL=https://example.execute-api.ap-northeast-1.amazonaws.com npm run build

cd ../infra
npm ci
```

### 2. CDK Bootstrap

対象AWSアカウントの東京リージョンをCDK Bootstrapします。

```bash
npx cdk bootstrap aws://<AWS_ACCOUNT_ID>/ap-northeast-1
```

CDK Bootstrapは、CloudFormationによるデプロイ、AssetのS3への公開、環境情報のlookupなどに使用するIAM RoleとS3 Bucketを作成します。

### 3. OIDC認証基盤のデプロイ

OIDC ProviderとGitHub Actions用IAM Roleを、認証済みのローカル環境からデプロイします。

```bash
ALARM_EMAIL=example@example.com npx cdk deploy PeaceWishlistGitHubActionsIdentityStack
```

デプロイ後に出力される`GitHubActionsDeployRoleArn`を、GitHubのRepository Secret `AWS_DEPLOY_ROLE_ARN`へ登録します。通知先メールアドレスは`ALARM_EMAIL`へ登録します。

OIDC ProviderはAWSアカウント内でURLごとに一つだけ作成できます。別の用途ですでにGitHub OIDC Providerを作成している場合は、新規作成ではなく既存Providerの参照を検討する必要があります。

### 4. アプリケーションの初回デプロイ

自動デプロイは既存の`PeaceWishlistStack`からAPI URLを取得するため、新しいAWS環境では最初のアプリケーションデプロイをローカルから行います。

1. 仮のAPI URLでFrontendをbuildする
2. `PeaceWishlistStack`をデプロイしてAPIを作成する
3. CloudFormation Outputの`ApiUrl`を取得する
4. 実際のAPI URLでFrontendをbuildし、再度デプロイする

```bash
cd frontend
VITE_API_BASE_URL=https://example.execute-api.ap-northeast-1.amazonaws.com npm run build

cd ../infra
ALARM_EMAIL=example@example.com npx cdk deploy PeaceWishlistStack
```

初回デプロイで表示された`ApiUrl`を指定し、もう一度buildとデプロイを実行します。

```bash
cd ../frontend
VITE_API_BASE_URL=<ApiUrl> npm run build

cd ../infra
ALARM_EMAIL=example@example.com npx cdk deploy PeaceWishlistStack
```

以後は`main`へのpushで自動デプロイできます。

## 監視

- 各LambdaのCloudWatch Logsを30日間保持
- 各Lambdaで5分間に1件以上の実行エラーが発生した場合にAlarm
- API Gatewayで5分間に1件以上の5XXが発生した場合にAlarm
- Alarm発生時はSNSからメール通知
- メトリクスが存在しない期間はAlarmとして扱わない

アプリケーション側で例外を捕捉してHTTP 500を返した場合、Lambdaの`Errors`メトリクスには現れません。そのため、Lambdaの実行エラーに加えてAPI Gatewayの5XXも監視しています。

AWS BudgetsはCDKとは別に設定し、月額利用料金を監視しています。

## コスト方針

- Lambda、API Gateway、DynamoDBなど、リクエスト量に応じて利用料金が変わるManaged Serviceを利用する
- DynamoDBはオンデマンドキャパシティーモードを使用する
- Lambdaのログを無期限に保持せず、30日で削除する
- AWS Budgetsで想定外の利用料金を検知する

## 現在の運用上の制約

- DynamoDBテーブルとFrontend用S3 Bucketは`RemovalPolicy.DESTROY`であり、CDKスタックを削除するとデータも削除されます。
- Frontend用S3 Bucketはスタック削除時にオブジェクトも自動削除します。
- 自動デプロイは既存スタックの`ApiUrl`を利用するため、まったく新しい環境の初回構築には対応していません。
- 認証用スタックの変更は自動デプロイされないため、ローカルから明示的にデプロイする必要があります。
- CloudFormationによるデプロイに失敗した場合はJobが失敗し、後続の反映は完了しません。アプリケーション固有の段階的リリースやカナリアリリースは実装していません。
