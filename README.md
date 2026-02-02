# 在庫管理アプリ

家庭用の在庫管理Webアプリ。冷蔵庫や日用品の在庫を管理し、買い物が必要なアイテムを一目で確認できます。

## 機能

- アイテムの追加・編集・削除
- カテゴリ分け（冷蔵庫、日用品、その他）
- 在庫数の増減ボタン
- 最小在庫数を下回ると赤で警告表示
- 「買うもの」タブで購入が必要なアイテムだけを表示

## ラズベリーパイでのセットアップ

### 1. Node.js のインストール
通常
```bash
# Node.js 20.x をインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョン確認
node -v
npm -v
```
ARM v6アーキテクチャの場合
```bash
# Node.js 20.x をダウンロード
wget https://unofficial-builds.nodejs.org/download/release/v20.11.0/node-v20.11.0-linux-armv6l.tar.xz

# 解凍してインストール
sudo mkdir -p /usr/local/lib/nodejs
sudo tar -xJvf node-v20.11.0-linux-armv6l.tar.xz -C /usr/local/lib/nodejs

# パスを設定
echo 'export PATH=/usr/local/lib/nodejs/node-v20.11.0-linux-armv6l/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# バージョン確認
node -v
npm -v
```
### 2. アプリのセットアップ

```bash
# アプリのディレクトリに移動
cd /home/pi/stock

# 依存関係をインストール
npm install

# 動作確認（手動起動）
npm start
```

ブラウザで `http://<ラズパイのIP>:3000` にアクセスして確認。

### 3. 自動起動の設定（systemd）

```bash
sudo nano /etc/systemd/system/stock.service
```

以下の内容を貼り付け:

User, WorkingDirectory, ExecStartは環境に応じて見直すこと
```ini
[Unit]
Description=Stock Manager App
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/stock
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

サービスを有効化:

```bash
# サービスを有効化・起動
sudo systemctl enable stock
sudo systemctl start stock

# ステータス確認
sudo systemctl status stock

# ログ確認
journalctl -u stock -f
```

### 4. ファイアウォール設定（必要に応じて）

```bash
sudo ufw allow 3000
```

## ファイル構成

```
stock/
├── index.html      # フロントエンド HTML
├── style.css       # スタイルシート
├── app.js          # フロントエンド JavaScript
├── server.js       # Express サーバー
├── package.json    # 依存関係
├── stock.db        # SQLite データベース（自動生成）
└── favicon.svg     # ファビコン
```

## バックアップ

データベースは `stock.db` ファイルに保存されます。
バックアップはこのファイルをコピーするだけで完了します。

```bash
cp stock.db stock.db.backup
```

## ローカル開発

```bash
npm install
npm start
# http://localhost:3000 にアクセス
```
