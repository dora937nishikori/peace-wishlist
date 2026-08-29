# Backend設計

このドキュメントでは、Peace WishlistのAPI、共有URLによるアクセス方式、DynamoDBのデータ設計、Backendコードの責務分離について説明します。

[READMEへ戻る](../README.md)

## 設計の前提

Peace Wishlistは、友人・家族など少人数の信頼されたメンバーでの利用を想定しています。利用開始時の手間を減らすため、ユーザーアカウントを作らず、グループごとの共有URLを使ってアクセスを制御します。

この方式は、メンバーごとの本人確認や権限管理よりも、少人数で簡単に使い始められることを優先したものです。

## API

| Method | Endpoint | 概要 | アクセス制御 |
| --- | --- | --- | --- |
| POST | `/groups` | グループ作成 | 不要 |
| GET | `/groups/{groupId}` | グループ取得 | Bearer Token |
| GET | `/groups/{groupId}/items` | やりたいこと一覧取得 | Bearer Token |
| POST | `/groups/{groupId}/items` | やりたいこと追加 | Bearer Token |
| PATCH | `/groups/{groupId}/items/{itemId}` | やりたいこと編集 | Bearer Token |
| DELETE | `/groups/{groupId}/items/{itemId}` | やりたいこと削除 | Bearer Token |

## アクセストークンによる認可

### トークンの発行と保存

グループ作成時に、Node.jsの`crypto.randomBytes`で32バイトのランダムなアクセストークンを生成します。

DynamoDBへ保存するのは、トークンそのものではなくSHA-256でハッシュ化した値です。APIのレスポンスで受け取ったアクセストークンは、共有URLを組み立てるためにFrontendで使用します。

```text
Raw Access Token
  ├─ 共有URLとして利用者へ返す
  └─ SHA-256でハッシュ化してDynamoDBへ保存
```

### URLフラグメントの利用

当初はアクセストークンを次のクエリパラメータへ含めていました。

```text
/groups/{groupId}?token={accessToken}
```

クエリパラメータはページ取得時のHTTPリクエストに含まれるため、アクセストークンを必要としないCloudFrontなどにも送信されます。そこで、共有URLを次の形式へ変更しました。

```text
/groups/{groupId}#token={accessToken}
```

URLフラグメントはページ取得時にサーバーへ送信されません。React側でフラグメントからトークンを取得し、APIを呼び出すときだけ`Authorization`ヘッダーへ設定します。

```http
Authorization: Bearer <accessToken>
```

### APIでの検証

Lambda側では、受信したトークンをSHA-256でハッシュ化し、DynamoDB上のハッシュ値と比較します。比較には`timingSafeEqual`を使用しています。

### この方式の制約

- 共有URLを知る利用者は、グループ内の項目を追加・編集・削除できます。
- 利用者ごとの本人確認や権限管理は行いません。
- URLを誤って共有した場合の個別アクセス無効化や、トークン再発行には対応していません。
- URLフラグメントは最初のHTTPリクエストには含まれませんが、ブラウザ履歴、画面共有、コピー操作などから漏れる可能性は残ります。

この制約から、現時点では少人数の信頼されたメンバーによる利用を対象としています。

## DynamoDB設計

### 採用理由

MVPで必要な主なアクセスパターンは次の3つです。

- `groupId`によるグループ取得
- `groupId`によるやりたいこと一覧の取得
- `groupId + itemId`による更新・削除

JOINや複雑な検索を必要とせず、Lambdaからのコネクション管理も不要です。また、少人数でアクセス頻度が低い時間の多い利用を想定しているため、DynamoDBのオンデマンドキャパシティーモードを採用しました。

複雑な検索・集計・リレーションが主要要件になった場合は、RDBを含めてデータストアを再検討します。

### Groupsテーブル

| Attribute | 用途 |
| --- | --- |
| `groupId` | Partition Key |
| `groupName` | グループ名 |
| `accessTokenHash` | アクセストークンのハッシュ値 |
| `createdByDisplayName` | グループ作成時に入力された表示名 |
| `createdAt` | 作成日時 |

### WishItemsテーブル

| Attribute | 用途 |
| --- | --- |
| `groupId` | Partition Key |
| `itemId` | Sort Key |
| `content` | やりたいこと |
| `createdByDisplayName` | 登録時に入力された表示名 |
| `updatedByDisplayName` | 最終更新時に入力された表示名 |
| `createdAt` | 作成日時 |
| `updatedAt` | 更新日時 |
| `createdAtItemId` | 作成日時順取得用のGSI Sort Key |

### 作成日時順の取得

やりたいことを作成日時の新しい順で取得するため、次のGSIを設定しています。

```text
Index:         ItemsByCreatedAt
Partition Key: groupId
Sort Key:      createdAtItemId
```

`createdAtItemId`には`{createdAt}#{itemId}`を保存します。作成日時だけでなく`itemId`も含めることで、同一時刻に作成された項目がある場合もSort Keyを一意にしています。

## コードの責務分離

Backendは、主に次の責務へ分けています。

```text
Domain Logic
  → 入力値の検証、ID・日時・Entityの生成

Lambda Handler
  → HTTPリクエストの解釈、認可、レスポンス生成

Repository Interface
  → 永続化に必要な操作の定義

DynamoDB Repository
  → DynamoDB固有の読み書き
```

ドメインロジックをLambda HandlerやDynamoDBアクセスから分離することで、AWSへ接続せずに入力検証やEntity生成をテストできます。

HandlerはRepositoryのインターフェースへ依存し、テスト時はFake Repositoryへ差し替えます。正常系だけでなく、対象データが存在しない場合、認可に失敗した場合、Repositoryで例外が発生した場合なども検証しています。

## 永続化モデルとAPIレスポンスの分離

DynamoDBには、作成日時順で取得するための内部属性`createdAtItemId`を保存していますが、この属性はFrontendでは使用しません。

DynamoDBから取得したオブジェクトをそのまま返さず、APIレスポンス用の型へ変換することで、内部管理用の属性が意図せず外部APIへ公開されることを防ぎやすくしています。

## 現在の改善課題

- 入力値の最大長など、サーバー側の制限を追加する
- 不正・大量リクエストに対するレート制限を検討する
- 認可処理とエラーレスポンスを共通化する
- アクセストークンの再発行に対応する
- 一覧取得をページネーションへ対応させる
- データ量と検索要件の変化に応じてデータストアを再評価する
